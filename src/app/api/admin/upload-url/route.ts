import { NextResponse } from "next/server";
import { getCurrentUser, getOwnProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const profile = await getOwnProfile(user.id);
  if (profile?.role !== "administrator") return NextResponse.json({ error: "You do not have permission to upload content." }, { status: 403 });
  let body: { key?: unknown; contentType?: unknown; contentLength?: unknown; isPublic?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid upload request." }, { status: 400 }); }
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.functions.invoke("r2-media", { body: { ...body, action: "upload-url" } });
  if (error || typeof data?.url !== "string") return NextResponse.json({ error: typeof data?.error === "string" ? data.error : "Uploads are temporarily unavailable. Please try again." }, { status: 502 });
  return NextResponse.json({ url: data.url, key: data.key });
}
