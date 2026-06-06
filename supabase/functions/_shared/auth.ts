// Shared auth + server-side usage-limit enforcement for AI edge functions.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export interface AuthedUser {
  id: string;
  email?: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Validate the caller's Supabase JWT. Returns the user or a 401 Response. */
export async function requireAuth(req: Request): Promise<AuthedUser | Response> {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }
  const token = authHeader.slice(7).trim();
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return json({ error: "Server misconfigured" }, 500);

  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return json({ error: "Unauthorized" }, 401);
  return { id: data.user.id, email: data.user.email ?? undefined };
}

/** Service-role client for privileged reads (usage counts, subscription lookups). */
export function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

async function isPremium(userId: string): Promise<boolean> {
  try {
    const svc = serviceClient();
    const { data } = await svc
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data || data.status !== "active" || !data.current_period_end) return false;
    return new Date(data.current_period_end) > new Date();
  } catch {
    return false;
  }
}

const FREE = {
  summaries_per_day: 3,
  pdfs_per_day: 3,
  daily_questions: 1,
  deep_think_per_day: 2,
  practice_exams_per_week: 1,
};
const PRO = {
  summaries_per_day: 50,
  pdfs_per_day: 50,
  daily_questions: 10,
  deep_think_per_day: 20,
  practice_exams_per_week: Infinity,
};

export type LimitKind =
  | "summaries"
  | "pdfs"
  | "daily_questions"
  | "deep_think"
  | "practice_exam";

/**
 * Enforce per-user usage limits server-side by counting rows in saved_outputs.
 * Returns a 429 Response if over-limit, otherwise null.
 */
export async function enforceLimit(userId: string, kind: LimitKind): Promise<Response | null> {
  const premium = await isPremium(userId);
  const limits = premium ? PRO : FREE;
  const svc = serviceClient();

  let toolFilter: string[] = [];
  let windowStartIso = "";
  let cap = Infinity;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  switch (kind) {
    case "summaries":
      toolFilter = ["study-helper", "note-organizer", "pdf-summarizer"];
      windowStartIso = startOfDay;
      cap = limits.summaries_per_day;
      break;
    case "pdfs":
      toolFilter = ["pdf-summarizer"];
      windowStartIso = startOfDay;
      cap = limits.pdfs_per_day;
      break;
    case "daily_questions":
      toolFilter = ["daily-question"];
      windowStartIso = startOfDay;
      cap = limits.daily_questions;
      break;
    case "deep_think":
      toolFilter = ["ai-tutor-deep"];
      windowStartIso = startOfDay;
      cap = limits.deep_think_per_day;
      break;
    case "practice_exam":
      toolFilter = ["practice-exam"];
      windowStartIso = sevenDaysAgo;
      cap = limits.practice_exams_per_week;
      break;
  }

  if (cap === Infinity) return null;

  const { count, error } = await svc
    .from("saved_outputs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("tool", toolFilter)
    .gte("created_at", windowStartIso);

  if (error) {
    // Fail open on count errors, but log.
    console.error("enforceLimit count error:", error);
    return null;
  }

  if ((count ?? 0) >= cap) {
    return json(
      {
        error: premium
          ? "Plan limit reached. Please try again later."
          : "Free tier limit reached. Upgrade to Pro for more usage.",
        limitReached: true,
      },
      429
    );
  }
  return null;
}
