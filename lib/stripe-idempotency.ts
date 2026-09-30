import { createHash } from "node:crypto";

export function membershipCheckoutIdempotencyKey(
  userId: string,
  tier: "personal" | "family",
  promoCode: string,
  timeBucket: number,
) {
  const promoFingerprint = createHash("sha256").update(promoCode).digest("hex").slice(0, 16);
  return `teens2inspire-checkout-${userId}-${tier}-${promoFingerprint}-${timeBucket}`;
}
