"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { EDITABLE_MARKETING_FIELDS } from "@/lib/editable-marketing-fields";
const allowed = new Set(Object.keys(EDITABLE_MARKETING_FIELDS));
export async function updateMarketingSetting(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const setting_key = String(formData.get("setting_key") || "");
  const setting_value = String(formData.get("setting_value") || "").trim().slice(0, 8000);
  if (!allowed.has(setting_key) || !setting_value || (setting_key.endsWith("_url") && (!setting_value.startsWith("https://") && !/^\/[a-zA-Z0-9._/-]+$/.test(setting_value)))) redirect("/admin/site-settings?error=invalid");
  const { error } = await supabase.from("marketing_settings").upsert({ setting_key, setting_value, updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: "setting_key" });
  if (error) redirect("/admin/site-settings?error=save-failed");
  revalidatePath("/admin/site-settings"); revalidatePath("/admin"); redirect("/admin/site-settings?saved=1");
}
