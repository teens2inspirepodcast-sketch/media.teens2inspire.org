import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getContext } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const { user, profile } = await getContext();
  if (!user) return NextResponse.json({ error: "Sign in to manage your membership." }, { status: 401 });
  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: "No active Stripe subscription is linked to this account. Contact support if you believe this is incorrect." }, { status: 409 });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Membership management is temporarily unavailable. Please contact support." }, { status: 503 });
  }

  try {
    const stripe = new Stripe(secret);
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    const metadataUserId = subscription.metadata?.supabase_user_id;
    const customerMatches = Boolean(profile.stripe_customer_id && customerId === profile.stripe_customer_id);
    const ownerMetadataMatches = metadataUserId === user.id;
    if ((profile.stripe_customer_id && !customerMatches) || (metadataUserId && !ownerMetadataMatches) || (!customerMatches && !ownerMetadataMatches)) {
      console.error("Membership cancellation refused: Stripe subscription ownership could not be verified", user.id);
      return NextResponse.json({ error: "We couldn't verify this subscription against your account. Please contact support." }, { status: 403 });
    }
    if (subscription.status === "canceled" || subscription.status === "incomplete_expired") {
      return NextResponse.json({ error: "This subscription is no longer active." }, { status: 409 });
    }
    if (subscription.cancel_at_period_end) {
      const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;
      return NextResponse.json({ ok: true, cancelAtPeriodEnd: true, alreadyScheduled: true, periodEnd }, { headers: { "Cache-Control": "no-store" } });
    }

    const updated = await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true });
    const periodEnd = updated.current_period_end ? new Date(updated.current_period_end * 1000).toISOString() : null;

    // The Stripe webhook is the authoritative sync path for profile/membership state.
    // Do not attempt a direct client-scoped profiles UPDATE here: RLS intentionally
    // restricts membership fields, and a successful Stripe cancellation must not be
    // reported as failed merely because the client cannot write protected columns.
    return NextResponse.json({ ok: true, cancelAtPeriodEnd: true, periodEnd }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Membership cancellation failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Stripe could not schedule membership cancellation. Please try again or contact support." }, { status: 502 });
  }
}
