import "server-only";
import { createHash } from "node:crypto";
import Stripe from "stripe";
import type { MembershipTier } from "@/lib/membership";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { membershipCheckoutIdempotencyKey } from "@/lib/stripe-idempotency";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  if (!stripeClient) stripeClient = new Stripe(secretKey);
  return stripeClient;
}

export function stripePriceIdFor(tier: MembershipTier) {
  if (tier === "personal") return process.env.STRIPE_PRICE_PERSONAL_MONTHLY || "";
  if (tier === "family") return process.env.STRIPE_PRICE_FAMILY_MONTHLY || "";
  return "";
}

export function isMembershipBillingConfigured(tier: MembershipTier) {
  return tier !== "school" && Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    stripePriceIdFor(tier),
  );
}

export async function findValidMembershipPromotion(code: string, tier: "personal" | "family", customerId?: string | null) {
  const stripe = getStripe();
  const normalized = code.trim().toUpperCase();
  if (!stripe || !normalized || !/^[A-Z0-9-]{3,40}$/.test(normalized)) return { error: "Enter a valid promo code.", status: "invalid" as const };
  try {
    const { data } = await stripe.promotionCodes.list({ code: normalized, active: true, limit: 100, expand: ["data.promotion.coupon"] });
    const promotionCode = data.find((candidate) => candidate.code.toUpperCase() === normalized);
    if (!promotionCode) return { error: "This promo code isn’t valid.", status: "invalid" as const };
    if (!promotionCode.active || (promotionCode.expires_at && promotionCode.expires_at * 1000 <= Date.now()) || (promotionCode.max_redemptions !== null && promotionCode.times_redeemed >= promotionCode.max_redemptions)) return { error: "This promo code has expired or reached its limit.", status: "expired" as const };
    if (promotionCode.customer && (typeof promotionCode.customer === "string" ? promotionCode.customer : promotionCode.customer.id) !== customerId) return { error: "This promo code isn’t available for this account.", status: "not_applicable" as const };
    const promotion = promotionCode.promotion;
    const coupon = promotion.type === "coupon" ? (typeof promotion.coupon === "string" ? await stripe.coupons.retrieve(promotion.coupon) : promotion.coupon) : null;
    if (!coupon?.valid || (coupon.redeem_by && coupon.redeem_by * 1000 <= Date.now())) return { error: "This promo code has expired or reached its limit.", status: "expired" as const };
    if (coupon.applies_to?.products?.length) {
      const price = await stripe.prices.retrieve(stripePriceIdFor(tier));
      const productId = typeof price.product === "string" ? price.product : price.product.id;
      if (!coupon.applies_to.products.includes(productId)) return { error: "This promo code doesn’t apply to the selected plan.", status: "not_applicable" as const };
    }
    return { promotionCode, coupon, status: "valid" as const, message: coupon.percent_off ? `${coupon.percent_off}% discount applied at checkout.` : "Discount applied at checkout." };
  } catch {
    return { error: "We couldn’t check that code right now. Please try again.", status: "unavailable" as const };
  }
}

export function stripeStatusToMembershipStatus(status: Stripe.Subscription.Status) {
  if (status === "active" || status === "trialing") return "active" as const;
  if (status === "past_due") return "past_due" as const;
  if (status === "canceled" || status === "unpaid" || status === "paused" || status === "incomplete_expired") return "canceled" as const;
  return "pending_payment" as const;
}

