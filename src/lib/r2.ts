import "server-only";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { isSafeR2Key } from "@/lib/r2-keys";
const configSchema = z.object({
  accountId: z.string().trim().min(1),
  accessKeyId: z.string().trim().min(1),
  secretAccessKey: z.string().trim().min(1),
  privateBucket: z.string().trim().min(1),
  publicBucket: z.string().trim().min(1),
  publicBaseUrl: z.string().url().optional(),
});

export function r2IsConfigured() {
  return Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_PRIVATE_BUCKET_NAME && process.env.R2_PUBLIC_BUCKET_NAME);
}

function config() {
  return configSchema.parse({
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    privateBucket: process.env.R2_PRIVATE_BUCKET_NAME,
    publicBucket: process.env.R2_PUBLIC_BUCKET_NAME,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL || undefined,
  });
}

let client: S3Client | undefined;
function getClient() {
  if (client) return client;
  const value = config();
  client = new S3Client({
    region: "auto",
    endpoint: `https://${value.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: value.accessKeyId, secretAccessKey: value.secretAccessKey },
  });
  return client;
}

export async function createR2UploadUrl(input: { key: string; contentType: string; contentLength: number; isPublic: boolean }) {
  if (!isSafeR2Key(input.key)) throw new Error("Invalid R2 object key.");
  const value = config();
  const command = new PutObjectCommand({
    Bucket: input.isPublic ? value.publicBucket : value.privateBucket,
    Key: input.key,
    ContentType: input.contentType,
    ContentLength: input.contentLength,
    CacheControl: input.isPublic ? "public, max-age=31536000, immutable" : "private, no-store",
  });
  return getSignedUrl(getClient(), command, { expiresIn: 300 });
}

export async function createR2ReadUrl(key: string) {
  if (!isSafeR2Key(key)) throw new Error("Invalid R2 object key.");
  const value = config();
  return getSignedUrl(getClient(), new GetObjectCommand({ Bucket: value.privateBucket, Key: key }), { expiresIn: 3600 });
}

export function publicR2AssetUrl(key: string) {
  if (!isSafeR2Key(key)) return null;
  const base = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (!base) return null;
  try {
    const url = new URL(base);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
    const basePath = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
    url.pathname = `${basePath}${key.split("/").map(encodeURIComponent).join("/")}`;
    return url.toString();
  } catch {
    return null;
  }
}
