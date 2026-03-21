import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const logStep = (step: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

/** Safely convert a Stripe timestamp (seconds) to ISO string. */
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
  // Webhooks are POST only — no CORS needed (Stripe → server)
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    logStep("ERROR", { message: "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET" });
    return new Response("Server misconfigured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    logStep("ERROR", { message: "Missing stripe-signature header" });
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("Signature verification failed", { message: msg });
    return new Response(`Signature verification failed: ${msg}`, { status: 400 });
  }

  logStep("Event received", { type: event.type, id: event.id });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!customerId) {
          logStep("checkout.session.completed: no customer_id, skipping");
          break;
        }

        // Find profile by stripe_customer_id
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profileErr || !profile) {
          logStep("User not found for customer", { customerId, error: profileErr?.message });
          break;
        }

        const updateData: Record<string, unknown> = {
          is_pro: true,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          pro_since: new Date().toISOString(),
        };

        // Get subscription details for pro_expires_at
        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            updateData.pro_expires_at = safeTimestamp(sub.current_period_end);
          } catch (e) {
            logStep("Could not retrieve subscription", { subscriptionId, error: String(e) });
          }
        }

        await supabase.from("profiles").update(updateData).eq("user_id", profile.user_id);
        logStep("checkout.session.completed: profile updated", { userId: profile.user_id });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (!profile) {
          logStep("subscription.updated: user not found", { customerId });
          break;
        }

        const isActive = sub.status === "active" || sub.status === "trialing";

        await supabase.from("profiles").update({
          is_pro: isActive,
          pro_expires_at: safeTimestamp(sub.current_period_end),
          stripe_subscription_id: sub.id,
        }).eq("user_id", profile.user_id);

        logStep("subscription.updated: profile updated", {
          userId: profile.user_id,
          status: sub.status,
          isActive,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (!profile) {
          logStep("subscription.deleted: user not found", { customerId });
          break;
        }

        await supabase.from("profiles").update({
          is_pro: false,
          stripe_subscription_id: null,
          pro_expires_at: null,
        }).eq("user_id", profile.user_id);

        logStep("subscription.deleted: profile downgraded", { userId: profile.user_id });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("invoice.payment_failed", {
          customerId: invoice.customer,
          subscriptionId: invoice.subscription,
          amountDue: invoice.amount_due,
        });
        break;
      }

      default:
        logStep("Unhandled event type, ignoring", { type: event.type });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("Error processing event", { type: event.type, message: msg });
    // Return 200 to avoid Stripe retries for processing errors
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
