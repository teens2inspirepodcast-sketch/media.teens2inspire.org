import { createHash } from "node:crypto";

export function membershipCheckoutIdempotencyKey(
  userId: string,
  tier: "personal" | "family",
  promoCode: string,
  timeBucket: number,
  previousSessionId?: string,
) {
  const promoFingerprint = createHash("sha256").update(promoCode).digest("hex").slice(0, 16);
  const previousSessionFingerprint = previousSessionId
    ? `-${createHash("sha256").update(previousSessionId).digest("hex").slice(0, 12)}`
    : "";
  return `teens2inspire-checkout-${userId}-${tier}-${promoFingerprint}-${timeBucket}${previousSessionFingerprint}`;
}

export function stripeIntegrationIdentifier(idempotencyKey: string) {
  const digest = createHash("sha256").update(`Teens2Inspire:${idempotencyKey}`).digest();
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const suffix = Array.from(digest.subarray(0, 8), (value) => alphabet[value % alphabet.length]).join("");
  return `teens2inspire_membership_${suffix}`;
}

export function isUsableCheckoutSession(
  session: { status: string | null; url: string | null; expires_at: number },
  now = Date.now(),
) {
  return session.status === "open" && Boolean(session.url) && session.expires_at * 1000 > now;
}

export function shouldSyncCheckoutMembership(eventType: string, paymentStatus: string | null) {
  if (eventType === "checkout.session.async_payment_failed") return false;
  return (eventType === "checkout.session.completed" || eventType === "checkout.session.async_payment_succeeded") && paymentStatus !== "unpaid";
}
