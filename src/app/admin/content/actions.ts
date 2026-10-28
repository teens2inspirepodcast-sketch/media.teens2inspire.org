"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

const types = new Set(["video", "podcast", "article", "resource", "printable", "pick", "event", "recipe", "original"]);
const statuses = new Set(["draft", "published", "archived"]);
function slugify(value: string) { return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90); }
function safeHttps(value: string) { if (!value) return null; try { const url = new URL(value); return url.protocol === "https:" ? url.toString() : null; } catch { return null; } }

export async function createContent(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const slug = slugify(String(formData.get("slug") || title));
  const type = String(formData.get("type") || "video");
  const status = String(formData.get("status") || "draft");
  const description = String(formData.get("description") || "").trim();
  const category = String(formData.get("category") || "").trim() || null;
  const tags = String(formData.get("tags") || "").split(",").map(tag => tag.trim()).filter(Boolean).slice(0, 20);
  const coverUrlRaw = String(formData.get("cover_url") || "").trim();
  const cover_url = coverUrlRaw ? (/^\/api\/media\/artwork\/[A-Za-z0-9._/-]+$/.test(coverUrlRaw) && !coverUrlRaw.includes("..") ? coverUrlRaw : safeHttps(coverUrlRaw)) : null;
  const externalUrlRaw = String(formData.get("external_url") || "").trim();
  const external_url = externalUrlRaw ? safeHttps(externalUrlRaw) : null;
  const r2_media_key = String(formData.get("r2_media_key") || "").trim() || null;
  const durationRaw = String(formData.get("duration_seconds") || "").trim();
  const duration_seconds = durationRaw ? Number(durationRaw) : null;
  if (!title || !slug || !types.has(type) || !statuses.has(status) || (coverUrlRaw && !cover_url) || (externalUrlRaw && !external_url) || (duration_seconds !== null && (!Number.isInteger(duration_seconds) || duration_seconds < 0 || duration_seconds > 86400)) || (r2_media_key && !/^(podcasts|videos|downloads)\/[A-Za-z0-9._/-]+$/.test(r2_media_key)) || (r2_media_key && /(^|\/)\.\.?($|\/)/.test(r2_media_key))) redirect("/admin/content?error=invalid");
  const sectionId = String(formData.get("section_id") || "").trim();
  if (sectionId) {
    const { data: section, error: sectionError } = await supabase.from("sections").select("id").eq("id", sectionId).maybeSingle();
    if (sectionError || !section) redirect("/admin/content?error=invalid");
  }
  const { data: created, error } = await supabase.from("content").insert({
    title, slug, type, status, description, body: String(formData.get("body_content") || "").trim() || null, category, tags, cover_url, external_url, r2_media_key, duration_seconds,
    member_only: formData.get("member_only") === "on", featured: formData.get("featured") === "on",
    created_by: user?.id, published_at: status === "published" ? new Date().toISOString() : null,
  }).select("id").single();
  if (error || !created) redirect(`/admin/content?error=${encodeURIComponent(error?.code === "23505" ? "duplicate-slug" : "save-failed")}`);
  if (sectionId) {
    const { error: linkError } = await supabase.from("section_content").upsert({ section_id: sectionId, content_id: created.id, display_order: 0 }, { onConflict: "section_id,content_id" });
    if (linkError) {
      await supabase.from("content").delete().eq("id", created.id);
      redirect("/admin/content?error=section-link-failed");
    }
  }
  revalidatePath("/admin/content"); revalidatePath("/admin/sections"); revalidatePath("/app"); redirect("/admin/content?created=1");
}

export async function setContentStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !statuses.has(status)) redirect("/admin/content?error=invalid");
  const { error } = await supabase.from("content").update({ status, published_at: status === "published" ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect("/admin/content?error=save-failed");
  revalidatePath("/admin/content"); revalidatePath("/app"); redirect("/admin/content?updated=1");
}

export async function deleteContent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/content?error=invalid");
  const { error } = await supabase.from("content").delete().eq("id", id);
  if (error) redirect("/admin/content?error=delete-failed");
  revalidatePath("/admin/content"); revalidatePath("/app"); revalidatePath("/app/explore");
  redirect("/admin/content?deleted=1");
}
