import { createBrowserClient } from "@supabase/ssr";
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  const host = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const trustedDomain = host === "teens2inspire.org" || host.endsWith(".teens2inspire.org");
  const cookieOptions = trustedDomain
    ? { domain: ".teens2inspire.org", sameSite: "lax" as const, secure: true }
    : { sameSite: "lax" as const, secure: typeof window !== "undefined" && window.location.protocol === "https:" };
  return createBrowserClient(url, key, { cookieOptions });
}
