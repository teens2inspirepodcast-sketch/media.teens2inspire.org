"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
const kinds = new Set(["discount", "gift_card"]);
const plans = new Set(["personal", "family"]);
export async function createPromoCode(formData: FormData) {
  const { supabase } = await requireAdmin();
  const code = String(formData.get("code") || "").trim().toUpperCase().replace(/\s+/g, "");
  const code_type = String(formData.get("code_type") || "gift_card");
  const membership_plan = String(formData.get("membership_plan") || "personal");
  const duration_months = Number(formData.get("duration_months") || 1);
  const discountRaw = String(formData.get("discount_percent") || "");
  const discount_percent = discountRaw ? Number(discountRaw) : null;
  const max_uses = Number(formData.get("max_uses") || 1);
  const expiresRaw = String(formData.get("expires_at") || "");
  const expiresDate = expiresRaw ? new Date(expiresRaw) : null;
  const expires_at = expiresDate && !Number.isNaN(expiresDate.getTime()) ? expiresDate.toISOString() : null;
  if ((expiresRaw && !expires_at) || !/^[A-Z0-9_-]{4,48}$/.test(code) || !kinds.has(code_type) || !plans.has(membership_plan) || !Number.isInteger(duration_months) || duration_months < 1 || duration_months > 12 || !Number.isInteger(max_uses) || max_uses < 1 || max_uses > 100000 || (discount_percent !== null && (!Number.isInteger(discount_percent) || discount_percent < 1 || discount_percent > 100)) || (code_type === "discount" && discount_percent === null)) redirect("/admin/codes?error=invalid");
  const { error } = await supabase.from("promo_codes").insert({ code, code_type, membership_plan, duration_months, discount_percent: code_type === "discount" ? discount_percent : null, max_uses, expires_at, notes: String(formData.get("notes") || "").trim() || null });
  if (error) redirect(`/admin/codes?error=${error.code === "23505" ? "duplicate" : "save-failed"}`);
  revalidatePath("/admin/codes"); redirect("/admin/codes?created=1");
}
export async function setPromoCodeActive(formData: FormData) {
  const { supabase } = await requireAdmin(); const id = String(formData.get("id") || ""); const is_active = String(formData.get("is_active") || "") === "true";
  if (!id) redirect("/admin/codes?error=invalid");
  const { error } = await supabase.from("promo_codes").update({ is_active }).eq("id", id);
  if (error) redirect("/admin/codes?error=save-failed");
  revalidatePath("/admin/codes"); redirect("/admin/codes?updated=1");
}

export async function deletePromoCode(formData: FormData) {
  const { supabase } = await requireAdmin(); const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/codes?error=invalid");
  const { error } = await supabase.from("promo_codes").delete().eq("id", id);
  if (error) redirect("/admin/codes?error=delete-failed");
  revalidatePath("/admin/codes"); redirect("/admin/codes?deleted=1");
}
