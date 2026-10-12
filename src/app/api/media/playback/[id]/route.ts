import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to play this content." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("membership_status").eq("id", user.id).maybeSingle();
  const { data: content, error } = await supabase.from("content").select("id,member_only,status,media_provider_id").eq("id", id).eq("status", "published").maybeSingle();
  if (error || !content) return NextResponse.json({ error: "Content is unavailable." }, { status: 404 });
  if (content.member_only && profile?.membership_status !== "active") return NextResponse.json({ error: "An active membership is required." }, { status: 403 });

  // The V2 product/API contract has not yet been confirmed. Do not expose permanent media URLs.
  // Replace this branch with the documented V2 server-side signed-playback adapter before launch.
  if (!process.env.V2_API_BASE_URL || !process.env.V2_API_KEY || !content.media_provider_id) {
    return NextResponse.json({ error: "Secure media playback is not configured yet." }, { status: 503 });
  }
  return NextResponse.json({ error: "The V2 playback adapter must be implemented against the provider's verified API contract." }, { status: 503 });
}
