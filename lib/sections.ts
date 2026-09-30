import "server-only";
import { createClient } from "@/lib/supabase/server";
import { withMediaUrls, type ContentRecord } from "@/lib/content";

export type ContentSection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  artwork_url: string | null;
  background_image_url: string | null;
  section_type: string;
  display_order: number;
  is_active: boolean;
  show_on_homepage: boolean;
  show_in_navigation: boolean;
  card_style: string;
  max_items: number;
  see_all_label: string;
  content: ContentRecord[];
};

export async function getHomepageSections(): Promise<ContentSection[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data: sections } = await supabase.from("sections").select("*").eq("is_active", true).eq("show_on_homepage", true).order("display_order").limit(16);
  if (!sections?.length) return [];
  const ids = sections.map((section) => section.id);
  const { data: links } = await supabase.from("section_content").select("section_id,content_id,display_order").in("section_id", ids).order("display_order");
  if (!links?.length) return sections.map((section) => ({ ...section, content: [] })) as ContentSection[];
  const contentIds = [...new Set(links.map((link) => link.content_id))];
  const { data: records } = await supabase.from("content").select("*").in("id", contentIds).eq("status", "published");
  const byId = new Map((records ?? []).map((record) => [record.id, withMediaUrls(record as ContentRecord)]));
  return sections.map((section) => ({ ...section, content: links.filter((link) => link.section_id === section.id).map((link) => byId.get(link.content_id)).filter((record): record is ContentRecord => Boolean(record)).slice(0, section.max_items) })) as ContentSection[];
}

export async function getPublicSection(slug: string): Promise<ContentSection | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: section } = await supabase.from("sections").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (!section) return null;
  const { data: links } = await supabase.from("section_content").select("content_id,display_order").eq("section_id", section.id).order("display_order");
  const ids = (links ?? []).map((link) => link.content_id);
  if (!ids.length) return { ...section, content: [] } as ContentSection;
  const { data: records } = await supabase.from("content").select("*").in("id", ids).eq("status", "published");
  const byId = new Map((records ?? []).map((record) => [record.id, withMediaUrls(record as ContentRecord)]));
  return { ...section, content: (links ?? []).map((link) => byId.get(link.content_id)).filter((record): record is ContentRecord => Boolean(record)) } as ContentSection;
}
