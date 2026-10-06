import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import { getOwnProfile, isMember, type Profile } from "@/lib/auth";
import { legacyMembershipIsActive, paidSubscriptionIsActive } from "@/lib/membership-access";

export async function getMembershipSnapshot(userId: string, profile?: Profile | null) {
  const supabase = await createServerSupabase();
  const [profileRow, subscriptions, legacyMemberships] = await Promise.all([
    profile === undefined ? getOwnProfile(userId) : Promise.resolve(profile),
    supabase.from("subscriptions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    supabase.from("memberships").select("tier, status, started_at, expires_at, plan").eq("user_id", userId),
  ]);
  const activeSubscription = (subscriptions.data ?? []).find((subscription) =>
    paidSubscriptionIsActive(subscription.status, subscription.current_period_end),
  ) ?? null;
  const activeLegacy = (legacyMemberships.data ?? []).find((membership) =>
    legacyMembershipIsActive(membership.status, membership.tier, membership.expires_at),
  ) ?? null;
  return { profile: profileRow, subscription: (subscriptions.data ?? [])[0] ?? null, activeSubscription, activeLegacy, isActive: isMember(profileRow) || Boolean(activeSubscription || activeLegacy) };
}
