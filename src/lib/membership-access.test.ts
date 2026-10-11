import { describe, expect, it } from "vitest";
import { legacyMembershipIsActive, paidSubscriptionIsActive, profileMembershipIsActive } from "./membership-access";

const now = Date.parse("2026-10-01T12:00:00.000Z");

describe("membership access", () => {
  it("accepts active profiles without an expiry or before both expiries", () => {
    expect(profileMembershipIsActive({ membership_status: "active", membership_expires_at: null, membership_period_end: null }, now)).toBe(true);
    expect(profileMembershipIsActive({ membership_status: "active", membership_expires_at: "2026-10-02T12:00:00.000Z", membership_period_end: null }, now)).toBe(true);
  });
  it("rejects inactive or expired profiles", () => {
    expect(profileMembershipIsActive({ membership_status: "pending_payment", membership_expires_at: null, membership_period_end: null }, now)).toBe(false);
    expect(profileMembershipIsActive({ membership_status: "active", membership_expires_at: "2026-10-01T11:59:59.000Z", membership_period_end: null }, now)).toBe(false);
    expect(profileMembershipIsActive({ membership_status: "active", membership_expires_at: null, membership_period_end: "2026-10-01T11:59:59.000Z" }, now)).toBe(false);
  });
  it("does not treat free legacy rows as paid membership", () => {
    expect(legacyMembershipIsActive("active", "free", null, now)).toBe(false);
    expect(legacyMembershipIsActive("active", "member", null, now)).toBe(true);
    expect(legacyMembershipIsActive("active", "member", "2026-10-01T11:00:00.000Z", now)).toBe(false);
  });
  it("allows only active or trialing subscriptions with a current period", () => {
    expect(paidSubscriptionIsActive("active", "2026-10-02T12:00:00.000Z", now)).toBe(true);
    expect(paidSubscriptionIsActive("trialing", null, now)).toBe(true);
    expect(paidSubscriptionIsActive("past_due", null, now)).toBe(false);
    expect(paidSubscriptionIsActive("active", "2026-10-01T11:00:00.000Z", now)).toBe(false);
  });
});
