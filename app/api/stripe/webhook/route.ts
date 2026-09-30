import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe, stripeStatusToMembershipStatus } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMembershipTier } from "@/lib/membership";
import { isCurrentOrUnassignedSubscription } from "@/lib/stripe-membership-status";
import { shouldSyncCheckoutMembership } from "@/lib/stripe-idempotency";

function periodEndDate(subscription: Stripe.Subscription) {
  const end = Math.max(0, ...subscription.items.data.map((item) => item.current_period_end));
  return end ? new Date(end * 1000).toISOString() : null;
}

async function syncSubscriptionMembership(stripe: Stripe, admin: SupabaseClient, subscriptionId: string, expected?: { userId: string; tier: string }) {
  try {
    // Read Stripe's current state so delayed or out-of-order event payloads
    // cannot restore access after a later cancellation or payment failure.
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata.supabase_user_id;
    const tier = subscription.metadata.membership_tier;
    if (!userId || !isMembershipTier(tier) || tier === "school") return { ok: true as const };
    if (expected && (expected.userId !== userId || expected.tier !== tier)) return { ok: false as const, message: "Subscription membership details do not match checkout.", status: 400 };
    const { data: profile, error: profileError } = await admin.from("profiles").select("id,stripe_subscription_id").eq("id", userId).maybeSingle();
    if (profileError || !profile) return { ok: false as const, message: "Membership profile is not ready.", status: 500 };
    if (!isCurrentOrUnassignedSubscription(profile.stripe_subscription_id, subscription.id)) return { ok: true as const };
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    const { data: updatedProfile, error } = await admin.from("profiles").update({
      membership_tier: tier,
      membership_status: stripeStatusToMembershipStatus(subscription.status),
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      membership_period_end: periodEndDate(subscription),
      cancel_at_period_end: subscription.cancel_at_period_end,
    }).eq("id", userId).or(`stripe_subscription_id.eq.${subscription.id},stripe_subscription_id.is.null`).select("id").maybeSingle();
    if (error || !updatedProfile) return { ok: false as const, message: "Membership could not be updated.", status: 500 };
    return { ok: true as const };
  } catch {
    return { ok: false as const, message: "Subscription could not be retrieved.", status: 500 };
  }
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const admin = createAdminClient();
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !webhookSecret || !admin || !signature) {
    return NextResponse.json({ error: "Webhook configuration is incomplete." }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.async_payment_failed") {
    // The profile remains pending_payment; a failed delayed payment never grants access.
    return NextResponse.json({ received: true });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (!shouldSyncCheckoutMembership(event.type, session.payment_status)) return NextResponse.json({ received: true });
    const userId = session.client_reference_id || session.metadata?.supabase_user_id;
    const tier = session.metadata?.membership_tier;
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    if (!userId || !isMembershipTier(tier) || tier === "school" || !subscriptionId) {
      return NextResponse.json({ error: "Checkout is missing membership details." }, { status: 400 });
    }
    const result = await syncSubscriptionMembership(stripe, admin, subscriptionId, { userId, tier });
    if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.status });
  }

  if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    const eventSubscription = event.data.object as Stripe.Subscription;
    const result = await syncSubscriptionMembership(stripe, admin, eventSubscription.id);
    if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.status });
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionRef = invoice.parent?.subscription_details?.subscription;
    const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;
    if (subscriptionId) {
      const result = await syncSubscriptionMembership(stripe, admin, subscriptionId);
      if (!result.ok) return NextResponse.json({ error: result.message }, { status: result.status });
    }
  }

  return NextResponse.json({ received: true });
}
