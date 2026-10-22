import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Content is unavailable." }, { status: 404 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to play this content." }, { status: 401 });
  const { data: { session } } = await supabase.auth.getSession();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!session?.access_token || !url || !anonKey) return NextResponse.json({ error: "Your session or Supabase configuration is unavailable. Please sign in again." }, { status: 401 });
  try {
    const response = await fetch(`${url}/functions/v1/r2-media`, { method: "POST", headers: { "Authorization": `Bearer ${session.access_token}`, "apikey": anonKey, "Content-Type": "application/json" }, body: JSON.stringify({ action: "playback-url", contentId: id }), cache: "no-store" });
    const result = await response.json();
    if (!response.ok) return NextResponse.json({ error: result.error || "Playback is unavailable." }, { status: response.status, headers: { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache" } });
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache" } });
  } catch (error) {
    console.error("Supabase R2 playback authorization failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not contact the Supabase media service. Please try again shortly." }, { status: 503 });
  }
}
