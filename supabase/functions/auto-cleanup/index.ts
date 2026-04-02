import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const cutoff = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();

    // Get free users (no active subscription)
    const { data: activeSubs } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("status", "active");

    const premiumUserIds = (activeSubs || []).map((s: any) => s.user_id);

    // Delete saved_outputs older than 36h for non-premium users
    let query = supabase
      .from("saved_outputs")
      .delete()
      .lt("created_at", cutoff);

    if (premiumUserIds.length > 0) {
      // Filter out premium users - delete only free users' old outputs
      // We need to get the IDs first, then delete
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
      // No premium users, delete all old outputs
      const { error, count } = await query;
      if (error) throw error;

      return new Response(JSON.stringify({ deleted: count ?? 0, message: "Cleanup complete (no premium users)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("Cleanup error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
