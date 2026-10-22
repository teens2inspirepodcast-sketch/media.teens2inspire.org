import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getContext } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "video/mp4", "video/webm", "video/quicktime", "audio/mpeg", "audio/mp4",
  "audio/aac", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm",
]);
const EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
  "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/aac": "aac",
  "audio/wav": "wav", "audio/x-wav": "wav", "audio/ogg": "ogg", "audio/webm": "webm",
};

function r2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) return null;
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function POST(request: Request) {
  const { user, profile } = await getContext();
  if (!user) return NextResponse.json({ error: "Sign in to upload media." }, { status: 401 });
  if (profile?.role !== "administrator") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  let body: { filename?: unknown; contentType?: unknown; size?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid upload request." }, { status: 400 }); }
  const filename = typeof body.filename === "string" ? body.filename.trim().slice(0, 180) : "";
  const contentType = typeof body.contentType === "string" ? body.contentType.toLowerCase().trim() : "";
  const size = Number(body.size);
  if (!filename || /[\u0000-\u001f\u007f]/.test(filename) || !ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json({ error: "Choose an MP4, WebM, MOV, MP3, M4A, AAC, WAV, or OGG audio/video file." }, { status: 400 });
  }
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File must be smaller than 500 MB." }, { status: 400 });
  }
  const bucket = process.env.R2_PRIVATE_BUCKET_NAME || process.env.R2_BUCKET_NAME;
  const client = r2Client();
  if (!bucket || !client) {
    return NextResponse.json({ error: "R2 is not configured. Check the server-side R2 environment variables." }, { status: 503 });
  }
  const prefix = contentType.startsWith("audio/") ? "podcasts" : "videos";
  const key = `${prefix}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${EXTENSIONS[contentType]}`;
  try {
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
    return NextResponse.json({ uploadUrl, key, expiresIn: 300 }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("R2 upload URL creation failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not prepare the R2 upload. Check the bucket and R2 credentials." }, { status: 503 });
  }
}
