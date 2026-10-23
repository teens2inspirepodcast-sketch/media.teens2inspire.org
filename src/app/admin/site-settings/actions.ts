"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
const allowed = new Set(["home_hero_title", "home_hero_subtitle", "mission_title", "mission_body", "founder_bio", "podcast_description"]);
export async function updateMarketingSetting(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const setting_key = String(formData.get("setting_key") || "");
  const setting_value = String(formData.get("setting_value") || "").trim().slice(0, 8000);
  if (!allowed.has(setting_key) || !setting_value) redirect("/admin/site-settings?error=invalid");
  const { error } = await supabase.from("marketing_settings").upsert({ setting_key, setting_value, updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: "setting_key" });
  if (error) redirect("/admin/site-settings?error=save-failed");
  revalidatePath("/admin/site-settings"); revalidatePath("/admin"); redirect("/admin/site-settings?saved=1");
}
