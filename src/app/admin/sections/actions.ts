"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
function slugify(value: string) { return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90); }
export async function createSection(formData: FormData) {
  const { supabase } = await requireAdmin(); const title = String(formData.get("title") || "").trim(); const slug = slugify(String(formData.get("slug") || title));
  if (!title || !slug) redirect("/admin/sections?error=invalid");
  const { error } = await supabase.from("sections").insert({ title, slug, description: String(formData.get("description") || "").trim(), is_published: formData.get("is_published") === "on", sort_order: Number(formData.get("sort_order") || 0) });
  if (error) redirect(`/admin/sections?error=${error.code === "23505" ? "duplicate" : "save-failed"}`);
  revalidatePath("/admin/sections"); revalidatePath("/app"); redirect("/admin/sections?created=1");
}
export async function toggleSection(formData: FormData) {
  const { supabase } = await requireAdmin(); const id = String(formData.get("id") || ""); const is_published = String(formData.get("is_published") || "") === "true";
  if (!id) redirect("/admin/sections?error=invalid");
  const { error } = await supabase.from("sections").update({ is_published }).eq("id", id);
  if (error) redirect("/admin/sections?error=save-failed");
  revalidatePath("/admin/sections"); revalidatePath("/app"); redirect("/admin/sections?updated=1");
}
export async function assignContent(formData: FormData) {
  const { supabase } = await requireAdmin(); const section_id = String(formData.get("section_id") || ""); const content_id = String(formData.get("content_id") || "");
  if (!section_id || !content_id) redirect("/admin/sections?error=invalid");
  const { error } = await supabase.from("section_content").upsert({ section_id, content_id, sort_order: 0 }, { onConflict: "section_id,content_id" });
  if (error) redirect("/admin/sections?error=assign-failed");
  revalidatePath("/admin/sections"); revalidatePath("/app"); redirect("/admin/sections?updated=1");
}
export async function removeSectionContent(formData: FormData) {
  const { supabase } = await requireAdmin(); const section_id = String(formData.get("section_id") || ""); const content_id = String(formData.get("content_id") || "");
  if (!section_id || !content_id) redirect("/admin/sections?error=invalid");
  const { error } = await supabase.from("section_content").delete().eq("section_id", section_id).eq("content_id", content_id);
  if (error) redirect("/admin/sections?error=assign-failed");
  revalidatePath("/admin/sections"); revalidatePath("/app"); redirect("/admin/sections?updated=1");
}
