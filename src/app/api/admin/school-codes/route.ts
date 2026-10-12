import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  const { supabase } = await requireAdmin();
  let body: { schoolName?: unknown; maxUses?: unknown; expiresInDays?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const schoolName = typeof body.schoolName === "string" ? body.schoolName.trim().slice(0, 140) : "";
  const maxUses = Number(body.maxUses);
  const expiresInDays = Number(body.expiresInDays || 0);
  if (!schoolName || !Number.isInteger(maxUses) || maxUses < 1 || maxUses > 10000 || !Number.isInteger(expiresInDays) || expiresInDays < 0 || expiresInDays > 3650) {
    return NextResponse.json({ error: "Enter a school name, a use limit between 1 and 10,000, and a valid expiry." }, { status: 400 });
  }
  const { data: school, error: schoolError } = await supabase.from("schools").insert({ name: schoolName, is_active: true }).select("id,name").single();
  if (schoolError || !school) return NextResponse.json({ error: "Could not create the school record. Apply the latest database migration and try again." }, { status: 500 });
  const code = `TEENS-${randomBytes(3).toString("hex").toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const codeHash = createHash("sha256").update(code).digest("hex");
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000).toISOString() : null;
  const { error: codeError } = await supabase.from("school_codes").insert({ school_id: school.id, code_hash: codeHash, max_uses: maxUses, expires_at: expiresAt, is_active: true });
  if (codeError) {
    await supabase.from("schools").delete().eq("id", school.id);
    return NextResponse.json({ error: "Could not create the code. Apply the latest database migration and try again." }, { status: 500 });
  }
  // Return the raw code once only; the database stores its SHA-256 hash.
  return NextResponse.json({ code, schoolName: school.name, maxUses, expiresAt });
}
