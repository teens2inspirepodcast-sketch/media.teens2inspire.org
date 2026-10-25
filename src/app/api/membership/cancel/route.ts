import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getContext } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST() {
  const { user, profile, supabase } = await getContext();
  if (!user) return NextResponse.json({ error: "Sign in to manage your membership." }, { status: 401 });
  if (!profile?.stripe_subscription_id) return NextResponse.json({ error: "No active Stripe subscription is linked to this account. Contact support if you believe this is incorrect." }, { status: 409 });
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Membership management is temporarily unavailable. Please contact support." }, { status: 503 });
  try {
    const stripe = new Stripe(secret);
    const subscription = await stripe.subscriptions.update(profile.stripe_subscription_id, { cancel_at_period_end: true });
    const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;
    const { error } = await supabase.from("profiles").update({ cancel_at_period_end: true, ...(periodEnd ? { membership_period_end: new Date(periodEnd * 1000).toISOString() } : {}) }).eq("id", user.id);
    if (error) {
      console.error("Subscription cancellation was accepted by Stripe but profile sync failed", error.message);
      return NextResponse.json({ error: "Stripe scheduled cancellation, but the account display could not be updated. Refresh shortly or contact support." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, cancelAtPeriodEnd: true, periodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null });
  } catch (error) {
    console.error("Membership cancellation failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Stripe could not cancel this membership. Please try again or contact support." }, { status: 502 });
  }
}
