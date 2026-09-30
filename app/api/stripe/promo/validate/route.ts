import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findValidMembershipPromotion } from "@/lib/stripe";
import { isSameOriginRequest } from "@/lib/same-origin";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "This request was not allowed." }, { status: 403 });
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return NextResponse.json({ error: "Enter a promo code." }, { status: 400 }); }
  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  // Signup may preview a code before an account exists. Signup and Checkout
  // validate it again server-side before creating a paid session.
  if (!user && body.preSignup !== true) return NextResponse.json({ error: "Sign in to use a promo code." }, { status: 401 });
  const tier = body.tier === "family" ? "family" : body.tier === "personal" ? "personal" : null;
  if (!tier) return NextResponse.json({ error: "Choose a paid membership plan first." }, { status: 400 });
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const { data: profile } = user && supabase
    ? await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).maybeSingle()
    : { data: null };
  const result = await findValidMembershipPromotion(code, tier, profile?.stripe_customer_id);
  if (result.status !== "valid") return NextResponse.json({ status: result.status, error: result.error }, { status: result.status === "unavailable" ? 503 : 400 });
  return NextResponse.json({ status: "valid", message: result.message });
}
