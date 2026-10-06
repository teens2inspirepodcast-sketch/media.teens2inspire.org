import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { publicEnvironment, secretEnvironment } from "@/lib/env";

export function createServiceSupabase() {
  const { url } = publicEnvironment();
  const { supabaseSecret } = secretEnvironment();
  if (!supabaseSecret) throw new Error("Supabase server secret is not configured.");
  return createClient<Database>(url, supabaseSecret, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
