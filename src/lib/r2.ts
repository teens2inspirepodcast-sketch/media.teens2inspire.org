import "server-only";
import { isSafeR2Key } from "@/lib/r2-keys";

export function publicR2AssetUrl(key: string) {
  if (!isSafeR2Key(key)) return null;
  const base = (process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || process.env.R2_PUBLIC_BASE_URL || "").trim();
  if (!base) return null;
  try {
    const url = new URL(base);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
    const basePath = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
    url.pathname = `${basePath}${key.split("/").map(encodeURIComponent).join("/")}`;
    return url.toString();
  } catch { return null; }
}
