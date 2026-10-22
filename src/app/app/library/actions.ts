"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
export async function addFavorite(formData: FormData) {
  const id = String(formData.get("content_id") || ""); const { supabase, user } = await requireUser("/app/library");
  if (!id || !user) redirect("/app/library");
  await supabase.from("favorites").upsert({ user_id: user.id, content_id: id }, { onConflict: "user_id,content_id", ignoreDuplicates: true });
  revalidatePath("/app/library"); revalidatePath(`/app/content/${id}`); redirect("/app/library?updated=1");
}
export async function removeFavorite(formData: FormData) {
  const id = String(formData.get("content_id") || ""); const { supabase, user } = await requireUser("/app/library");
  if (!id || !user) redirect("/app/library");
  await supabase.from("favorites").delete().eq("user_id", user.id).eq("content_id", id);
  revalidatePath("/app/library"); revalidatePath(`/app/content/${id}`); redirect("/app/library?updated=1");
}
