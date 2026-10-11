import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.functions.invoke("r2-media", { body: { action: "read", contentId: id } });
  if (error || typeof data?.url !== "string") {
    const message = typeof data?.error === "string" ? data.error : "Media is temporarily unavailable.";
    const status = /sign in/i.test(message) ? 401 : /membership/i.test(message) ? 403 : /not found/i.test(message) ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
  return NextResponse.json({ url: data.url, expiresIn: 3600 }, { headers: { "Cache-Control": "private, no-store" } });
}
