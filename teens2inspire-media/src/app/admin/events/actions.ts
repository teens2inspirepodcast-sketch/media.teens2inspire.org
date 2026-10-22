"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
const statuses = new Set(["draft", "published", "archived"]);
function httpsOrNull(value: string) { if (!value) return null; try { const u = new URL(value); return u.protocol === "https:" ? u.toString() : null; } catch { return null; } }
export async function createEvent(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const startsAt = new Date(String(formData.get("starts_at") || ""));
  const endsRaw = String(formData.get("ends_at") || "");
  const endsAt = endsRaw ? new Date(endsRaw) : null;
  const status = String(formData.get("status") || "draft");
  const registrationRaw = String(formData.get("registration_url") || "").trim();
  const registration_url = registrationRaw ? httpsOrNull(registrationRaw) : null;
  const imageRaw = String(formData.get("image_url") || "").trim();
  const image_url = imageRaw ? httpsOrNull(imageRaw) : null;
  if (!title || Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime())) || !statuses.has(status) || (registrationRaw && !registration_url) || (imageRaw && !image_url) || (endsAt && endsAt < startsAt)) redirect("/admin/events?error=invalid");
  const { error } = await supabase.from("events").insert({ title, description, starts_at: startsAt.toISOString(), ends_at: endsAt?.toISOString() || null, location: String(formData.get("location") || "").trim() || null, registration_url, image_url, status, created_by: user?.id });
  if (error) redirect("/admin/events?error=save-failed");
  revalidatePath("/admin/events"); revalidatePath("/events"); redirect("/admin/events?created=1");
}
export async function setEventStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") || ""); const status = String(formData.get("status") || "");
  if (!id || !statuses.has(status)) redirect("/admin/events?error=invalid");
  const { error } = await supabase.from("events").update({ status }).eq("id", id);
  if (error) redirect("/admin/events?error=save-failed");
  revalidatePath("/admin/events"); revalidatePath("/events"); redirect("/admin/events?updated=1");
}
