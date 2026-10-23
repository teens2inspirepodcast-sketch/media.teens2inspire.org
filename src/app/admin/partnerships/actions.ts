"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

function clean(formData: FormData, key: string, max = 1000) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function logoUrl(value: string) {
  if (/^\/(partners|uploads|podcast-platforms)\/[a-zA-Z0-9._/-]+$/.test(value) && !value.includes("..")) return value;
  try { const url = new URL(value); return url.protocol === "https:" ? url.toString() : null; } catch { return null; }
}
function websiteUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" ? url.toString() : null; } catch { return null; }
}

export async function createPartnership(formData: FormData) {
  const { supabase } = await requireAdmin();
  const name = clean(formData, "name", 100);
  const logo_url = logoUrl(clean(formData, "logo_url", 1000));
  const website_url = websiteUrl(clean(formData, "website_url", 1000));
  const description = clean(formData, "description", 500) || null;
  const display_order = Number(clean(formData, "display_order", 8) || "0");
  if (name.length < 2 || !logo_url || !website_url || !Number.isInteger(display_order) || display_order < 0 || display_order > 10000) redirect("/admin/partnerships?error=invalid");
  const { error } = await supabase.from("partnerships").insert({ name, logo_url, website_url, description, display_order, is_active: true });
  if (error) redirect(`/admin/partnerships?error=${error.code === "23505" ? "duplicate" : "save-failed"}`);
  revalidatePath("/admin/partnerships"); revalidatePath("/admin"); redirect("/admin/partnerships?saved=1");
}
export async function togglePartnership(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = clean(formData, "id", 50);
  const is_active = clean(formData, "is_active", 8) === "true";
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/partnerships?error=invalid");
  const { error } = await supabase.from("partnerships").update({ is_active, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect("/admin/partnerships?error=save-failed");
  revalidatePath("/admin/partnerships"); redirect("/admin/partnerships?saved=1");
}
export async function deletePartnership(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = clean(formData, "id", 50);
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/partnerships?error=invalid");
  const { error } = await supabase.from("partnerships").delete().eq("id", id);
  if (error) redirect("/admin/partnerships?error=save-failed");
  revalidatePath("/admin/partnerships"); redirect("/admin/partnerships?deleted=1");
}
