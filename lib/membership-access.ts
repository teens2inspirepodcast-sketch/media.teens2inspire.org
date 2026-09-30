import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { hasPaidMediaAccess } from "@/lib/membership-access-policy";

type MembershipProfile = {
  role: string | null;
  membership_tier: string | null;
  membership_status: string | null;
  membership_period_end: string | null;
  stripe_subscription_id: string | null;
};

export type ViewerAccess = {
  isSignedIn: boolean;
  canWatchVideos: boolean;
  canAccessMembersContent: boolean;
  isAdministrator: boolean;
};

export async function getViewerAccess(client?: SupabaseClient | null): Promise<ViewerAccess> {
  const supabase = client === undefined ? await createClient() : client;
  if (!supabase) return { isSignedIn: false, canWatchVideos: false, canAccessMembersContent: false, isAdministrator: false };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isSignedIn: false, canWatchVideos: false, canAccessMembersContent: false, isAdministrator: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,membership_tier,membership_status,membership_period_end,stripe_subscription_id")
    .eq("id", user.id)
    .maybeSingle();

  const membership = profile as MembershipProfile | null;
  const isAdministrator = membership?.role === "administrator";
  const mayViewPaidMedia = hasPaidMediaAccess(user.email_confirmed_at, membership);
  return {
    isSignedIn: true,
    isAdministrator,
    canWatchVideos: mayViewPaidMedia,
    canAccessMembersContent: mayViewPaidMedia,
  };
}
