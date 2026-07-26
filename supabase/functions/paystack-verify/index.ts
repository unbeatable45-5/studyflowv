import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { reference } = await req.json();
    if (!reference || typeof reference !== "string") {
      return new Response(JSON.stringify({ error: "Missing reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Prevent replay: reject if this reference was already redeemed.
    const { data: existingRef } = await supabaseAdmin
      .from("used_payment_references")
      .select("reference")
      .eq("reference", reference)
      .maybeSingle();

    if (existingRef) {
      return new Response(
        JSON.stringify({ success: false, error: "Reference already redeemed" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const data = await response.json();

    if (data.status && data.data.status === "success") {
      // Enforce that the reference was paid by this authenticated user.
      const metaUserId = data.data.metadata?.user_id;
      if (metaUserId && metaUserId !== user.id) {
        return new Response(
          JSON.stringify({ success: false, error: "Reference does not belong to user" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Atomically record the reference; if a concurrent request already claimed it, reject.
      const { error: insertRefError } = await supabaseAdmin
        .from("used_payment_references")
        .insert({ reference, user_id: user.id });

      if (insertRefError) {
        // Unique violation => already redeemed by a concurrent request.
        return new Response(
          JSON.stringify({ success: false, error: "Reference already redeemed" }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const plan = data.data.metadata?.plan || "weekly";
      const periodEnd = new Date();

      if (plan === "monthly") {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setDate(periodEnd.getDate() + 7);
      }

      await supabaseAdmin.from("subscriptions").upsert(
        {
          user_id: user.id,
          paystack_customer_code: data.data.customer?.customer_code || null,
          paystack_email: data.data.customer?.email || null,
          plan: "premium",
          status: "active",
          current_period_end: periodEnd.toISOString(),
        },
        { onConflict: "user_id" }
      );

      return new Response(
        JSON.stringify({ success: true, premium: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: "Payment not verified" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
