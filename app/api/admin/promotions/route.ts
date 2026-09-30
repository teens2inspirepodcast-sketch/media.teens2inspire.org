import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, stripePriceIdFor } from "@/lib/stripe";
import { writeAdminAudit } from "@/lib/admin-audit";
import { isSameOriginRequest } from "@/lib/same-origin";

async function requireAdmin() {
  const supabase = await createClient();
  if (!supabase) return { error: NextResponse.json({ error: "Promotion management is unavailable." }, { status: 503 }) };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "administrator") return { error: NextResponse.json({ error: "Only the Teens2Inspire owner can manage promotions." }, { status: 403 }) };
  const stripe = getStripe();
  if (!stripe) return { error: NextResponse.json({ error: "Stripe is not configured." }, { status: 503 }) };
  return { user, stripe };
}

export async function GET() {
  const context = await requireAdmin(); if ("error" in context) return context.error;
  try {
    const { data } = await context.stripe.promotionCodes.list({ limit: 100, expand: ["data.promotion.coupon"] });
    return NextResponse.json({ promotions: data.map((code) => {
      const promotion = code.promotion; const coupon = promotion.type === "coupon" && typeof promotion.coupon !== "string" ? promotion.coupon : null;
      return { id: code.id, code: code.code, active: code.active, expiresAt: code.expires_at, maxRedemptions: code.max_redemptions, timesRedeemed: code.times_redeemed, description: code.metadata?.description || coupon?.name || "", discount: coupon?.percent_off ? `${coupon.percent_off}%` : coupon?.amount_off ? `$${(coupon.amount_off / 100).toFixed(2)}` : "Stripe coupon" };
    }) });
  } catch { return NextResponse.json({ error: "Promotions could not be loaded." }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "This request was not allowed." }, { status: 403 });
  const context = await requireAdmin(); if ("error" in context) return context.error;
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid promotion details." }, { status: 400 }); }
  if (body.action === "toggle") {
    const id = String(body.id || ""); if (!/^promo_[A-Za-z0-9]+$/.test(id) || typeof body.active !== "boolean") return NextResponse.json({ error: "Choose a valid promotion." }, { status: 400 });
    try { const updated = await context.stripe.promotionCodes.update(id, { active: body.active }); await writeAdminAudit(context.user.id, body.active ? "promotion_activated" : "promotion_deactivated", "promotion", null, { code: updated.code }); return NextResponse.json({ ok: true }); }
    catch { return NextResponse.json({ error: "This promotion couldn’t be updated." }, { status: 400 }); }
  }
  const code = String(body.code || "").trim().toUpperCase();
  const description = String(body.description || "").trim().slice(0, 120);
  const type = body.discount_type === "amount" ? "amount" : "percent";
  const amount = Number(body.amount); const expiresText = String(body.expires_at || "");
  const maxRedemptions = body.max_redemptions === "" || body.max_redemptions == null ? null : Number(body.max_redemptions);
  const tier = body.tier === "personal" || body.tier === "family" || body.tier === "both" ? body.tier : "both";
  const duration = body.duration === "repeating" || body.duration === "forever" ? body.duration : "once";
  const durationMonths = Number(body.duration_months || 1);
  const expiresAt = expiresText ? Math.floor(new Date(expiresText).getTime() / 1000) : null;
  if (!/^[A-Z0-9-]{3,40}$/.test(code) || !description || !Number.isFinite(amount) || (type === "percent" ? amount <= 0 || amount > 100 : amount < 0.5 || amount > 1000) || (maxRedemptions !== null && (!Number.isInteger(maxRedemptions) || maxRedemptions < 1 || maxRedemptions > 100000)) || (expiresText && (!expiresAt || expiresAt <= Math.floor(Date.now() / 1000))) || (duration === "repeating" && (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 24))) return NextResponse.json({ error: "Check the code, discount, expiration, redemption limit, and duration." }, { status: 400 });
  try {
    const productIds = await Promise.all((tier === "both" ? ["personal", "family"] : [tier]).map(async (plan) => {
      const priceId = stripePriceIdFor(plan as "personal" | "family"); if (!priceId) throw new Error("Missing membership price configuration.");
      const price = await context.stripe.prices.retrieve(priceId); return typeof price.product === "string" ? price.product : price.product.id;
    }));
    const coupon = await context.stripe.coupons.create({ name: description, duration, ...(duration === "repeating" ? { duration_in_months: durationMonths } : {}), ...(type === "percent" ? { percent_off: amount } : { amount_off: Math.round(amount * 100), currency: "usd" }), applies_to: { products: [...new Set(productIds)] }, ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}), ...(expiresAt ? { redeem_by: expiresAt } : {}) });
    // FormData omits an unchecked checkbox; only explicit true should activate a code.
    const promotion = await context.stripe.promotionCodes.create({ promotion: { type: "coupon", coupon: coupon.id }, code, active: body.active === true || body.active === "on", ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}), ...(expiresAt ? { expires_at: expiresAt } : {}), metadata: { description, membership_tier: tier } });
    await writeAdminAudit(context.user.id, "promotion_created", "promotion", null, { code, discount_type: type, tier });
    return NextResponse.json({ ok: true, id: promotion.id, code: promotion.code }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Stripe couldn’t create this code. Check that membership prices are set up and that the code is unique." }, { status: 400 });
  }
}
