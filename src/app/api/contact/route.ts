import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const parsed = contactSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Check the fields and try again." }, { status: 400 });
    if (parsed.data.website) return NextResponse.json({ received: true });
    const supabase = await createServerSupabase();
    const { error } = await supabase.from("messages").insert({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      subject: parsed.data.subject,
      message: parsed.data.message,
    });
    if (error) throw error;
    return NextResponse.json({ received: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We could not send that note." }, { status: 500 });
  }
}
