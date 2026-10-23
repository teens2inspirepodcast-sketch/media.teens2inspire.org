import { NextResponse } from "next/server";
import { getContext } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime", "audio/mpeg", "audio/mp4", "audio/aac", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm", "application/pdf", "image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const { user, profile, supabase } = await getContext();
  if (!user) return NextResponse.json({ error: "Sign in to upload media." }, { status: 401 });
  if (profile?.role !== "administrator") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  let body: { filename?: unknown; contentType?: unknown; size?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid upload request." }, { status: 400 }); }
  const filename = typeof body.filename === "string" ? body.filename.trim().slice(0, 180) : "";
  const contentType = typeof body.contentType === "string" ? body.contentType.toLowerCase().trim() : "";
  const size = Number(body.size);
  if (!filename || /[\u0000-\u001f\u007f]/.test(filename) || !ALLOWED_TYPES.has(contentType)) return NextResponse.json({ error: "Choose a supported audio, video, PDF, or image file." }, { status: 400 });
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "File must be smaller than 500 MB." }, { status: 400 });
  const { data: { session } } = await supabase.auth.getSession();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!session?.access_token || !url || !anonKey) return NextResponse.json({ error: "Your session or Supabase configuration is unavailable. Please sign in again." }, { status: 401 });
  try {
    const response = await fetch(`${url}/functions/v1/r2-media`, { method: "POST", headers: { "Authorization": `Bearer ${session.access_token}`, "apikey": anonKey, "Content-Type": "application/json" }, body: JSON.stringify({ action: "upload-url", filename, contentType, size }), cache: "no-store" });
    const result = await response.json();
    if (!response.ok) return NextResponse.json({ error: result.error || "Supabase could not prepare the R2 upload." }, { status: response.status, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Supabase R2 upload authorization failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not contact the Supabase media service. Please try again." }, { status: 503 });
  }
}
