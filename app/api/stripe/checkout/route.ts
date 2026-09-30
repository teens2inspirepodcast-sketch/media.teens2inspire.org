import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createMemberCheckout } from "@/lib/stripe";
import { getSiteOrigin } from "@/lib/site-url";
import { isSameOriginRequest } from "@/lib/same-origin";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Please reload the page and try again." }, { status: 403 });
  const siteOrigin = getSiteOrigin(request.url);
  if (!siteOrigin) return NextResponse.json({ error: "Membership checkout is not available right now." }, { status: 503 });
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Membership checkout is not available right now." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Sign in to continue to checkout." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const requestedTier = body?.tier === "personal" || body?.tier === "family" ? body.tier : undefined;
  const promoCode = typeof body?.promoCode === "string" ? body.promoCode.trim().slice(0, 40) : "";
  if (body?.tier !== undefined && !requestedTier) return NextResponse.json({ error: "Choose a valid paid membership plan." }, { status: 400 });
  const result = await createMemberCheckout(supabase, user.id, user.email, siteOrigin, requestedTier, promoCode);
  if (!("url" in result)) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ url: result.url });
}
