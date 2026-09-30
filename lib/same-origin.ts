import { getSiteOrigin } from "@/lib/site-url";

export function isSameOriginRequest(request: Request) {
  const expected = getSiteOrigin(request.url);
  if (!expected) return false;
  const origin = request.headers.get("origin");
  if (origin) return origin === expected;
  const referer = request.headers.get("referer");
  if (!referer) return false;
  try { return new URL(referer).origin === expected; } catch { return false; }
}
