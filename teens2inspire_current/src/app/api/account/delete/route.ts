import { NextResponse } from "next/server";
import { getContext } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST() {
  const { user, supabase } = await getContext();
  if (!user) return NextResponse.json({ error: "Sign in to delete your account." }, { status: 401 });
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    console.error("Account deletion RPC failed", error.message);
    return NextResponse.json({ error: "Account deletion is not configured yet. Please contact support; your account has not been deleted." }, { status: 503 });
  }
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
