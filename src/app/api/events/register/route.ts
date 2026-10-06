import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const eventSchema = z.object({ eventId: z.string().uuid() });

async function register(request: Request, remove: boolean) {
  const parsed = eventSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid event." }, { status: 400 });
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to register." }, { status: 401 });
  if (remove) {
    const { error } = await supabase.from("event_registrations").delete().eq("user_id", user.id).eq("content_id", parsed.data.eventId);
    if (error) return NextResponse.json({ error: "We could not update your registration." }, { status: 500 });
    return NextResponse.json({ registered: false });
  }
  const { data: outcome, error } = await supabase.rpc("register_for_event", { p_event_id: parsed.data.eventId });
  if (error) return NextResponse.json({ error: "Event registration is temporarily unavailable." }, { status: 503 });
  if (outcome === "unauthenticated") return NextResponse.json({ error: "Sign in to register." }, { status: 401 });
  if (outcome === "not_found") return NextResponse.json({ error: "This event is not available." }, { status: 404 });
  if (outcome === "closed") return NextResponse.json({ error: "Registration for this event has closed." }, { status: 409 });
  if (outcome === "membership_required") return NextResponse.json({ error: "An active membership is needed for this event." }, { status: 403 });
  if (outcome === "full") return NextResponse.json({ error: "This event is full. Please contact the Teens2Inspire team about a waitlist." }, { status: 409 });
  return NextResponse.json({ registered: true, alreadyRegistered: outcome === "already_registered" });
}

export function POST(request: Request) { return register(request, false); }
export function DELETE(request: Request) { return register(request, true); }
