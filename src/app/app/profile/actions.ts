"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export async function createFamilyProfile(formData: FormData) {
  const { supabase, profile } = await requireUser("/app/profile");
  const firstName = String(formData.get("first_name") || "").trim().slice(0, 60);
  const displayName = String(formData.get("display_name") || "").trim().slice(0, 40);
  if (!firstName || !displayName || profile?.membership_tier !== "family" || profile?.membership_status !== "active") {
    redirect("/app/profile?family=unavailable");
  }
  const { error } = await supabase.rpc("add_family_profile", {
    p_first_name: firstName,
    p_display_name: displayName,
    p_interests: [],
  });
  if (error) {
    const message = /active Family membership/i.test(error.message) ? "unavailable"
      : /three profiles|two additional|limit/i.test(error.message) ? "limit" : "save-failed";
    redirect(`/app/profile?family=${message}`);
  }
  revalidatePath("/app/profile");
  redirect("/app/profile?family=created");
}

export async function deleteFamilyProfile(formData: FormData) {
  const { supabase, profile } = await requireUser("/app/profile");
  const id = String(formData.get("id") || "");
  if (!id || profile?.membership_tier !== "family" || profile?.membership_status !== "active") redirect("/app/profile");
  const { error } = await supabase.rpc("remove_family_profile", { p_profile_id: id });
  if (error) redirect("/app/profile?family=save-failed");
  revalidatePath("/app/profile");
  redirect("/app/profile?family=updated");
}

export async function saveProfileSettings(formData: FormData) {
  const { supabase } = await requireUser("/app/profile");
  const displayName = String(formData.get("display_name") || "").trim().slice(0, 80);
  const profileColor = String(formData.get("profile_color") || "#B85679");
  if (!displayName || !/^#[0-9A-Fa-f]{6}$/.test(profileColor)) redirect("/app/profile?settings=invalid");
  const { error } = await supabase.rpc("update_my_profile_settings", { p_display_name: displayName, p_profile_color: profileColor });
  if (error) redirect("/app/profile?settings=save-failed");
  revalidatePath("/app/profile"); revalidatePath("/app"); redirect("/app/profile?settings=saved");
}
