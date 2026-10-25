import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
export async function createClient() {
  const cookieStore = await cookies(); const headerStore = await headers();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  const host = (headerStore.get("host") || "").split(":")[0].toLowerCase();
  const trustedDomain = host === "teens2inspire.org" || host.endsWith(".teens2inspire.org");
  const secure = headerStore.get("x-forwarded-proto") === "https" || process.env.NODE_ENV === "production";
  const cookieOptions = trustedDomain
    ? { domain: ".teens2inspire.org", sameSite: "lax" as const, secure: true, maxAge: 60 * 60 * 24 * 365 }
    : { sameSite: "lax" as const, secure, maxAge: 60 * 60 * 24 * 365 };
  return createServerClient(url, key, {
    cookieOptions,
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(values) {
        try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* Server Components cannot always mutate cookies; proxy refresh handles writable contexts. */ }
      },
    },
  });
}
