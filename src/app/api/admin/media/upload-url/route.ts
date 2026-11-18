import { NextResponse } from "next/server";
import { getContext } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_UPLOAD_BYTES = 10_000_000_000;
const MAX_MULTIPART_PARTS = Math.ceil(MAX_UPLOAD_BYTES / (20 * 1024 * 1024));
const ALLOWED_TYPES = new Set([
  "video/mp4", "video/webm", "video/quicktime", "video/x-matroska",
  "audio/mpeg", "audio/mp4", "audio/aac", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm", "audio/flac",
  "application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/heic", "image/heif",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain", "text/csv",
]);

export async function POST(request: Request) {
  const { user, profile, supabase } = await getContext();
  if (!user) return NextResponse.json({ error: "Sign in to upload media." }, { status: 401 });
  if (profile?.role !== "administrator") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  let body: { filename?: unknown; contentType?: unknown; size?: unknown; artwork?: unknown; action?: unknown; key?: unknown; uploadId?: unknown; partNumber?: unknown; parts?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid upload request." }, { status: 400 }); }
  const multipartActions = new Set(["multipart-init", "multipart-part", "multipart-complete", "multipart-abort"]);
  const multipartAction = typeof body.action === "string" && multipartActions.has(body.action) ? body.action : null;
  if (body.action && !multipartAction) return NextResponse.json({ error: "Unsupported upload action." }, { status: 400 });
  if (multipartAction && multipartAction !== "multipart-init") {
    if (typeof body.key !== "string" || !/^(videos|podcasts|downloads)\/[A-Za-z0-9._/-]+$/.test(body.key) ||
        typeof body.uploadId !== "string" || body.uploadId.length > 512 || !body.uploadId.length)
      return NextResponse.json({ error: "Invalid multipart session." }, { status: 400 });
    if (multipartAction === "multipart-part" && (!Number.isInteger(body.partNumber) || Number(body.partNumber) < 1 || Number(body.partNumber) > MAX_MULTIPART_PARTS))
      return NextResponse.json({ error: "Invalid part number." }, { status: 400 });
    if (multipartAction === "multipart-complete" && (!Array.isArray(body.parts) || body.parts.length > MAX_MULTIPART_PARTS))
      return NextResponse.json({ error: "Invalid parts list." }, { status: 400 });
  }
  const filename = typeof body.filename === "string" ? body.filename.trim().slice(0, 180) : "";
  const contentType = typeof body.contentType === "string" ? body.contentType.toLowerCase().trim() : "";
  const size = Number(body.size);
  if ((!multipartAction || multipartAction === "multipart-init") && (!filename || /[\u0000-\u001f\u007f]/.test(filename) || !ALLOWED_TYPES.has(contentType))) return NextResponse.json({ error: "Choose a supported audio, video, PDF, image, or document file." }, { status: 400 });
  if ((!multipartAction || multipartAction === "multipart-init") && (!Number.isSafeInteger(size) || size < 1 || size > (body.artwork === true ? 20 * 1024 * 1024 : MAX_UPLOAD_BYTES))) return NextResponse.json({ error: body.artwork === true ? "Cover images must be smaller than 20 MB." : "Media files must be 10,000 MB or smaller." }, { status: 400 });
  if ((!multipartAction || multipartAction === "multipart-init") && body.artwork === true && !contentType.startsWith("image/")) return NextResponse.json({ error: "Choose an image file for cover artwork." }, { status: 400 });
  const { data: { session } } = await supabase.auth.getSession();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!session?.access_token || !url || !anonKey) return NextResponse.json({ error: "Your session or Supabase configuration is unavailable. Please sign in again." }, { status: 401 });
  try {
    const response = await fetch(`${url}/functions/v1/r2-media`, { method: "POST", headers: { "Authorization": `Bearer ${session.access_token}`, "apikey": anonKey, "Content-Type": "application/json" }, body: JSON.stringify(multipartAction ? { ...body, action: multipartAction } : { action: "upload-url", filename, contentType, size, artwork: body.artwork === true }), cache: "no-store" });
    const result = await response.json();
    if (!response.ok) return NextResponse.json({ error: result.error || "Supabase could not prepare the R2 upload." }, { status: response.status, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Supabase R2 upload authorization failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not contact the Supabase media service. Please try again." }, { status: 503 });
  }
}
