import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { siteOrigin } from "@/lib/env";

export async function POST() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage billing." }, { status: 401 });
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Billing management is not configured yet." }, { status: 503 });
  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle();
  if (!profile?.stripe_customer_id) return NextResponse.json({ error: "There is no billing account to manage yet." }, { status: 409 });
  try {
    const session = await getStripe().billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: `${siteOrigin()}/download` });
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Billing could not be opened. Please try again." }, { status: 502 });
  }
}
