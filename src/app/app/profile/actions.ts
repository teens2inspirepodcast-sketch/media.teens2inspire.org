"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
export async function createFamilyProfile(formData: FormData) {
  const { supabase, user, profile } = await requireUser("/app/profile");
  const display_name = String(formData.get("display_name") || "").trim().slice(0, 40);
  if (!display_name || profile?.membership_tier !== "family" || profile?.membership_status !== "active") redirect("/app/profile?family=unavailable");
  const { error } = await supabase.from("family_profiles").insert({ owner_user_id: user!.id, display_name });
  if (error) redirect(`/app/profile?family=${error.code === "42501" || error.code === "23514" ? "limit" : "save-failed"}`);
  revalidatePath("/app/profile"); redirect("/app/profile?family=created");
}
export async function deleteFamilyProfile(formData: FormData) {
  const { supabase, user, profile } = await requireUser("/app/profile"); const id = String(formData.get("id") || "");
  if (!id || profile?.membership_tier !== "family" || profile?.membership_status !== "active") redirect("/app/profile");
  await supabase.from("family_profiles").delete().eq("id", id).eq("owner_user_id", user!.id);
  revalidatePath("/app/profile"); redirect("/app/profile?family=updated");
}
