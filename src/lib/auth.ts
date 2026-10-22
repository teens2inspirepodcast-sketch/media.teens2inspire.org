import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, profile: null };

  // The profiles table intentionally does not duplicate auth.users.email.
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,display_name,role,membership_status,membership_tier,profile_color")
    .eq("id", user.id)
    .maybeSingle();

  if (error) console.error("Profile lookup failed", error.message);
  return { supabase, user, profile };
}

export async function requireUser(next = "/app") {
  const context = await getContext();
  if (!context.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return context;
}

export async function requireAdmin() {
  const context = await getContext();
  if (!context.user) redirect("/login?next=%2Fadmin");
  if (context.profile?.role !== "administrator") redirect("/app");
  return context;
}
