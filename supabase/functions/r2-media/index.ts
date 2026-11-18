import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.0";
import { S3Client, PutObjectCommand, GetObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from "npm:@aws-sdk/client-s3@3.883.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.883.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID") ?? "";
const ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID") ?? "";
const SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") ?? "";
const PRIVATE_BUCKET = Deno.env.get("R2_PRIVATE_BUCKET_NAME") ?? "teens2inspire-media";
const MAX_MEDIA_BYTES = 2_000_000_000; // 2,000 decimal MB
const MAX_ARTWORK_BYTES = 20 * 1024 * 1024;
const PART_SIZE = 20 * 1024 * 1024;
const ADMIN_ID = "8e8ba797-0f01-4956-b747-8122b28a777a";
const ALLOWED_ORIGINS = new Set(["https://media.teens2inspire.org", "https://teens2inspire.org", "https://www.teens2inspire.org", "http://localhost:3000"]);
const ALLOWED_TYPES = new Set([
  "video/mp4", "video/webm", "video/quicktime", "video/x-matroska",
  "audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav", "audio/aac", "audio/ogg", "audio/webm", "audio/flac",
  "application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/heic", "image/heif",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain", "text/csv",
]);
function cors(origin: string | null) {
  return { "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://media.teens2inspire.org", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
}
function respond(body: Record<string, unknown>, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(origin), "Content-Type": "application/json", "Cache-Control": "private, no-store, max-age=0", "Pragma": "no-cache" } });
}
function getR2() {
  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !PRIVATE_BUCKET) throw new Error("R2_NOT_CONFIGURED");
  return new S3Client({ region: "auto", endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`, forcePathStyle: true, credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY } });
}
function safeFilename(value: string) { return value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 100) || "media-file"; }
function validExpiry(value: string | null | undefined) { return !value || new Date(value).getTime() > Date.now(); }
function hasActiveEntitlement(profile: Record<string, unknown> | null) {
  if (!profile || String(profile.membership_status ?? "").toLowerCase() !== "active") return false;
  if (!validExpiry(profile.membership_period_end as string | null) || !validExpiry(profile.membership_expires_at as string | null)) return false;
  const tier = String(profile.membership_tier ?? "").toLowerCase();
  if (tier === "school") return typeof profile.school_id === "string" && profile.school_id.length > 0;
  if (tier === "personal" || tier === "family") return typeof profile.stripe_subscription_id === "string" && profile.stripe_subscription_id.length > 0;
  return false;
}
function validContentKey(key: unknown): key is string { return typeof key === "string" && /^(podcasts|videos|downloads|artwork)\/[A-Za-z0-9._/-]+$/.test(key) && !/(^|\/)\.\.?($|\/)/.test(key); }

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return respond({ error: "Method not allowed." }, 405, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return respond({ error: "Origin not allowed." }, 403, origin);
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) return respond({ error: "Supabase server configuration is incomplete." }, 503, origin);
  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !PRIVATE_BUCKET) return respond({ error: "R2 server secrets are missing or incomplete." }, 503, origin);
  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return respond({ error: "Sign in is required." }, 401, origin);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return respond({ error: "Your session is invalid or expired. Please sign in again." }, 401, origin);
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profile, error: profileError } = await admin.from("profiles")
    .select("id,role,membership_status,membership_type,membership_tier,school_id,membership_period_end,membership_expires_at,stripe_subscription_id")
    .eq("id", authData.user.id).maybeSingle();
  if (profileError) return respond({ error: "Unable to verify your account access." }, 500, origin);
  const isAdmin = authData.user.id === ADMIN_ID && String(profile?.role ?? "").toLowerCase() === "administrator";
  let body: { action?: string; contentId?: string; filename?: string; contentType?: string; size?: number; artwork?: boolean; key?: string; uploadId?: string; partNumber?: number; parts?: Array<{partNumber: number; etag: string}> };
  try { body = await req.json(); } catch { return respond({ error: "Invalid JSON request." }, 400, origin); }
  let r2: S3Client;
  try { r2 = getR2(); } catch { return respond({ error: "R2 server secrets are missing or incomplete." }, 503, origin); }

  if (body.action === "upload-url") {
    if (!isAdmin) return respond({ error: "Administrator access required to upload media." }, 403, origin);
    const contentType = typeof body.contentType === "string" ? body.contentType.toLowerCase().split(";")[0].trim() : "";
    if (!ALLOWED_TYPES.has(contentType)) return respond({ error: "Unsupported file type. Allowed: common audio/video formats, PDF, images, Office documents, plain text, and CSV." }, 400, origin);
    const size = Number(body.size);
    if (!Number.isSafeInteger(size) || size < 1 || size > (body.artwork === true ? MAX_ARTWORK_BYTES : MAX_MEDIA_BYTES)) return respond({ error: "Media files must be 2,000 MB or smaller (artwork: 20 MB)." }, 400, origin);
    const filename = typeof body.filename === "string" ? body.filename : "media-file";
    const extension = safeFilename(filename.split(".").pop() || "media-file").slice(0, 12).toLowerCase();
    const isArtwork = body.artwork === true;
    if (isArtwork && !contentType.startsWith("image/")) return respond({ error: "Cover artwork must be an image." }, 400, origin);
    const prefix = isArtwork ? "artwork" : contentType.startsWith("video/") ? "videos" : contentType.startsWith("audio/") ? "podcasts" : "downloads";
    const key = `${prefix}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
    try {
      const uploadUrl = await getSignedUrl(r2, new PutObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key, ContentType: contentType }), { expiresIn: 300 });
      return respond({ uploadUrl, key, expiresIn: 300, requiredHeaders: { "Content-Type": contentType } }, 200, origin);
    } catch (error) {
      console.error("R2 upload URL signing failed", error instanceof Error ? error.name : "unknown");
      return respond({ error: "R2 could not prepare the upload. Check the private bucket and access-key permissions." }, 502, origin);
    }
  }


  // Multipart operations are admin-only; the upload ID and key are validated on every call.
  if (["multipart-init", "multipart-part", "multipart-complete", "multipart-abort"].includes(body.action || "")) {
    if (!isAdmin) return respond({ error: "Administrator access required." }, 403, origin);
    if (body.action === "multipart-init") {
      const contentType = typeof body.contentType === "string" ? body.contentType.toLowerCase().split(";")[0].trim() : "";
      const size = Number(body.size);
      if (!ALLOWED_TYPES.has(contentType) || !Number.isSafeInteger(size) || size < 1 || size > MAX_MEDIA_BYTES)
        return respond({ error: "Choose a supported media file up to 2,000 MB." }, 400, origin);
      if (body.artwork === true) return respond({ error: "Artwork uses the standard image uploader." }, 400, origin);
      const filename = typeof body.filename === "string" ? body.filename : "media-file";
      const extension = safeFilename(filename.split(".").pop() || "bin").slice(0, 12).toLowerCase();
      const prefix = contentType.startsWith("video/") ? "videos" : contentType.startsWith("audio/") ? "podcasts" : "downloads";
      const key = `${prefix}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
      try {
        const created = await r2.send(new CreateMultipartUploadCommand({ Bucket: PRIVATE_BUCKET, Key: key, ContentType: contentType }));
        if (!created.UploadId) throw new Error("Missing R2 upload ID");
        return respond({ key, uploadId: created.UploadId, partSize: PART_SIZE }, 200, origin);
      } catch (error) {
        console.error("R2 multipart initialization failed", error instanceof Error ? error.name : "unknown");
        return respond({ error: "Could not initialize the R2 multipart upload." }, 502, origin);
      }
    }
    if (!validContentKey(body.key) || body.key.startsWith("artwork/") || typeof body.uploadId !== "string" || !/^[A-Za-z0-9._~+\/=-]{1,512}$/.test(body.uploadId))
      return respond({ error: "Invalid multipart upload session." }, 400, origin);
    const key = body.key;
    const uploadId = body.uploadId;
    try {
      if (body.action === "multipart-part") {
        const number = Number(body.partNumber);
        if (!Number.isInteger(number) || number < 1 || number > Math.ceil(MAX_MEDIA_BYTES / PART_SIZE))
          return respond({ error: "Invalid part number." }, 400, origin);
        const uploadUrl = await getSignedUrl(r2, new UploadPartCommand({ Bucket: PRIVATE_BUCKET, Key: key, UploadId: uploadId, PartNumber: number }), { expiresIn: 900 });
        return respond({ uploadUrl }, 200, origin);
      }
      if (body.action === "multipart-complete") {
        const parts = body.parts;
        if (!Array.isArray(parts) || !parts.length || parts.length > Math.ceil(MAX_MEDIA_BYTES / PART_SIZE) ||
          parts.some((part, i) => part.partNumber !== i + 1 || typeof part.etag !== "string" || !/^\"?[a-fA-F0-9]{32}(?:-[0-9]+)?\"?$/.test(part.etag)))
          return respond({ error: "Invalid multipart parts list." }, 400, origin);
        await r2.send(new CompleteMultipartUploadCommand({ Bucket: PRIVATE_BUCKET, Key: key, UploadId: uploadId,
          MultipartUpload: { Parts: parts.map(part => ({ PartNumber: part.partNumber, ETag: part.etag })) } }));
        return respond({ key, complete: true }, 200, origin);
      }
      if (body.action === "multipart-abort") {
        await r2.send(new AbortMultipartUploadCommand({ Bucket: PRIVATE_BUCKET, Key: key, UploadId: uploadId }));
        return respond({ aborted: true }, 200, origin);
      }
    } catch (error) {
      console.error("R2 multipart action failed", body.action, error instanceof Error ? error.name : "unknown");
      return respond({ error: `R2 could not ${body.action === "multipart-complete" ? "finish" : "prepare"} the multipart upload.` }, 502, origin);
    }
  }

  if (body.action === "artwork-url") {
    if (typeof body.key !== "string" || !/^artwork\/[A-Za-z0-9._/-]+$/.test(body.key) || /(^|\/)\.\.?($|\/)/.test(body.key)) return respond({ error: "Invalid artwork key." }, 400, origin);
    try {
      const url = await getSignedUrl(r2, new GetObjectCommand({ Bucket: PRIVATE_BUCKET, Key: body.key }), { expiresIn: 3600 });
      return respond({ url, expiresIn: 3600 }, 200, origin);
    } catch (error) {
      console.error("R2 artwork URL signing failed", error instanceof Error ? error.name : "unknown");
      return respond({ error: "Could not prepare the cover image." }, 502, origin);
    }
  }

  if (body.action === "playback-url") {
    if (!isAdmin && !hasActiveEntitlement(profile as Record<string, unknown> | null)) return respond({ error: "An active Personal, Family, or verified School membership is required to access content." }, 403, origin);
    if (typeof body.contentId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.contentId)) return respond({ error: "A valid contentId is required." }, 400, origin);
    const { data: item, error } = await admin.from("content").select("id,status,r2_media_key,release_at,type").eq("id", body.contentId).maybeSingle();
    if (error || !item || String(item.status).toLowerCase() !== "published") return respond({ error: "Published content not found." }, 404, origin);
    if (item.release_at && new Date(item.release_at).getTime() > Date.now()) return respond({ error: "This content is not available yet." }, 403, origin);
    if (!validContentKey(item.r2_media_key)) return respond({ error: "No valid private R2 file is attached to this content." }, 404, origin);
    const shouldInline = item.type === "video" || item.type === "podcast";
    try {
      const url = await getSignedUrl(r2, new GetObjectCommand({ Bucket: PRIVATE_BUCKET, Key: item.r2_media_key, ...(shouldInline ? {} : { ResponseContentDisposition: "attachment" }) }), { expiresIn: 300 });
      return respond({ url, expiresIn: 300 }, 200, origin);
    } catch (error) {
      console.error("R2 playback URL signing failed", error instanceof Error ? error.name : "unknown");
      return respond({ error: "R2 could not prepare secure playback. Please contact support if this continues." }, 502, origin);
    }
  }
  return respond({ error: "Unknown action. Use upload-url, artwork-url, or playback-url." }, 400, origin);
});
