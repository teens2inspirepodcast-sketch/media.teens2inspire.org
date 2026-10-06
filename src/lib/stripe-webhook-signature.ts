import Stripe from "stripe";

export function verifyStripeWebhookEvent(rawBody: string, signature: string, secret: string) {
  return Stripe.webhooks.constructEvent(rawBody, signature, secret);
}
