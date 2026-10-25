import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.0";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGINS = new Set(["https://teens2inspire.org", "https://www.teens2inspire.org", "https://media.teens2inspire.org", "http://localhost:3000"]);
function cors(origin: string | null) { return { "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://teens2inspire.org", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" }; }
function json(body: Record<string, unknown>, status = 200, origin: string | null = null) { return new Response(JSON.stringify(body), { status, headers: { ...cors(origin), "Content-Type": "application/json", "Cache-Control": "no-store", "Pragma": "no-cache" } }); }
async function sha256Hex(value: string) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join(""); }
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed." }, 403, origin);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "School-code validation is not configured." }, 503, origin);
  let payload: { code?: unknown };
  try { payload = await req.json(); } catch { return json({ error: "Enter a valid school access code." }, 400, origin); }
  const code = typeof payload.code === "string" ? payload.code.trim().toUpperCase().replace(/\s+/g, "") : "";
  if (!/^[A-Z0-9-]{6,48}$/.test(code)) return json({ error: "That school code is invalid or expired. Ask your school for the correct code." }, 400, origin);
  const sourceIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = await sha256Hex(`${sourceIp}|${SERVICE_ROLE_KEY}`);
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: allowed, error: limitError } = await admin.rpc("consume_school_code_validation_attempt", { p_ip_hash: ipHash });
  if (limitError) { console.error("School-code validation limiter failed", limitError.code); return json({ error: "School-code validation is temporarily unavailable. Please try again later." }, 503, origin); }
  if (allowed !== true) return json({ error: "Too many school-code attempts. Wait 10 minutes before trying again." }, 429, origin);
  const hash = await sha256Hex(code);
  const { data: valid, error } = await admin.rpc("validate_school_code", { p_code_hash: hash });
  if (error) { console.error("School-code validation query failed", error.code); return json({ error: "School-code validation is temporarily unavailable. Please try again later." }, 503, origin); }
  if (valid !== true) return json({ error: "That school code is invalid, expired, or has reached its use limit. Ask your school for the correct code." }, 400, origin);
  return json({ valid: true }, 200, origin);
});