export async function createMemberCheckout(supabase: SupabaseClient, userId: string, email: string, origin: string, requestedTier?: "personal" | "family", promoCode?: string) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("membership_tier,membership_status,stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) return { error: "Your membership profile is not ready yet.", status: 503 as const };
  const tier = requestedTier ?? profile.membership_tier;
  if (tier !== "personal" && tier !== "family") {
    return { error: "Choose a paid Personal or Family plan to unlock videos.", status: 400 as const };
  }
  const isAlreadyPaidAccount = profile.membership_tier === "personal" || profile.membership_tier === "family";
  if (isAlreadyPaidAccount && requestedTier && requestedTier !== profile.membership_tier) {
    return { error: "Manage billing to change your paid plan.", status: 409 as const };
  }
  if (isAlreadyPaidAccount && profile.membership_status === "active") return { error: "Your membership is already active.", status: 409 as const };
  if (isAlreadyPaidAccount && profile.membership_status === "past_due") return { error: "Use Manage billing to update your payment method.", status: 409 as const };
  if (!isMembershipBillingConfigured(tier)) {
    return { error: "Secure monthly checkout is not fully configured yet.", status: 503 as const };
  }

  const stripe = getStripe();
  const priceId = stripePriceIdFor(tier);
  const admin = createAdminClient();
  if (!stripe || !priceId || !admin) return { error: "Secure monthly checkout is not fully configured yet.", status: 503 as const };

  try {
    let customerId = profile.stripe_customer_id;
    if (customerId) {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) return { error: "We couldn’t open secure checkout. Please contact Teens2Inspire for help.", status: 503 as const };
      if (customer.metadata.supabase_user_id !== userId) {
        await stripe.customers.update(customerId, { metadata: { ...customer.metadata, supabase_user_id: userId } });
      }
    } else {
      const customer = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: userId },
      }, { idempotencyKey: `teens2inspire-customer-${userId}-${createHash("sha256").update(email.toLowerCase()).digest("hex")}` });
      customerId = customer.id;
      const { error } = await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
      if (error) return { error: "Your billing profile could not be prepared. Please try again shortly.", status: 503 as const };
    }

    const openSessions = await stripe.checkout.sessions.list({ customer: customerId, status: "open", limit: 100 });
    const normalizedPromo = String(promoCode || "").trim().toUpperCase();
    const matchingSession = openSessions.data.find((session) =>
      session.mode === "subscription" && session.metadata?.supabase_user_id === userId &&
      session.metadata?.membership_tier === tier && session.metadata?.promo_code === normalizedPromo && session.url,
    );
    if (matchingSession?.url) return { url: matchingSession.url };
    for (const session of openSessions.data) {
      if (session.mode === "subscription" && session.metadata?.supabase_user_id === userId) {
        await stripe.checkout.sessions.expire(session.id);
      }
    }

    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
    const existingSubscription = subscriptions.data.find((subscription) =>
      ["active", "trialing", "past_due", "unpaid", "paused"].includes(subscription.status),
    );
    if (existingSubscription) return { error: "There is already a paid membership on this account. Refresh your profile or manage billing.", status: 409 as const };

    const price = await stripe.prices.retrieve(priceId);
    const expectedAmount = tier === "personal" ? 799 : 999;
    if (!price.active || price.currency !== "usd" || price.unit_amount !== expectedAmount || price.recurring?.interval !== "month") {
      return { error: "The monthly membership prices need to be checked in Stripe before checkout can start.", status: 503 as const };
    }
    const validPromo = normalizedPromo ? await findValidMembershipPromotion(normalizedPromo, tier, customerId) : null;
    if (validPromo && validPromo.status !== "valid") return { error: validPromo.error, status: 400 as const };
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      customer: customerId,
      ...(validPromo?.status === "valid" ? { discounts: [{ promotion_code: validPromo.promotionCode.id }] } : {}),
      metadata: { supabase_user_id: userId, membership_tier: tier, promo_code: normalizedPromo },
      subscription_data: { metadata: { supabase_user_id: userId, membership_tier: tier } },
      success_url: new URL("/membership/success", origin).toString(),
      cancel_url: new URL("/profile?membership=checkout-canceled", origin).toString(),
    }, { idempotencyKey: membershipCheckoutIdempotencyKey(userId, tier, normalizedPromo, Math.floor(Date.now() / 300000)) });
    if (!session.url) return { error: "Stripe did not return a checkout link. Please try again.", status: 503 as const };
    return { url: session.url };
  } catch {
    return { error: "We couldn’t open secure checkout. Please try again shortly.", status: 503 as const };
  }
}
