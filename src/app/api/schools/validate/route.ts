import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body?.code ?? "").trim();
    if (!code || code.length > 80) return NextResponse.json({ valid: false, error: "Enter a school code." }, { status: 400 });

    const supabase = await createServerSupabase();
    const hash = createHash("sha256").update(code).digest("hex");
    const { data, error } = await supabase.rpc("validate_school_code", { p_code_hash: hash });
    if (error) throw error;
    if (!data) return NextResponse.json({ valid: false, error: "That school code is not active. Check the code and try again." }, { status: 400 });

    return NextResponse.json({ valid: true, schoolCodeHash: hash });
  } catch {
    return NextResponse.json({ valid: false, error: "We could not verify that school code." }, { status: 500 });
  }
}
