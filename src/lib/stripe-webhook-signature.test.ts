import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { verifyStripeWebhookEvent } from "./stripe-webhook-signature";

describe("Stripe webhook signature verification", () => {
  const secret = "whsec_local_test_secret";
  const payload = JSON.stringify({ id: "evt_local_test", object: "event", type: "customer.subscription.updated", data: { object: { id: "sub_local_test" } }, created: 1_791_000_000, livemode: false, api_version: "2025-09-30.clover", pending_webhooks: 1, request: null });

  it("accepts a valid Stripe signed payload", () => {
    const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret });
    expect(verifyStripeWebhookEvent(payload, signature, secret).id).toBe("evt_local_test");
  });

  it("rejects modified payloads and invalid signatures", () => {
    const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret });
    expect(() => verifyStripeWebhookEvent(`${payload} `, signature, secret)).toThrow();
    expect(() => verifyStripeWebhookEvent(payload, "t=1,v1=bad", secret)).toThrow();
  });
});
