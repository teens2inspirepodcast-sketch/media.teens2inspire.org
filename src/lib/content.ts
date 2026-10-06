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
  const { data } = await query.order("published_at", { ascending: false }).limit(options.limit ?? 36);
  return data ?? [];
}

export async function getContentBySlug(slug: string) {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("content").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export function contentArtwork(item: Pick<Content, "r2_thumbnail_key" | "cover_url">) {
  if (item.r2_thumbnail_key) return publicR2AssetUrl(item.r2_thumbnail_key);
  return null;
}

export function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "";
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min` : `${minutes} min`;
}
