"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
function text(formData: FormData, key: string, max = 1000) { const value=formData.get(key); return typeof value === "string" ? value.trim().slice(0,max) : ""; }
function safeHttps(v: string) { try { const u=new URL(v); return u.protocol === "https:" ? u.toString() : null; } catch { return null; } }
function safeLogo(v: string) { if (/^\/(podcast-platforms|uploads)\/[a-zA-Z0-9._/-]+$/.test(v) && !v.includes("..")) return v; return safeHttps(v); }
export async function createPlatform(formData: FormData) {
  const { supabase }=await requireAdmin(); const name=text(formData,"name",80); const slug=text(formData,"slug",80).toLowerCase().replace(/\s+/g,"-"); const logo_url=safeLogo(text(formData,"logo_url")); const website_url=safeHttps(text(formData,"website_url")); const display_order=Number(text(formData,"display_order",8)||"0");
  if(name.length<2 || !/^[a-z0-9-]{2,80}$/.test(slug) || !logo_url || !website_url || !Number.isInteger(display_order) || display_order<0 || display_order>10000) redirect("/admin/podcast-platforms?error=invalid");
  const {error}=await supabase.from("podcast_platforms").insert({name,slug,logo_url,website_url,display_order,is_active:true});
  if(error) redirect(`/admin/podcast-platforms?error=${error.code==="23505"?"duplicate":"save-failed"}`);
  revalidatePath("/admin/podcast-platforms"); redirect("/admin/podcast-platforms?saved=1");
}
export async function togglePlatform(formData: FormData) {
  const {supabase}=await requireAdmin();const id=text(formData,"id",50);const is_active=text(formData,"is_active",8)==="true";
  if(!/^[0-9a-f-]{36}$/i.test(id))redirect("/admin/podcast-platforms?error=invalid");
  const {error}=await supabase.from("podcast_platforms").update({is_active,updated_at:new Date().toISOString()}).eq("id",id);
  if(error)redirect("/admin/podcast-platforms?error=save-failed");revalidatePath("/admin/podcast-platforms");redirect("/admin/podcast-platforms?saved=1");
}
export async function deletePlatform(formData: FormData) {
  const {supabase}=await requireAdmin();const id=text(formData,"id",50);if(!/^[0-9a-f-]{36}$/i.test(id))redirect("/admin/podcast-platforms?error=invalid");
  const {error}=await supabase.from("podcast_platforms").delete().eq("id",id);if(error)redirect("/admin/podcast-platforms?error=save-failed");revalidatePath("/admin/podcast-platforms");redirect("/admin/podcast-platforms?deleted=1");
}

export async function updatePlatform(formData: FormData) {
 const {supabase}=await requireAdmin(); const id=text(formData,"id",50); const name=text(formData,"name",80); const slug=text(formData,"slug",80).toLowerCase().replace(/\s+/g,"-");
 const logo_url=safeLogo(text(formData,"logo_url")); const website_url=safeHttps(text(formData,"website_url")); const display_order=Number(text(formData,"display_order",8)||"0"); const is_active=formData.get("is_active")==="on";
 if(!/^[0-9a-f-]{36}$/i.test(id)||name.length<2||!/^[a-z0-9-]{2,80}$/.test(slug)||!logo_url||!website_url||!Number.isInteger(display_order)||display_order<0||display_order>10000)redirect("/admin/podcast-platforms?error=invalid");
 const {error}=await supabase.from("podcast_platforms").update({name,slug,logo_url,website_url,display_order,is_active,updated_at:new Date().toISOString()}).eq("id",id);
 if(error)redirect(`/admin/podcast-platforms?error=${error.code==="23505"?"duplicate":"save-failed"}`);
 revalidatePath("/admin/podcast-platforms");revalidatePath("/podcast");redirect("/admin/podcast-platforms?saved=1");
}
