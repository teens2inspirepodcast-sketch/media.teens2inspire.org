import { NextResponse } from "next/server";
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Billing notifications are temporarily unavailable." }, { status: 503 });
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/functions/v1/stripe-webhook`, { method: "POST", headers: { "Content-Type": "application/json", "Stripe-Signature": signature, apikey: key }, body: await request.text(), cache: "no-store" });
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { "Content-Type": response.headers.get("Content-Type") || "text/plain; charset=utf-8" } });
  } catch { return NextResponse.json({ error: "Billing notifications are temporarily unavailable." }, { status: 502 }); }
}
