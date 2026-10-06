import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { profileMembershipIsActive } from "@/lib/membership-access";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getCurrentUser() {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getOwnProfile(userId: string) {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/v2/dashboard");
  return user;
}

export async function requireAdministrator() {
  const user = await requireUser();
  const profile = await getOwnProfile(user.id);
  if (profile?.role !== "administrator") redirect("/v2/dashboard");
  return { user, profile };
}

export function isMember(profile: Pick<Profile, "membership_status" | "membership_expires_at" | "membership_period_end"> | null) {
  return profileMembershipIsActive(profile);
}
