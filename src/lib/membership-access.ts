export type ProfileMembershipState = {
  membership_status: string | null;
  membership_expires_at: string | null;
  membership_period_end: string | null;
} | null;

export function profileMembershipIsActive(profile: ProfileMembershipState, now = Date.now()) {
  if (!profile || profile.membership_status !== "active") return false;
  const expiry = profile.membership_expires_at ? Date.parse(profile.membership_expires_at) : null;
  const periodEnd = profile.membership_period_end ? Date.parse(profile.membership_period_end) : null;
  return (expiry === null || expiry > now) && (periodEnd === null || periodEnd > now);
}

export function paidSubscriptionIsActive(status: string, periodEnd: string | null, now = Date.now()) {
  if (status !== "active" && status !== "trialing") return false;
  return !periodEnd || Date.parse(periodEnd) > now;
}

export function legacyMembershipIsActive(status: string, tier: string | null, expiresAt: string | null, now = Date.now()) {
  if (status !== "active" || !tier || tier === "free") return false;
  return !expiresAt || Date.parse(expiresAt) > now;
}
