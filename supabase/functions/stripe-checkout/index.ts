import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.0";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const PERSONAL_PRICE = "price_1ULE0PIgMA67dR4JrQy2EINd";
const FAMILY_PRICE = "price_1ULE7KIgMA67dR4JCMyFbFo4";
const SITE_ORIGIN = "https://teens2inspire.org";
const ALLOWED_ORIGINS = new Set([SITE_ORIGIN, "https://www.teens2inspire.org", "http://localhost:3000"]);
function cors(origin: string | null) { return { "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : SITE_ORIGIN, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" }; }
function json(body: Record<string, unknown>, status = 200, origin: string | null = null) { return new Response(JSON.stringify(body), { status, headers: { ...cors(origin), "Content-Type": "application/json", "Cache-Control": "no-store", "Pragma": "no-cache" } }); }
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed." }, 403, origin);
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY) return json({ error: "Checkout is not fully configured yet. Please try again later." }, 503, origin);
  let payload: { plan?: unknown; email?: unknown; userId?: unknown; discountCode?: unknown };
  try { payload = await req.json(); } catch { return json({ error: "Invalid checkout request." }, 400, origin); }
  if (payload.plan !== "personal" && payload.plan !== "family") return json({ error: "Choose a valid membership plan." }, 400, origin);

  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  let user: { id: string; email?: string; email_confirmed_at?: string | null } | null = null;
  if (token && token !== ANON_KEY) {
    const authClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data } = await authClient.auth.getUser(token);
    user = data.user as typeof user;
  }
  if (!user) {
    if (typeof payload.userId !== "string" || typeof payload.email !== "string") return json({ error: "Please create your account first." }, 401, origin);
    const { data, error } = await admin.auth.admin.getUserById(payload.userId);
    if (error || !data.user || data.user.email?.toLowerCase() !== payload.email.trim().toLowerCase()) return json({ error: "We couldn't verify the signup details. Please sign in and try again." }, 401, origin);
    if (data.user.email_confirmed_at) return json({ error: "This email is already verified. Please sign in to continue to checkout." }, 409, origin);
    user = data.user as typeof user;
  }
  if (!user?.id || !user.email) return json({ error: "Your account email is missing. Please sign in again." }, 401, origin);

  const { data: profile, error: profileError } = await admin.from("profiles").select("stripe_customer_id,stripe_subscription_id,membership_status").eq("id", user.id).maybeSingle();
  if (profileError) return json({ error: "We couldn't verify your membership. Please try again." }, 500, origin);
  if (profile?.stripe_subscription_id && ["active", "past_due", "pending_payment"].includes(profile.membership_status ?? "")) return json({ error: "This account already has a membership. Sign in to manage it." }, 409, origin);

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const tier = payload.plan;
  const priceId = tier === "personal" ? PERSONAL_PRICE : FAMILY_PRICE;
  const expectedCents = tier === "personal" ? 799 : 999;
  try {
    const price = await stripe.prices.retrieve(priceId);
    if (!price.active || price.currency !== "usd" || price.unit_amount !== expectedCents || price.recurring?.interval !== "month") {
      console.error("Configured Stripe price failed verification", tier, price.id, price.active, price.currency, price.unit_amount, price.recurring?.interval);
      return json({ error: "The membership price is not configured correctly. Please contact support." }, 503, origin);
    }

    const sessionMetadata: Record<string, string> = { supabase_user_id: user.id, membership_tier: tier };
    const rawCode = typeof payload.discountCode === "string" ? payload.discountCode.trim().toUpperCase().replace(/\s+/g, "") : "";
    let stripePromoId: string | undefined;
    let promoCodeId: string | undefined;
    if (rawCode) {
      if (!/^[A-Z0-9_-]{4,48}$/.test(rawCode)) return json({ error: "Enter a valid promo code." }, 400, origin);
      const { data: promo, error: promoError } = await admin.from("promo_codes").select("id,code,code_type,membership_plan,duration_months,discount_percent,max_uses,uses,expires_at,is_active,stripe_coupon_id,stripe_promotion_code_id").eq("code", rawCode).maybeSingle();
      if (promoError) return json({ error: "We couldn't validate that code right now. Please try again." }, 500, origin);
      if (!promo || !promo.is_active) return json({ error: "That promo code is invalid or inactive." }, 400, origin);
      if (promo.membership_plan !== tier) return json({ error: "That code is not valid for the selected membership plan." }, 400, origin);
      if (promo.expires_at && new Date(promo.expires_at).getTime() <= Date.now()) return json({ error: "That promo code has expired." }, 400, origin);
      if (Number(promo.uses) >= Number(promo.max_uses)) return json({ error: "That promo code has reached its redemption limit." }, 400, origin);
      if (promo.code_type !== "gift_card" && (!Number.isFinite(Number(promo.discount_percent)) || Number(promo.discount_percent) < 1 || Number(promo.discount_percent) > 100)) return json({ error: "That promo code's discount is not configured correctly." }, 400, origin);
      promoCodeId = promo.id;
      stripePromoId = promo.stripe_promotion_code_id || undefined;
      if (!stripePromoId) {
        const coupon = await stripe.coupons.create({
          percent_off: promo.code_type === "gift_card" ? 100 : Number(promo.discount_percent), duration: "repeating",
          duration_in_months: Number(promo.duration_months), name: `Teens2Inspire ${promo.code}`,
          metadata: { t2i_promo_code_id: promo.id, t2i_code: promo.code, t2i_type: promo.code_type },
        }, { idempotencyKey: `t2i-coupon-${promo.id}` });
        const createdPromotion = await stripe.promotionCodes.create({
          coupon: coupon.id, code: promo.code, active: true, max_redemptions: Number(promo.max_uses),
          ...(promo.expires_at ? { expires_at: Math.floor(new Date(promo.expires_at).getTime() / 1000) } : {}),
          metadata: { t2i_promo_code_id: promo.id },
        }, { idempotencyKey: `t2i-promo-${promo.id}` });
        const { error: saveIdsError } = await admin.from("promo_codes").update({ stripe_coupon_id: coupon.id, stripe_promotion_code_id: createdPromotion.id }).eq("id", promo.id).is("stripe_promotion_code_id", null);
        if (saveIdsError) console.error("Could not persist Stripe promo identifiers", saveIdsError.message);
        stripePromoId = createdPromotion.id;
      } else {
        const existingPromotion = await stripe.promotionCodes.retrieve(stripePromoId);
        if (!existingPromotion.active) return json({ error: "That promo code is no longer active in Stripe." }, 400, origin);
      }
      sessionMetadata.promo_code_id = promoCodeId;
      sessionMetadata.promo_code = rawCode;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription", line_items: [{ price: priceId, quantity: 1 }],
      ...(profile?.stripe_customer_id ? { customer: profile.stripe_customer_id } : { customer_email: user.email }),
      client_reference_id: user.id, metadata: sessionMetadata, subscription_data: { metadata: sessionMetadata },
      ...(stripePromoId ? { discounts: [{ promotion_code: stripePromoId }] } : { allow_promotion_codes: true }),
      success_url: `${SITE_ORIGIN}/membership?checkout=success`, cancel_url: `${SITE_ORIGIN}/membership?checkout=cancelled`,
    });
    if (!session.url || !session.url.startsWith("https://checkout.stripe.com/")) return json({ error: "Stripe did not return a valid checkout link." }, 502, origin);
    return json({ url: session.url }, 200, origin);
  } catch (error) {
    console.error("stripe-checkout failed", JSON.stringify({ message: error instanceof Error ? error.message : "unknown error", type: error && typeof error === "object" && "type" in error ? String(error.type) : null, code: error && typeof error === "object" && "code" in error ? String(error.code) : null, statusCode: error && typeof error === "object" && "statusCode" in error ? Number(error.statusCode) : null, requestId: error && typeof error === "object" && "requestId" in error ? String(error.requestId) : null }));
    return json({ error: "We couldn't apply that code or open secure checkout. Check the code and try again, or contact support." }, 502, origin);
  }
});
