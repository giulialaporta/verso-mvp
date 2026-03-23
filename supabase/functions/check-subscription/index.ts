import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: unknown) => {
  console.log(`[CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

/** Safely convert a Stripe timestamp (seconds) to ISO string. Returns null on any failure. */
function safeTimestamp(value: unknown): string | null {
  if (value == null) return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  try {
    const d = new Date(num * 1000);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      // Graceful: no auth → not subscribed (avoids 500 on race conditions)
      logStep("No auth header, returning unsubscribed");
      return new Response(JSON.stringify({ subscribed: false, subscription_end: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) {
      logStep("User not authenticated, returning unsubscribed");
      return new Response(JSON.stringify({ subscribed: false, subscription_end: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      await supabase.from("profiles").update({ is_pro: false, stripe_subscription_id: null, pro_expires_at: null }).eq("user_id", user.id);
      return new Response(JSON.stringify({ subscribed: false, subscription_end: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd: string | null = null;
    let cancelAtPeriodEnd = false;

    if (hasActiveSub) {
      const sub = subscriptions.data[0];
      subscriptionEnd = safeTimestamp(sub.current_period_end) ?? safeTimestamp(sub.cancel_at) ?? null;
      cancelAtPeriodEnd = sub.cancel_at_period_end === true;
      const proSince = safeTimestamp(sub.start_date) ?? safeTimestamp(sub.created) ?? new Date().toISOString();

      logStep("Active subscription found", {
        subscriptionId: sub.id,
        currentPeriodEnd: sub.current_period_end,
        cancelAt: sub.cancel_at,
        endDate: subscriptionEnd,
        cancelAtPeriodEnd,
      });

      await supabase.from("profiles").update({
        is_pro: true,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        pro_since: proSince,
        pro_expires_at: subscriptionEnd,
      }).eq("user_id", user.id);
    } else {
      logStep("No active subscription");
      await supabase.from("profiles").update({
        is_pro: false,
        stripe_subscription_id: null,
        pro_expires_at: null,
      }).eq("user_id", user.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_end: subscriptionEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
