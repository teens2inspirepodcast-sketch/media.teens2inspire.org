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
  const cover_url = coverUrlRaw ? safeHttps(coverUrlRaw) : null;
  const media_provider_id = String(formData.get("media_provider_id") || "").trim() || null;
  const duration = String(formData.get("duration") || "").trim() || null;
  if (!title || !slug || !types.has(type) || !statuses.has(status) || (coverUrlRaw && !cover_url)) redirect("/admin/content?error=invalid");
  const { error } = await supabase.from("content").insert({
    title, slug, type, status, description, category, tags, cover_url, media_provider_id, duration,
    member_only: formData.get("member_only") === "on", featured: formData.get("featured") === "on",
    created_by: user?.id, published_at: status === "published" ? new Date().toISOString() : null,
  });
  if (error) redirect(`/admin/content?error=${encodeURIComponent(error.code === "23505" ? "duplicate-slug" : "save-failed")}`);
  revalidatePath("/admin/content"); revalidatePath("/app"); redirect("/admin/content?created=1");
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
