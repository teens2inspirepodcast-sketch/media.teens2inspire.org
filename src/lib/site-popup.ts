import { createClient } from "@/lib/supabase/server";

export type SitePopup = {
  id: number;
  is_enabled: boolean;
  eyebrow: string;
  title: string;
  body: string;
  cta_label: string;
  cta_href: string;
  media_path: string | null;
  media_kind: "image" | "video" | null;
  media_alt: string;
  updated_at?: string;
};

export const defaultPopup: SitePopup = {
  id: 1, is_enabled: false, eyebrow: "A LITTLE SOMETHING NEW",
  title: "Welcome to Teens2Inspire",
  body: "Discover a new space made for Jewish teen girls.",
  cta_label: "Explore Teens2Inspire", cta_href: "/signup",
  media_path: null, media_kind: null, media_alt: "Teens2Inspire announcement",
};

export async function readSitePopup(): Promise<SitePopup | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("site_popup").select("*").eq("id", 1).maybeSingle();
    if (error) return null;
    return data as SitePopup | null;
  } catch { return null; }
}

export async function getPopupMediaUrl(mediaPath: string | null | undefined): Promise<string | null> {
  if (!mediaPath || !/^popup\/[a-z0-9._/-]+$/i.test(mediaPath)) return null;
  try {
    const supabase = await createClient();
    return supabase.storage.from("site-popup-media").getPublicUrl(mediaPath).data.publicUrl;
  } catch { return null; }
}
