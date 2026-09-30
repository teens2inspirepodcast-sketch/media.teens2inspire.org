export type MembershipAccessProfile = {
  role?: string | null;
  membership_tier?: string | null;
  membership_status?: string | null;
  membership_period_end?: string | null;
  stripe_subscription_id?: string | null;
} | null;

export function hasPaidMediaAccess(
  emailConfirmedAt: string | null | undefined,
  profile: MembershipAccessProfile,
  now = Date.now(),
) {
  if (!emailConfirmedAt) return false;
  if (profile?.role === "administrator") return true;

  const isPaidTier = profile?.membership_tier === "personal" || profile?.membership_tier === "family";
  const periodEnd = profile?.membership_period_end ? Date.parse(profile.membership_period_end) : Number.NaN;
  return Boolean(
    isPaidTier &&
    profile?.membership_status === "active" &&
    profile.stripe_subscription_id &&
    Number.isFinite(periodEnd) &&
    periodEnd > now,
  );
}
