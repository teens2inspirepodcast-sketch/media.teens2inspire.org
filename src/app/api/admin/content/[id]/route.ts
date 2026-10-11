import { NextResponse } from "next/server";
import { getCurrentUser, getOwnProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

const statuses = new Set(["draft", "published", "archived"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const profile = await getOwnProfile(user.id);
  if (profile?.role !== "administrator") return NextResponse.json({ error: "You do not have permission to manage content." }, { status: 403 });
  let body: { status?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (typeof body.status !== "string" || !statuses.has(body.status)) return NextResponse.json({ error: "Choose a valid content status." }, { status: 400 });
  const { id } = await params;
  const supabase = await createServerSupabase();
  const update: { status: "draft" | "published" | "archived"; published_at?: string | null } = { status: body.status as "draft" | "published" | "archived" };
  if (body.status === "published") update.published_at = new Date().toISOString();
  const { error } = await supabase.from("content").update(update as never).eq("id", id);
  if (error) return NextResponse.json({ error: "Could not update this content item." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
