import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { getStripe, getStripePriceId, type MembershipPlan } from "@/lib/stripe";
import { siteOrigin } from "@/lib/env";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before starting membership." }, { status: 401 });
  if (!user.email_confirmed_at) return NextResponse.json({ error: "Confirm your email before starting membership." }, { status: 403 });

  let plan: MembershipPlan = "personal";
  try {
    const body = await request.json().catch(() => ({}));
    if (body?.plan === "family") plan = "family";
    else if (body?.plan === "personal" || body?.plan === undefined) plan = "personal";
    else return NextResponse.json({ error: "Choose a valid membership plan." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Choose a valid membership plan." }, { status: 400 });
  }

  const origin = siteOrigin();
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Membership checkout is not available yet." }, { status: 503 });

  try {
    const priceId = getStripePriceId(plan);
    const admin = createServiceSupabase();
    const stripe = getStripe();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("first_name, display_name, stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id, status, current_period_end")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .limit(1)
      .maybeSingle();

    if (existing && (!existing.current_period_end || Date.parse(existing.current_period_end) > Date.now())) {
      return NextResponse.json({ error: "You already have a subscription. Open membership settings to manage it." }, { status: 409 });
    }

    let customerId = profile?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create(
        {
          email: user.email,
          name: profile?.display_name || profile?.first_name || undefined,
          metadata: { supabase_user_id: user.id },
        },
        { idempotencyKey: `teens2inspire-customer-${user.id}` },
      );
      customerId = customer.id;
      const { error: saveCustomerError } = await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
      if (saveCustomerError) throw saveCustomerError;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/download?checkout=complete&plan=${plan}`,
      cancel_url: `${origin}/download?checkout=cancelled&plan=${plan}`,
      metadata: { supabase_user_id: user.id, membership_plan: plan },
      subscription_data: { metadata: { supabase_user_id: user.id, membership_plan: plan } },
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Membership checkout could not be started. Please try again." }, { status: 502 });
  }
}
