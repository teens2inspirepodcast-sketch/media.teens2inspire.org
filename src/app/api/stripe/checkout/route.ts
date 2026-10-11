import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before starting membership." }, { status: 401 });
  if (!user.email_confirmed_at) return NextResponse.json({ error: "Confirm your email before starting membership." }, { status: 403 });
  let body: { plan?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Choose a valid membership plan." }, { status: 400 }); }
  if (body.plan !== undefined && body.plan !== "personal" && body.plan !== "family") return NextResponse.json({ error: "Choose a valid membership plan." }, { status: 400 });
  try {
    const { data, error } = await supabase.functions.invoke("create-checkout", { body: { plan: body.plan ?? "personal" } });
    if (error || typeof data?.url !== "string") return NextResponse.json({ error: typeof data?.error === "string" ? data.error : "Membership checkout could not be started. Please try again." }, { status: 502 });
    return NextResponse.json({ url: data.url });
  } catch { return NextResponse.json({ error: "Membership checkout could not be started. Please try again." }, { status: 502 }); }
}
