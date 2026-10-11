import { NextResponse } from "next/server";
import { getCurrentUser, getOwnProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to manage discounts." }, { status: 401 });
  const profile = await getOwnProfile(user.id);
  if (profile?.role !== "administrator") return NextResponse.json({ error: "You do not have permission to manage discounts." }, { status: 403 });
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.functions.invoke("manage-promotions", { body: { action: "list" } });
  if (error || !Array.isArray(data?.promotions)) return NextResponse.json({ error: typeof data?.error === "string" ? data.error : "Discount codes could not be loaded." }, { status: 502 });
  return NextResponse.json({ promotions: data.promotions });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to manage discounts." }, { status: 401 });
  const profile = await getOwnProfile(user.id);
  if (profile?.role !== "administrator") return NextResponse.json({ error: "You do not have permission to manage discounts." }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid discount request." }, { status: 400 }); }
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.functions.invoke("manage-promotions", { body });
  if (error || data?.ok === false || data?.error) return NextResponse.json({ error: typeof data?.error === "string" ? data.error : "The discount could not be processed. Please try again." }, { status: 502 });
  return NextResponse.json(data || { ok: true });
}
