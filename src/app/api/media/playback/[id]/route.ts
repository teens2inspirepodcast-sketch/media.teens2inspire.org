import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 5 * 60;

function createR2Client() {
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

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to play this content." }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("membership_status").eq("id", user.id).maybeSingle();
  if (profileError) {
    console.error("Playback entitlement lookup failed", profileError.message);
    return NextResponse.json({ error: "We couldn't verify your membership. Please try again." }, { status: 503 });
  }

  const { data: content, error } = await supabase
    .from("content").select("id,member_only,status,r2_media_key,type").eq("id", id).eq("status", "published").maybeSingle();
  if (error || !content) return NextResponse.json({ error: "Content is unavailable." }, { status: 404 });
  if (content.member_only && profile?.membership_status !== "active") {
    return NextResponse.json({ error: "An active membership or participating-school access is required." }, { status: 403 });
  }

  const bucket = process.env.R2_PRIVATE_BUCKET_NAME || process.env.R2_BUCKET_NAME;
  const r2 = createR2Client();
  const key = content.r2_media_key;
  if (!bucket || !r2 || !key || key.length > 1024 || /[\u0000-\u001f\u007f]/.test(key)) {
    return NextResponse.json({ error: "Secure media playback is not configured for this item yet." }, { status: 503 });
  }

  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(r2, command, { expiresIn: SIGNED_URL_TTL_SECONDS });
    return NextResponse.json({ url, expiresIn: SIGNED_URL_TTL_SECONDS, type: content.type }, {
      headers: { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache" },
    });
  } catch (playbackError) {
    console.error("R2 signed playback URL failed", playbackError instanceof Error ? playbackError.message : "Unknown error");
    return NextResponse.json({ error: "We couldn't start playback. Please try again shortly." }, { status: 503 });
  }
}
