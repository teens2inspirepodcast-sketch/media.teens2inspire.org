import assert from "node:assert/strict";
import test from "node:test";
import { hasPaidMediaAccess } from "../lib/membership-access-policy.ts";
import { membershipCheckoutIdempotencyKey } from "../lib/stripe-idempotency.ts";

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
});
