import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.0";
import { S3Client, PutObjectCommand, GetObjectCommand } from "npm:@aws-sdk/client-s3@3.883.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.883.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID") ?? "";
const ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID") ?? "";
const SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") ?? "";
const PRIVATE_BUCKET = Deno.env.get("R2_PRIVATE_BUCKET_NAME") ?? "teens2inspire-media";
const ALLOWED_ORIGINS = new Set(["https://media.teens2inspire.org", "https://teens2inspire.org", "https://www.teens2inspire.org", "http://localhost:3000"]);
const cors = (origin: string | null) => ({ "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://media.teens2inspire.org", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" });
function respond(body: Record<string, unknown>, status = 200, origin: string | null = null) { return new Response(JSON.stringify(body), { status, headers: { ...cors(origin), "Content-Type": "application/json", "Cache-Control": "no-store" } }); }
function getR2() { if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !PRIVATE_BUCKET) throw new Error("R2_NOT_CONFIGURED"); return new S3Client({ region: "auto", endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`, forcePathStyle: true, credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY } }); }
function safeFilename(value: string) { return value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 100) || "media-file"; }
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return respond({ error: "Method not allowed." }, 405, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return respond({ error: "Origin not allowed." }, 403, origin);
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) return respond({ error: "Supabase server configuration is incomplete." }, 503, origin);
  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !PRIVATE_BUCKET) return respond({ error: "R2 server secrets are missing or incomplete." }, 503, origin);
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return respond({ error: "Sign in required." }, 401, origin);
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return respond({ error: "Your session is invalid or expired. Please sign in again." }, 401, origin);
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profile, error: profileError } = await admin.from("profiles").select("role,membership_status,membership_type,membership_tier,school_id").eq("id", authData.user.id).maybeSingle();
  if (profileError) return respond({ error: "Unable to verify your profile." }, 500, origin);
  const isAdmin = ["admin", "administrator"].includes(String(profile?.role ?? "").toLowerCase());
  let body: { action?: string; contentId?: string; filename?: string; contentType?: string; size?: number };
  try { body = await req.json(); } catch { return respond({ error: "Invalid JSON request." }, 400, origin); }
  const r2 = getR2();
  if (body.action === "upload-url") {
    if (!isAdmin) return respond({ error: "Administrator access required to upload media." }, 403, origin);
    const contentType = typeof body.contentType === "string" ? body.contentType.toLowerCase() : "";
    if (!/^(video\/(mp4|webm|quicktime)|audio\/(mpeg|mp4|wav|x-wav|aac|ogg|webm))$/.test(contentType)) return respond({ error: "Unsupported media type." }, 400, origin);
    const size = Number(body.size);
    if (!Number.isSafeInteger(size) || size < 1 || size > 500 * 1024 * 1024) return respond({ error: "File must be smaller than 500 MB." }, 400, origin);
    const prefix = contentType.startsWith("video/") ? "videos" : "podcasts";
    const ext = safeFilename((body.filename ?? "media-file").split(".").pop() || "media-file").slice(0, 12);
    const key = `${prefix}/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${ext}`;
    const uploadUrl = await getSignedUrl(r2, new PutObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key, ContentType: contentType }), { expiresIn: 300 });
    return respond({ uploadUrl, key, expiresIn: 300, requiredHeaders: { "Content-Type": contentType } }, 200, origin);
  }
  if (body.action === "playback-url") {
    if (typeof body.contentId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.contentId)) return respond({ error: "A valid contentId is required." }, 400, origin);
    const { data: item, error } = await admin.from("content").select("id,status,member_only,r2_media_key,release_at").eq("id", body.contentId).maybeSingle();
    if (error || !item || String(item.status).toLowerCase() !== "published") return respond({ error: "Published content not found." }, 404, origin);
    if (item.release_at && new Date(item.release_at).getTime() > Date.now()) return respond({ error: "This content is not available yet." }, 403, origin);
    if (item.member_only) {
      const membershipStatus = String(profile?.membership_status ?? "").toLowerCase();
      const membershipType = String(profile?.membership_type ?? profile?.membership_tier ?? "").toLowerCase();
      const schoolAccess = Boolean(profile?.school_id) || membershipType === "school";
      const activeMembership = ["active", "trialing", "current"].includes(membershipStatus) && ["personal", "family", "monthly", "annual", "school", "paid"].includes(membershipType);
      if (!isAdmin && !schoolAccess && !activeMembership) return respond({ error: "An active membership is required to access this content." }, 403, origin);
    }
    if (!item.r2_media_key || !/^(podcasts|videos|downloads)\//.test(item.r2_media_key) || item.r2_media_key.includes("..")) return respond({ error: "No valid private R2 media file is attached to this content." }, 404, origin);
    const url = await getSignedUrl(r2, new GetObjectCommand({ Bucket: PRIVATE_BUCKET, Key: item.r2_media_key }), { expiresIn: 300 });
    return respond({ url, expiresIn: 300 }, 200, origin);
  }
  return respond({ error: "Unknown action. Use upload-url or playback-url." }, 400, origin);
});
