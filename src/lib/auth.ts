import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const ADMIN_USER_ID = "8e8ba797-0f01-4956-b747-8122b28a777a";

type Profile = {
  id: string; display_name: string | null; role: string; membership_status: string | null;
  membership_tier: string | null; membership_type: string | null; school_id: string | null;
  membership_expires_at: string | null; stripe_subscription_id: string | null;
  cancel_at_period_end: boolean; membership_period_end: string | null; profile_color: string | null; avatar_path?: string | null;
};

export async function getContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null as Profile | null };
  const { data: profile, error } = await supabase.from("profiles")
    .select("id,display_name,role,membership_status,membership_tier,membership_type,school_id,membership_expires_at,stripe_subscription_id,cancel_at_period_end,membership_period_end,profile_color,avatar_path")
    .eq("id", user.id).maybeSingle();
  if (error) console.error("Profile lookup failed", error.message);
  return { supabase, user, profile: (profile || null) as Profile | null };
}

function notExpired(value: string | null | undefined) {
  return !value || new Date(value).getTime() > Date.now();
}
export function hasActiveEntitlement(profile: Profile | null | undefined, userId?: string | null) {
  if (userId === ADMIN_USER_ID && profile?.role === "administrator") return true;
  if (!profile || profile.membership_status !== "active") return false;
  if (!notExpired(profile.membership_period_end) || !notExpired(profile.membership_expires_at)) return false;
  if (profile.membership_tier === "school") return Boolean(profile.school_id);
  if (profile.membership_tier === "personal" || profile.membership_tier === "family") return Boolean(profile.stripe_subscription_id);
  return false;
}

export async function requireUser(next = "/app") {
  const context = await getContext();
  if (!context.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!hasActiveEntitlement(context.profile, context.user.id)) {
    if (context.profile?.membership_tier === "school" || context.profile?.membership_status === "pending_school_code") {
      redirect("https://teens2inspire.org/school?access=required");
    }
    redirect("https://teens2inspire.org/membership?access=required");
  }
  return context;
}

export async function requireAdmin() {
  const context = await getContext();
  if (!context.user) redirect("/login?next=%2Fadmin");
  if (context.user.id !== ADMIN_USER_ID || context.profile?.role !== "administrator") redirect("/app");
  return context;
}
