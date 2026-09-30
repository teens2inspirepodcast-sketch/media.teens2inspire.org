import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { isSameOriginRequest } from "@/lib/same-origin";
import type Stripe from "stripe";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Please reload the page and try again." }, { status: 403 });
  const supabase = await createClient(); const admin = createAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Secure account deletion is not configured. Please contact Teens2Inspire." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Sign in to delete your account." }, { status: 401 });
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return NextResponse.json({ error: "Confirm account deletion to continue." }, { status: 400 }); }
  if (body.confirm !== "DELETE") return NextResponse.json({ error: "Type DELETE to confirm account removal." }, { status: 400 });
  const { data: profile } = await supabase.from("profiles").select("role,stripe_customer_id,stripe_subscription_id,membership_tier,membership_status,membership_period_end,avatar_path").eq("id", user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Your profile could not be found." }, { status: 404 });
  const stripe = getStripe(); const scheduledSubscriptions: string[] = []; let cancellationEffectiveAt: string | null = null;
  const paidAccount = ["personal", "family"].includes(profile.membership_tier || "");
  const mayStillBeBillable = paidAccount && ["active", "trialing", "past_due", "pending_payment"].includes(profile.membership_status || "");
  if (mayStillBeBillable && !profile.stripe_customer_id && !profile.stripe_subscription_id) return NextResponse.json({ error: "The paid membership billing record is incomplete, so account removal is paused to prevent future charges. Contact Teens2Inspire." }, { status: 503 });
  if (profile.stripe_customer_id || profile.stripe_subscription_id) {
    if (!stripe) return NextResponse.json({ error: "Billing could not be safely canceled, so the account was not deleted. Contact Teens2Inspire for help." }, { status: 503 });
    try {
      const candidates = new Map<string, Stripe.Subscription>();
      if (profile.stripe_customer_id) {
        const [sessions, subscriptions] = await Promise.all([
          stripe.checkout.sessions.list({ customer: profile.stripe_customer_id, status: "open", limit: 100 }),
          stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: "all", limit: 100 }),
        ]);
        for (const session of sessions.data) if (session.metadata?.supabase_user_id === user.id) await stripe.checkout.sessions.expire(session.id);
        for (const subscription of subscriptions.data) candidates.set(subscription.id, subscription);
      }
      if (profile.stripe_subscription_id && !candidates.has(profile.stripe_subscription_id)) {
        const linked = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
        candidates.set(linked.id, linked);
      }
      for (const subscription of candidates.values()) {
        if (subscription.metadata.supabase_user_id !== user.id && subscription.id !== profile.stripe_subscription_id) continue;
        const subscriptionCustomer = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
        if (profile.stripe_customer_id && subscriptionCustomer !== profile.stripe_customer_id) return NextResponse.json({ error: "A linked billing record could not be verified. Your account was not deleted." }, { status: 409 });
        if (["active", "trialing", "past_due"].includes(subscription.status)) {
          const updated = subscription.cancel_at_period_end ? subscription : await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true });
          scheduledSubscriptions.push(updated.id);
          const periodEnd = Math.max(0, ...updated.items.data.map((item) => item.current_period_end));
          if (periodEnd) cancellationEffectiveAt = new Date(Math.max(cancellationEffectiveAt ? Date.parse(cancellationEffectiveAt) : 0, periodEnd * 1000)).toISOString();
        } else if (subscription.status === "incomplete") {
          await stripe.subscriptions.cancel(subscription.id);
        }
      }
    } catch {
      return NextResponse.json({ error: "Stripe could not safely stop future billing, so the account was not deleted. Try again or contact Teens2Inspire." }, { status: 503 });
    }
  }
  const { data: deletionRecord, error: recordError } = await admin.from("privacy_deletion_log").insert({ actor_id: user.id, stripe_customer_id: profile.stripe_customer_id, stripe_subscription_ids: scheduledSubscriptions, cancellation_effective_at: cancellationEffectiveAt, status: "pending", retained_for: "billing_reconciliation" }).select("id").single();
  if (recordError || !deletionRecord) return NextResponse.json({ error: "The billing cancellation was scheduled, but we could not finish the account removal record. Your account remains available; contact Teens2Inspire." }, { status: 503 });
  if (profile.avatar_path) {
    const { error: avatarError } = await admin.storage.from("profile-photos").remove([profile.avatar_path]);
    if (avatarError) {
      await admin.from("privacy_deletion_log").update({ status: "failed" }).eq("id", deletionRecord.id);
      return NextResponse.json({ error: "Billing cancellation was scheduled, but private profile-photo cleanup failed. Your account remains available; contact Teens2Inspire." }, { status: 503 });
    }
  }
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    await admin.from("privacy_deletion_log").update({ status: "failed" }).eq("id", deletionRecord.id);
    return NextResponse.json({ error: "Membership cancellation was scheduled, but account removal did not finish. Contact Teens2Inspire for help." }, { status: 503 });
  }
  await admin.from("privacy_deletion_log").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", deletionRecord.id);
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) if (/^sb-.+-auth-token(?:\.\d+)?$/.test(cookie.name)) cookieStore.delete(cookie.name);
  return NextResponse.json({ ok: true });
}
