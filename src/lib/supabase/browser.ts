"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createBrowserSupabase() {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Supabase public configuration is missing.");
    const cookieOptions = process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN === ".teens2inspire.org"
      ? { domain: ".teens2inspire.org" }
      : undefined;
    browserClient = createBrowserClient<Database>(url, key, cookieOptions ? { cookieOptions } : undefined);
  }
  return browserClient;
}
