import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.text();

    // Verify Paystack signature
    const signature = req.headers.get("x-paystack-signature");
    const hash = createHmac("sha512", paystackSecretKey)
      .update(body)
      .digest("hex");

    if (signature !== hash) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body);
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (event.event === "charge.success") {
      const { metadata, customer } = event.data;
      const userId = metadata?.user_id;

      if (!userId) {
        return new Response(JSON.stringify({ error: "No user_id in metadata" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const plan = metadata?.plan || "monthly";
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + (plan === "yearly" ? 12 : 1));

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          paystack_customer_code: customer?.customer_code || null,
          paystack_email: customer?.email || null,
          plan: "premium",
          status: "active",
          current_period_end: periodEnd.toISOString(),
        },
        { onConflict: "user_id" }
      );
    }

    if (event.event === "subscription.disable" || event.event === "charge.failed") {
      const userId = event.data?.metadata?.user_id;
      if (userId) {
        await supabase
          .from("subscriptions")
          .update({ status: "inactive", plan: "free" })
          .eq("user_id", userId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
