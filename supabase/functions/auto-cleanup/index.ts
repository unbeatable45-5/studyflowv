import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Require a shared cron secret to prevent public triggering of mass deletion.
  const expected = Deno.env.get("CRON_SECRET");
  if (!expected) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization") || "";
  const providedFromBearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const providedFromHeader = req.headers.get("x-cron-secret") || "";
  const provided = providedFromBearer || providedFromHeader;
  if (!provided || provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const cutoff = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();

    const { data: activeSubs } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("status", "active");

    const premiumUserIds = (activeSubs || []).map((s: any) => s.user_id);

    if (premiumUserIds.length > 0) {
      const { data: toDelete } = await supabase
        .from("saved_outputs")
        .select("id, user_id")
        .lt("created_at", cutoff);

      const idsToDelete = (toDelete || [])
        .filter((row: any) => !premiumUserIds.includes(row.user_id))
        .map((row: any) => row.id);

      if (idsToDelete.length === 0) {
        return new Response(JSON.stringify({ deleted: 0, message: "No expired outputs for free users" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error, count } = await supabase
        .from("saved_outputs")
        .delete({ count: "exact" })
        .in("id", idsToDelete);

      if (error) throw error;

      return new Response(JSON.stringify({ deleted: count ?? idsToDelete.length, message: "Cleanup complete" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      const { error, count } = await supabase
        .from("saved_outputs")
        .delete({ count: "exact" })
        .lt("created_at", cutoff);
      if (error) throw error;

      return new Response(JSON.stringify({ deleted: count ?? 0, message: "Cleanup complete (no premium users)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("Cleanup error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
