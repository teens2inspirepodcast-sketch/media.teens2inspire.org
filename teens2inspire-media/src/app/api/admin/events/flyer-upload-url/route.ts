import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getContext } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MIME_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
export async function POST(request: Request) {
  const { user, profile } = await getContext();
  if (!user) return NextResponse.json({ error: "Sign in as an administrator to upload a flyer." }, { status: 401 });
  if (profile?.role !== "administrator") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  let body: { contentType?: unknown; size?: unknown; filename?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid upload request." }, { status: 400 }); }
  const type = typeof body.contentType === "string" ? body.contentType.toLowerCase() : "";
  const size = Number(body.size);
  if (!MIME_EXT[type] || !Number.isSafeInteger(size) || size < 1 || size > 12 * 1024 * 1024) return NextResponse.json({ error: "Choose a PNG, JPG, WebP, or AVIF flyer under 12 MB." }, { status: 400 });
  const account = process.env.R2_ACCOUNT_ID, accessKeyId = process.env.R2_ACCESS_KEY_ID, secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_PUBLIC_BUCKET_NAME || "teens2inspire-public";
  const baseUrl = (process.env.R2_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/$/, "");
  if (!account || !accessKeyId || !secretAccessKey || !baseUrl) return NextResponse.json({ error: "Flyer upload needs R2 credentials and R2_PUBLIC_BASE_URL (the public bucket URL) configured in Vercel." }, { status: 503 });
  const client = new S3Client({ region: "auto", endpoint: `https://${account}.r2.cloudflarestorage.com`, forcePathStyle: true, credentials: { accessKeyId, secretAccessKey } });
  const key = `events/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${MIME_EXT[type]}`;
  try {
    const uploadUrl = await getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: type }), { expiresIn: 300 });
    return NextResponse.json({ uploadUrl, publicUrl: `${baseUrl}/${key}`, contentType: type }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { console.error("Event flyer upload signing failed", error instanceof Error ? error.message : "unknown error"); return NextResponse.json({ error: "Could not prepare the flyer upload. Check R2 permissions." }, { status: 503 }); }
}
