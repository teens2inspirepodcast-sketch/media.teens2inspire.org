import assert from "node:assert/strict";
import test from "node:test";
import { hasPaidMediaAccess } from "../lib/membership-access-policy.ts";
import { isUsableCheckoutSession, membershipCheckoutIdempotencyKey, shouldSyncCheckoutMembership, stripeIntegrationIdentifier } from "../lib/stripe-idempotency.ts";
import { isCurrentOrUnassignedSubscription, stripeStatusToMembershipStatus } from "../lib/stripe-membership-status.ts";

const now = Date.parse("2026-09-30T12:00:00.000Z");
const paidProfile = {
  role: "user",
  membership_tier: "personal",
  membership_status: "active",
  membership_period_end: "2026-10-30T12:00:00.000Z",
  stripe_subscription_id: "sub_test_only",
};

test("paid media requires a verified email and an active paid Stripe membership", () => {
  assert.equal(hasPaidMediaAccess(null, paidProfile, now), false);
  assert.equal(hasPaidMediaAccess("2026-09-01T00:00:00.000Z", paidProfile, now), true);
});

test("expired, non-active, school, and incomplete billing states do not unlock paid media", () => {
  const confirmed = "2026-09-01T00:00:00.000Z";
  assert.equal(hasPaidMediaAccess(confirmed, { ...paidProfile, membership_status: "past_due" }, now), false);
  assert.equal(hasPaidMediaAccess(confirmed, { ...paidProfile, membership_period_end: "2026-09-30T11:59:59.000Z" }, now), false);
  assert.equal(hasPaidMediaAccess(confirmed, { ...paidProfile, membership_period_end: "not-a-date" }, now), false);
  assert.equal(hasPaidMediaAccess(confirmed, { ...paidProfile, stripe_subscription_id: null }, now), false);
  assert.equal(hasPaidMediaAccess(confirmed, { ...paidProfile, membership_tier: "school" }, now), false);
});

test("only an email-verified administrator receives the administrative media exception", () => {
  const administrator = { role: "administrator", membership_status: "inactive" };
  assert.equal(hasPaidMediaAccess(null, administrator, now), false);
  assert.equal(hasPaidMediaAccess("2026-09-01T00:00:00.000Z", administrator, now), true);
});

test("Stripe checkout idempotency distinguishes promo codes without embedding them", () => {
  const noPromo = membershipCheckoutIdempotencyKey("user-1", "personal", "", 123);
  assert.equal(noPromo, membershipCheckoutIdempotencyKey("user-1", "personal", "", 123));
  assert.notEqual(noPromo, membershipCheckoutIdempotencyKey("user-1", "personal", "WELCOME10", 123));
  assert.equal(noPromo.includes("WELCOME10"), false);
  assert.notEqual(noPromo, membershipCheckoutIdempotencyKey("user-1", "personal", "", 123, "cs_expired_1"));
  assert.equal(
    membershipCheckoutIdempotencyKey("user-1", "personal", "", 123, "cs_expired_1"),
    membershipCheckoutIdempotencyKey("user-1", "personal", "", 123, "cs_expired_1"),
  );
  const identifier = stripeIntegrationIdentifier(noPromo);
  assert.match(identifier, /^teens2inspire_membership_[a-z]{8}$/);
  assert.equal(identifier, stripeIntegrationIdentifier(noPromo));
  assert.notEqual(identifier, stripeIntegrationIdentifier(`${noPromo}-retry`));
});

test("expired or completed Stripe checkout sessions are never reused", () => {
  assert.equal(isUsableCheckoutSession({ status: "open", url: "https://checkout.stripe.test/session", expires_at: 200 }, 100_000), true);
  assert.equal(isUsableCheckoutSession({ status: "expired", url: "https://checkout.stripe.test/session", expires_at: 200 }, 100_000), false);
  assert.equal(isUsableCheckoutSession({ status: "complete", url: "https://checkout.stripe.test/session", expires_at: 200 }, 100_000), false);
  assert.equal(isUsableCheckoutSession({ status: "open", url: "https://checkout.stripe.test/session", expires_at: 100 }, 100_000), false);
  assert.equal(isUsableCheckoutSession({ status: "open", url: null, expires_at: 200 }, 100_000), false);
});

test("only paid or no-payment-required checkout events can sync membership", () => {
  assert.equal(shouldSyncCheckoutMembership("checkout.session.completed", "unpaid"), false);
  assert.equal(shouldSyncCheckoutMembership("checkout.session.completed", "paid"), true);
  assert.equal(shouldSyncCheckoutMembership("checkout.session.completed", "no_payment_required"), true);
  assert.equal(shouldSyncCheckoutMembership("checkout.session.async_payment_succeeded", "paid"), true);
  assert.equal(shouldSyncCheckoutMembership("checkout.session.async_payment_failed", "unpaid"), false);
});

test("Stripe membership status mapping keeps incomplete or canceled subscriptions locked", () => {
  assert.equal(stripeStatusToMembershipStatus("active"), "active");
  assert.equal(stripeStatusToMembershipStatus("trialing"), "active");
  assert.equal(stripeStatusToMembershipStatus("past_due"), "past_due");
  assert.equal(stripeStatusToMembershipStatus("canceled"), "canceled");
  assert.equal(stripeStatusToMembershipStatus("incomplete_expired"), "canceled");
  assert.equal(stripeStatusToMembershipStatus("incomplete"), "pending_payment");
  assert.equal(stripeStatusToMembershipStatus("unexpected"), "pending_payment");
});

test("stale subscription events cannot overwrite a different current membership", () => {
  assert.equal(isCurrentOrUnassignedSubscription(null, "sub_new"), true);
  assert.equal(isCurrentOrUnassignedSubscription(undefined, "sub_new"), true);
  assert.equal(isCurrentOrUnassignedSubscription("sub_new", "sub_new"), true);
  assert.equal(isCurrentOrUnassignedSubscription("sub_new", "sub_old"), false);
});
