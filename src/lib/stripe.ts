import "server-only";
import Stripe from "stripe";

export type MembershipPlan = "personal" | "family";

let stripe: Stripe | undefined;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe server configuration is incomplete.");
  stripe ??= new Stripe(key);
  return stripe;
}

export function stripePriceIds() {
  return {
    personal: process.env.STRIPE_PRICE_ID_PERSONAL,
    family: process.env.STRIPE_PRICE_ID_FAMILY,
  };
}

export function getStripePriceId(plan: MembershipPlan) {
  const priceId = stripePriceIds()[plan];
  if (!priceId) throw new Error(`Stripe price is not configured for the ${plan} plan.`);
  return priceId;
}

export function stripeReadyForBilling() {
  const prices = stripePriceIds();
  return Boolean(process.env.STRIPE_SECRET_KEY && prices.personal && prices.family);
}
