"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

const grab = (form: FormData, name: string, length: number) =>
  String(form.get(name) ?? "").trim().slice(0, length);
const errorGo = (message: string): never => redirect(`/admin/popup?notice=${encodeURIComponent(message)}`);

export async function saveSitePopup(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const eyebrow = grab(formData, "eyebrow", 90);
  const title = grab(formData, "title", 140);
  const body = grab(formData, "body", 1200);
  const ctaLabel = grab(formData, "cta_label", 55);
  const ctaHref = grab(formData, "cta_href", 1000);
  const mediaPath = grab(formData, "media_path", 226);
  const mediaKind = grab(formData, "media_kind", 8);
  const mediaAlt = grab(formData, "media_alt", 180);
  const enabled = formData.get("is_enabled") === "on";
  if (!title) errorGo("Please add a pop-up title.");
  if (!ctaLabel) errorGo("Please add a button label.");
  if (!(/^\/(?!\/)/.test(ctaHref) || /^https:\/\//i.test(ctaHref))) errorGo("Button link must be a site path or an HTTPS link.");
  if (mediaPath && !/^popup\/[a-z0-9._/-]{1,220}$/i.test(mediaPath)) errorGo("Invalid uploaded media path.");
  if (mediaPath && !["image", "video"].includes(mediaKind)) errorGo("Please upload an image or video.");
  if (!mediaPath && mediaKind) errorGo("Please finish uploading your media before saving.");
  // Prevent a stale or altered form from pointing the modal at an object not in our bucket.
  if (mediaPath) {
    const parent = mediaPath.substring(0, mediaPath.lastIndexOf("/"));
    const file = mediaPath.substring(mediaPath.lastIndexOf("/") + 1);
    const { data, error } = await supabase.storage.from("site-popup-media").list(parent, { search: file, limit: 100 });
    if (error || !data?.some(item => item.name === file)) errorGo("Uploaded media was not found. Upload it again before saving.");
  }
  const { error } = await supabase.from("site_popup").upsert({
    id: 1, eyebrow, title, body, cta_label: ctaLabel, cta_href: ctaHref,
    is_enabled: enabled, media_path: mediaPath || null, media_kind: mediaPath ? mediaKind : null,
    media_alt: mediaAlt || "Teens2Inspire announcement", updated_at: new Date().toISOString(), updated_by: user.id,
  }, { onConflict: "id" });
  if (error) errorGo(`Pop-up settings could not be saved: ${error.message}`);
  revalidatePath("/");
  revalidatePath("/admin/popup");
  redirect("/admin/popup?notice=Your%20pop-up%20has%20been%20saved.%20Published%20changes%20are%20live.");
}
