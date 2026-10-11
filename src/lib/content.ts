import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import { publicR2AssetUrl } from "@/lib/r2";
import type { Database } from "@/types/database";

export type Content = Database["public"]["Tables"]["content"]["Row"];
export type ContentType = Content["type"];

export const contentTypeLabels: Record<string, string> = { podcast: "Podcast", video: "Video", article: "Article", resource: "Resource", printable: "Printable", event: "Event", recipe: "Recipe", pick: "Pick", original: "Original" };

export async function getPublishedContent(options: { type?: ContentType; types?: ContentType[]; category?: string; search?: string; featured?: boolean; limit?: number } = {}) {
  const supabase = await createServerSupabase();
  let query = supabase.from("content").select("*").eq("status", "published");
  if (options.type) query = query.eq("type", options.type);
  else if (options.types?.length) query = query.in("type", options.types);
  if (options.category) query = query.eq("category", options.category);
  if (options.featured) query = query.eq("featured", true);
  if (options.search) {
    const term = options.search.replace(/[^\p{L}\p{N}\s-]/gu, " ").trim().slice(0, 80).replace(/\s+/g, " ");
    if (term) query = query.or(`title.ilike.%${term}%,short_description.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`);
  }
  try {
    const { data } = await query.order("published_at", { ascending: false }).limit(options.limit ?? 36);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getContentBySlug(slug: string) {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("content").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export function contentArtwork(item: Pick<Content, "r2_thumbnail_key" | "cover_url">) {
  if (item.r2_thumbnail_key) {
    const asset = publicR2AssetUrl(item.r2_thumbnail_key);
    if (asset) return asset;
  }
  const cover = item.cover_url?.trim();
  if (cover) {
    try {
      const parsed = new URL(cover);
      if (parsed.protocol === "https:" && !parsed.username && !parsed.password) return parsed.toString();
    } catch { /* Invalid legacy artwork URLs are ignored. */ }
  }
  return null;
}

export function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "";
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min` : `${minutes} min`;
}

export type HomepageSection = { id: string; name: string; slug: string; section_type: string; max_items: number; display_order: number; items: Content[] };

export async function getHomepageSections(): Promise<HomepageSection[] | null> {
  const supabase = await createServerSupabase();
  type SectionSummary = Pick<Database["public"]["Tables"]["sections"]["Row"], "id" | "name" | "slug" | "section_type" | "max_items" | "display_order" | "is_active" | "show_on_homepage">;
  let allSections: SectionSummary[] | null = null;
  try {
    const result = await supabase.from("sections").select("id,name,slug,section_type,max_items,display_order,is_active,show_on_homepage").order("display_order", { ascending: true }).limit(50);
    if (result.error) return null;
    allSections = result.data;
  } catch {
    return null;
  }
  if (!allSections?.length) return null;
  const sections = allSections.filter((section) => section.is_active && section.show_on_homepage).slice(0, 16);
  const contentTypeSet = new Set(["podcast", "video", "article", "resource", "printable", "event", "recipe", "pick", "original"]);
  const output: HomepageSection[] = [];
  for (const section of sections) {
    const { data: assignments } = await supabase.from("section_content").select("content_id,display_order").eq("section_id", section.id).order("display_order", { ascending: true }).limit(section.max_items);
    let items: Content[] = [];
    if (assignments?.length) {
      const ids = assignments.map((assignment) => assignment.content_id);
      const { data } = await supabase.from("content").select("*").in("id", ids).eq("status", "published");
      const byId = new Map((data ?? []).map((item) => [item.id, item]));
      items = ids.map((id) => byId.get(id)).filter((item): item is Content => Boolean(item));
    } else {
      const type = contentTypeSet.has(section.section_type) ? section.section_type as ContentType : undefined;
      items = await getPublishedContent({ type, limit: section.max_items });
    }
    output.push({ ...section, items });
  }
  return output;
}
