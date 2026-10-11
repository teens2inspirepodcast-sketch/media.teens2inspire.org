import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
export async function POST() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage billing." }, { status: 401 });
  try {
    const { data, error } = await supabase.functions.invoke("create-billing-portal", { body: {} });
    if (error || typeof data?.url !== "string") return NextResponse.json({ error: typeof data?.error === "string" ? data.error : "Billing could not be opened. Please try again." }, { status: 502 });
    return NextResponse.json({ url: data.url });
  } catch { return NextResponse.json({ error: "Billing could not be opened. Please try again." }, { status: 502 }); }
}
