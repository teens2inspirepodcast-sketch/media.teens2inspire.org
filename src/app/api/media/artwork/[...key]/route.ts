import { NextResponse } from "next/server";
import { getContext } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await params;
  const key = `artwork/${(parts || []).join("/")}`;
  if (!/^artwork\/[A-Za-z0-9._/-]+$/.test(key) || key.includes("..")) return new NextResponse("Invalid artwork path.", { status: 400 });
  const { user, supabase } = await getContext();
  if (!user) return new NextResponse("Sign in to view this cover image.", { status: 401 });
  const { data: { session } } = await supabase.auth.getSession();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!session?.access_token || !url || !anonKey) return new NextResponse("Your session is unavailable.", { status: 401 });
  try {
    const response = await fetch(`${url}/functions/v1/r2-media`, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, apikey: anonKey, "Content-Type": "application/json" }, body: JSON.stringify({ action: "artwork-url", key }), cache: "no-store" });
    const result = await response.json();
    if (!response.ok || typeof result.url !== "string") return new NextResponse("Could not load cover artwork.", { status: response.status || 502 });
    return NextResponse.redirect(result.url, { status: 302, headers: { "Cache-Control": "private, max-age=300" } });
  } catch { return new NextResponse("Could not load cover artwork.", { status: 503 }); }
}
