import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.0";
const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;
const db = supabaseUrl && serviceRole ? createClient(supabaseUrl, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
const PERSONAL_PRICE = Deno.env.get("STRIPE_PRICE_ID_PERSONAL") ?? "price_1ULE0PIgMA67dR4JrQy2EINd";
const FAMILY_PRICE = Deno.env.get("STRIPE_PRICE_ID_FAMILY") ?? "price_1ULE7KIgMA67dR4JCMyFbFo4";
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (!stripe || !webhookSecret || !db) return json({ error: "Stripe webhook secrets are not configured." }, 503);
  const signature = req.headers.get("stripe-signature");
  if (!signature) return json({ error: "Missing Stripe signature." }, 400);
  const rawBody = await req.text(); let event: Stripe.Event;
  try { event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret, undefined, Stripe.createSubtleCryptoProvider()); }
  catch { return json({ error: "Invalid Stripe signature." }, 400); }
  const { data: existing, error: readError } = await db.from("stripe_webhook_events").select("event_id,status").eq("event_id", event.id).maybeSingle();
  if (readError) return json({ error: "Could not check webhook idempotency." }, 500);
  if (existing?.status === "processed") return json({ received: true, duplicate: true });
  if (!existing) {
    const { error: insertError } = await db.from("stripe_webhook_events").insert({ event_id: event.id, event_type: event.type, livemode: event.livemode, status: "processing", processing_started_at: new Date().toISOString(), received_at: new Date().toISOString() });
    if (insertError) { const { data: raced } = await db.from("stripe_webhook_events").select("status").eq("event_id", event.id).maybeSingle(); if (raced?.status === "processed") return json({ received: true, duplicate: true }); if (!raced) return json({ error: "Could not record webhook event." }, 500); }
  } else await db.from("stripe_webhook_events").update({ status: "processing", processing_started_at: new Date().toISOString(), last_error: null }).eq("event_id", event.id);
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id || session.client_reference_id;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (session.mode === "subscription" && userId && subscriptionId) {
        await syncSubscription(userId, await stripe.subscriptions.retrieve(subscriptionId));
        const promoCodeId = session.metadata?.promo_code_id;
        if (promoCodeId) { const { error } = await db.rpc("record_promo_code_redemption", { p_code_id: promoCodeId, p_user_id: userId, p_checkout_session_id: session.id, p_subscription_id: subscriptionId }); if (error) throw new Error("Could not record promo-code redemption: " + error.message); }
      }
    } else if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      const subscription = event.data.object as Stripe.Subscription; const userId = subscription.metadata?.supabase_user_id; if (userId) await syncSubscription(userId, subscription);
    } else if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | { id: string } | null; parent?: { subscription_details?: { subscription?: string | { id: string } | null } | null } | null };
      const raw = invoice.subscription ?? invoice.parent?.subscription_details?.subscription; const subId = typeof raw === "string" ? raw : raw?.id;
      if (subId) { const subscription = await stripe.subscriptions.retrieve(subId); const userId = subscription.metadata?.supabase_user_id; if (userId) await syncSubscription(userId, subscription); }
    }
    await db.from("stripe_webhook_events").update({ status: "processed", processed_at: new Date().toISOString(), last_error: null }).eq("event_id", event.id);
    return json({ received: true });
  } catch (error) {
    await db.from("stripe_webhook_events").update({ status: "failed", last_error: error instanceof Error ? error.message.slice(0, 900) : "Webhook processing failed." }).eq("event_id", event.id);
    console.error("Stripe webhook processing failed", JSON.stringify({ eventId: event.id, type: event.type, message: error instanceof Error ? error.message : "unknown error" }));
    return json({ error: "Webhook processing failed." }, 500);
  }
});
async function syncSubscription(userId: string, sub: Stripe.Subscription) {
  if (!db) throw new Error("Database is not configured.");
  const priceId = sub.items.data[0]?.price.id; const tier = priceId === FAMILY_PRICE ? "family" : priceId === PERSONAL_PRICE ? "personal" : null;
  if (!tier) throw new Error("Stripe subscription uses an unrecognized Teens2Inspire price.");
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
  const periodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null;
  const active = sub.status === "active" || sub.status === "trialing";
  const profileStatus = active ? "active" : sub.status === "past_due" || sub.status === "unpaid" ? "past_due" : sub.status === "canceled" ? "canceled" : "inactive";
  const membershipStatus = active ? "active" : sub.status === "canceled" ? "cancelled" : "inactive";
  const { error: se } = await db.from("subscriptions").upsert({ user_id: userId, stripe_customer_id: customerId, stripe_subscription_id: sub.id, stripe_price_id: priceId, status: sub.status, current_period_start: periodStart, current_period_end: periodEnd, cancel_at_period_end: sub.cancel_at_period_end, canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null, updated_at: new Date().toISOString() }, { onConflict: "stripe_subscription_id" });
  if (se) throw new Error("Could not save subscription: " + se.message);
  const { error: pe } = await db.from("profiles").update({ membership_tier: tier, membership_type: "standard", membership_status: profileStatus, membership_period_end: periodEnd, membership_expires_at: periodEnd, school_id: null, school_code: null, stripe_customer_id: customerId, stripe_subscription_id: sub.id, cancel_at_period_end: sub.cancel_at_period_end, updated_at: new Date().toISOString() }).eq("id", userId);
  if (pe) throw new Error("Could not update profile entitlement: " + pe.message);
  const { error: me } = await db.from("memberships").upsert({ user_id: userId, tier: active ? "member" : "free", status: membershipStatus, expires_at: periodEnd, plan: tier, profile_limit: tier === "family" ? 3 : 1, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (me) throw new Error("Could not update membership entitlement: " + me.message);
}
function json(body: Record<string, unknown>, status = 200) { return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }); }
