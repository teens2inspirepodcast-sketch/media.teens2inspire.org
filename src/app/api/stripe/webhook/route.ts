import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { verifyStripeWebhookEvent } from "@/lib/stripe-webhook-signature";

function objectId(value: string | { id: string } | null | undefined) { return typeof value === "string" ? value : value?.id ?? null; }
function timestamp(value: number | null | undefined) { return value ? new Date(value * 1000).toISOString() : null; }

async function syncSubscription(admin: ReturnType<typeof createServiceSupabase>, subscription: Stripe.Subscription, checkoutUserId?: string | null) {
  const customerId = objectId(subscription.customer);
  const userId = checkoutUserId || subscription.metadata.supabase_user_id;
  let ownerId: string | null = userId;
  if (!ownerId && customerId) {
    const { data } = await admin.from("profiles").select("id").eq("stripe_customer_id", customerId).maybeSingle();
    ownerId = data?.id ?? null;
  }
  if (!ownerId || !customerId) throw new Error("Subscription could not be matched to an account.");

  const resolvedOwnerId = ownerId;
  const item = subscription.items.data[0];
  // Stripe's current API exposes billing periods on subscription items.
  const currentStart = timestamp(item?.current_period_start);
  const currentEnd = timestamp(item?.current_period_end);
  const priceId = item?.price.id;
  if (!priceId) throw new Error("Subscription price was not present.");
  const membershipTier = subscription.metadata.membership_plan === "family" ? "family" : "personal";
  const row = {
    user_id: resolvedOwnerId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    status: subscription.status,
    current_period_start: currentStart,
    current_period_end: currentEnd,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: timestamp(subscription.canceled_at),
    updated_at: new Date().toISOString(),
  };
  const { error: subscriptionError } = await admin.from("subscriptions").upsert(row, { onConflict: "stripe_subscription_id" });
  if (subscriptionError) throw subscriptionError;

  const member = ["active", "trialing"].includes(subscription.status) && (!currentEnd || Date.parse(currentEnd) > Date.now());
  const profileStatus = member ? "active" : subscription.status === "past_due" || subscription.status === "unpaid" ? "past_due" : subscription.status === "canceled" ? "canceled" : "pending_payment";
  const { error: profileError } = await admin.from("profiles").update({
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    membership_type: "standard",
    membership_tier: membershipTier,
    membership_status: profileStatus,
    membership_period_end: currentEnd,
    membership_expires_at: currentEnd,
    cancel_at_period_end: subscription.cancel_at_period_end,
  }).eq("id", resolvedOwnerId);
  if (profileError) throw profileError;
}

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Webhook receiver is not configured." }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  const rawBody = await request.text();
  if (rawBody.length > 1_000_000) return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });

  let event: Stripe.Event;
  try { event = verifyStripeWebhookEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!); }
  catch { return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 }); }

  const admin = createServiceSupabase();
  const { data: claimed, error: claimError } = await admin.rpc("claim_stripe_event", { p_event_id: event.id, p_event_type: event.type, p_livemode: event.livemode });
  if (claimError) return NextResponse.json({ error: "Webhook could not be recorded." }, { status: 500 });
  if (!claimed) return NextResponse.json({ received: true, duplicate: true });

  try {
    if (event.type.startsWith("customer.subscription.")) {
      await syncSubscription(admin, event.data.object as Stripe.Subscription);
    } else if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = objectId(session.subscription);
      if (subscriptionId) {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        const customerId = objectId(session.customer);
        if (customerId && session.client_reference_id) await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", session.client_reference_id);
        await syncSubscription(admin, subscription, session.client_reference_id);
      }
    } else if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null; parent?: { subscription_details?: { subscription?: string | Stripe.Subscription | null } } | null };
      const subscriptionId = objectId(invoice.subscription) ?? objectId(invoice.parent?.subscription_details?.subscription);
      if (subscriptionId) await syncSubscription(admin, await getStripe().subscriptions.retrieve(subscriptionId));
    }
    await admin.rpc("finish_stripe_event", { p_event_id: event.id, p_success: true });
    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Subscription sync failed.";
    await admin.rpc("finish_stripe_event", { p_event_id: event.id, p_success: false, p_error: message });
    return NextResponse.json({ error: "Webhook processing failed. Stripe may retry this event." }, { status: 500 });
  }
}
