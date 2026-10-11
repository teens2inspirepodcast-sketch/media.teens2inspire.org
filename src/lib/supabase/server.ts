import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { publicEnvironment } from "@/lib/env";

export async function createServerSupabase() {
  const { url, publishableKey } = publicEnvironment();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          const sharedDomain = process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN === ".teens2inspire.org"
            ? { domain: ".teens2inspire.org" }
            : {};
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, { ...options, ...sharedDomain });
          }
        } catch {
          // Server Components cannot write cookies; route handlers and auth actions can.
        }
      },
    },
  });
}
