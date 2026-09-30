const MEDIA_OBJECT_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._ -]{0,179}$/;
const PUBLIC_MEDIA_PREFIX = "/storage/v1/object/public/media/";

export function isSafeMediaObjectPath(path: string) {
  const segments = path.split("/");
  return path.length <= 900 && segments.length >= 2 && segments.every((segment) =>
    segment !== "." && segment !== ".." && MEDIA_OBJECT_SEGMENT.test(segment),
  );
}

function getSupabaseOrigin(supabaseUrl: string | undefined) {
  if (!supabaseUrl) return null;
  try {
    const parsed = new URL(supabaseUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

/** Convert only a legacy public URL from this app's media bucket. */
export function getLegacyMediaObjectPath(value: string | null, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  if (!value) return null;
  const expectedOrigin = getSupabaseOrigin(supabaseUrl);
  if (!expectedOrigin) return null;
  try {
    const parsed = new URL(value);
    if (parsed.origin !== expectedOrigin || parsed.search || parsed.hash || !parsed.pathname.startsWith(PUBLIC_MEDIA_PREFIX)) return null;
    const encodedPath = parsed.pathname.slice(PUBLIC_MEDIA_PREFIX.length);
    const segments = encodedPath.split("/").map((segment) => decodeURIComponent(segment));
    if (segments.some((segment) => segment.includes("/") || segment.includes("\\"))) return null;
    const objectPath = segments.join("/");
    if (!isSafeMediaObjectPath(objectPath)) return null;
    return objectPath;
  } catch {
    return null;
  }
}

export function getLegacyMediaApiPath(value: string | null, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const objectPath = getLegacyMediaObjectPath(value, supabaseUrl);
  if (!objectPath) return null;
  return `/api/media/storage/media/${objectPath.split("/").map(encodeURIComponent).join("/")}`;
}

/** Build the exact canonical source URL used to match the published DB row. */
export function getLegacyMediaSourceUrl(objectPath: string, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const origin = getSupabaseOrigin(supabaseUrl);
  if (!origin || !isSafeMediaObjectPath(objectPath)) return null;
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  return `${origin}${PUBLIC_MEDIA_PREFIX}${encodedPath}`;
}
