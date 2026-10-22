"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
export async function deleteSchoolCode(formData: FormData) {
  const { supabase } = await requireAdmin(); const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/schools?error=invalid");
  const { error } = await supabase.from("school_codes").delete().eq("id", id);
  if (error) redirect("/admin/schools?error=delete-failed");
  revalidatePath("/admin/schools"); redirect("/admin/schools?deleted=1");
}
export async function setSchoolCodeStatus(formData: FormData) {
  const { supabase } = await requireAdmin(); const id = String(formData.get("id") || ""); const active = String(formData.get("is_active") || "") === "true";
  if (!id) redirect("/admin/schools?error=invalid");
  const { error } = await supabase.from("school_codes").update({ is_active: active }).eq("id", id);
  if (error) redirect("/admin/schools?error=save-failed");
  revalidatePath("/admin/schools"); redirect("/admin/schools?updated=1");
}
export async function deleteSchool(formData: FormData) {
  const { supabase } = await requireAdmin(); const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/schools?error=invalid");
  const { error } = await supabase.from("schools").delete().eq("id", id);
  if (error) redirect("/admin/schools?error=delete-failed");
  revalidatePath("/admin/schools"); redirect("/admin/schools?deleted=1");
}
