import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { isSameOriginRequest } from "@/lib/same-origin";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Please reload the page and try again." }, { status: 403 });
  const supabase = await createClient(); if (!supabase) return NextResponse.json({ error: "Billing is unavailable right now." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Sign in to manage your membership." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("membership_tier,membership_status,stripe_customer_id,stripe_subscription_id,cancel_at_period_end,membership_period_end").eq("id", user.id).maybeSingle();
  if (!profile || !["personal", "family"].includes(profile.membership_tier || "") || !profile.stripe_customer_id || !profile.stripe_subscription_id) return NextResponse.json({ error: "A paid Stripe membership could not be found for this account." }, { status: 404 });
  const stripe = getStripe(); if (!stripe) return NextResponse.json({ error: "Billing is not configured right now." }, { status: 503 });
  try {
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    if (customerId !== profile.stripe_customer_id || subscription.metadata.supabase_user_id !== user.id) return NextResponse.json({ error: "The linked membership could not be verified." }, { status: 403 });
    if (!["active", "trialing", "past_due"].includes(subscription.status)) return NextResponse.json({ error: "This membership can’t be canceled from this account state. Contact Teens2Inspire for help." }, { status: 409 });
    const updated = subscription.cancel_at_period_end ? subscription : await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true });
    const end = Math.max(0, ...updated.items.data.map((item) => item.current_period_end));
    return NextResponse.json({ ok: true, cancelAtPeriodEnd: updated.cancel_at_period_end, accessUntil: end ? new Date(end * 1000).toISOString() : profile.membership_period_end });
  } catch { return NextResponse.json({ error: "Stripe couldn’t schedule the cancellation. Your membership was not changed." }, { status: 503 }); }
}
