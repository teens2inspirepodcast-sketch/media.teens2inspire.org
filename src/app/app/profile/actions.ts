"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { cookies } from "next/headers";

const ACTIVE_PROFILE_COOKIE = "t2i-active-family-profile";
const AVATAR_BUCKET = "profile-avatars";
const MAX_AVATAR_BYTES = 3 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

function avatarRedirect(message: string): never { redirect(`/app/profile?avatar=${message}`); }

export async function createFamilyProfile(formData: FormData) {
  const returnTo = String(formData.get("return_to") || "picker");
  const errorBase = returnTo === "add-page" ? "/app/profiles/add?error=" : "/app/profiles?error=";
  const { supabase, profile } = await requireUser(returnTo === "add-page" ? "/app/profiles/add" : "/app/profiles");
  // Keep profile creation intentionally simple: one name, no picture or customization required.
  const displayName = String(formData.get("display_name") || formData.get("first_name") || "").trim().slice(0, 40);
  if (!displayName || profile?.membership_tier !== "family" || profile?.membership_status !== "active") {
    redirect(`${errorBase}unavailable`);
  }
  const { error } = await supabase.rpc("add_family_profile", {
    p_first_name: displayName.slice(0, 60),
    p_display_name: displayName,
    p_interests: [],
  });
  if (error) {
    console.error("Family profile creation failed", error.message);
    const message = /active Family membership|membership/i.test(error.message) ? "unavailable"
      : /three profiles|two additional|limit/i.test(error.message) ? "limit" : "save-failed";
    redirect(`${errorBase}${message}`);
  }
  revalidatePath("/app/profiles");
  revalidatePath("/app/profile");
  revalidatePath("/app");
  // Return to the dedicated profile picker so the newly saved profile is immediately visible.
  redirect("/app/profiles?created=1");
}

export async function deleteFamilyProfile(formData: FormData) {
  const { supabase, profile } = await requireUser("/app/profile");
  const id = String(formData.get("id") || "");
  if (!id || profile?.membership_tier !== "family" || profile?.membership_status !== "active") redirect("/app/profile");
  const { error } = await supabase.rpc("remove_family_profile", { p_profile_id: id });
  if (error) redirect("/app/profile?family=save-failed");
  const cookieStore = await cookies();
  if (cookieStore.get(ACTIVE_PROFILE_COOKIE)?.value === id) cookieStore.delete(ACTIVE_PROFILE_COOKIE);
  revalidatePath("/app/profile"); revalidatePath("/app");
  redirect("/app/profile?family=updated");
}

export async function saveProfileSettings(formData: FormData) {
  const { supabase } = await requireUser("/app/profile");
  const displayName = String(formData.get("display_name") || "").trim().slice(0, 80);
  const profileColor = String(formData.get("profile_color") || "#B85679");
  if (!displayName || !/^#[0-9A-Fa-f]{6}$/.test(profileColor)) redirect("/app/profile?settings=invalid");
  const { error } = await supabase.rpc("update_my_profile_settings", { p_display_name: displayName, p_profile_color: profileColor });
  if (error) redirect("/app/profile?settings=save-failed");
  revalidatePath("/app/profile"); revalidatePath("/app"); redirect("/app/profile?settings=saved");
}


export async function switchToOwnerProfile() {
  await requireUser("/app/profile");
  const cookieStore = await cookies();
  cookieStore.set("t2i-picker-dismissed", "1", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  cookieStore.set(ACTIVE_PROFILE_COOKIE, "owner", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/app"); revalidatePath("/app/profile");
  redirect("/app");
}

export async function switchFamilyProfile(formData: FormData) {
  const { supabase, user, profile } = await requireUser("/app/profile");
  const id = String(formData.get("profile_id") || "");
  if (!id || profile?.membership_tier !== "family" || profile?.membership_status !== "active") redirect("/app/profile?family=unavailable");
  const { data, error } = await supabase.from("family_profiles").select("id").eq("id", id).eq("owner_id", user!.id).maybeSingle();
  if (error || !data) redirect("/app/profile?family=save-failed");
  const cookieStore = await cookies();
  cookieStore.set("t2i-picker-dismissed", "1", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  cookieStore.set(ACTIVE_PROFILE_COOKIE, id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/app"); revalidatePath("/app/profile");
  redirect("/app");
}

export async function uploadAvatar(formData: FormData) {
  const { supabase, user, profile } = await requireUser("/app/profile");
  const targetId = String(formData.get("target_profile_id") || "owner");
  const file = formData.get("avatar_file");
  if (!(file instanceof File) || file.size < 1 || file.size > MAX_AVATAR_BYTES || !ALLOWED_AVATAR_TYPES[file.type]) avatarRedirect("invalid");

  let familyProfileId: string | null = null;
  let previousAvatarPath: string | null = targetId === "owner" ? profile?.avatar_path || null : null;
  if (targetId !== "owner") {
    if (profile?.membership_tier !== "family" || profile?.membership_status !== "active") avatarRedirect("unavailable");
    const { data, error } = await supabase.from("family_profiles").select("id,avatar_path").eq("id", targetId).eq("owner_id", user!.id).maybeSingle();
    if (error || !data) avatarRedirect("unavailable");
    familyProfileId = data.id;
    previousAvatarPath = data.avatar_path || null;
  }

  const extension = ALLOWED_AVATAR_TYPES[file.type];
  const path = `${user!.id}/${familyProfileId || "owner"}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, { contentType: file.type, upsert: false, cacheControl: "3600" });
  if (uploadError) { console.error("Avatar upload failed", uploadError.message); avatarRedirect("upload-failed"); }

  const { error: saveError } = familyProfileId
    ? await supabase.rpc("set_family_profile_avatar", { p_profile_id: familyProfileId, p_avatar_path: path })
    : await supabase.rpc("set_my_profile_avatar", { p_avatar_path: path });
  if (saveError) {
    await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    console.error("Avatar path save failed", saveError.message);
    avatarRedirect("save-failed");
  }
  if (previousAvatarPath && previousAvatarPath !== path) {
    const { error: cleanupError } = await supabase.storage.from(AVATAR_BUCKET).remove([previousAvatarPath]);
    if (cleanupError) console.warn("Old avatar cleanup failed", cleanupError.message);
  }
  revalidatePath("/app"); revalidatePath("/app/profile");
  redirect("/app/profile?avatar=saved");
}
