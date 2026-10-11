import { z } from "zod";

const optionalSecret = z.string().trim().min(1).optional();
const publicSchema = z.object({
  url: z.string().url(),
  publishableKey: z.string().min(1),
});

export function publicEnvironment() {
  return publicSchema.parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelEnvironment = process.env.VERCEL_ENV;
  const isVercel = process.env.VERCEL === "1" || Boolean(vercelEnvironment);
  const isLocalOrigin = (value: string) => {
    const hostname = new URL(z.string().url().parse(value)).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  };

  if (vercelEnvironment === "production") {
    if (!configured || isLocalOrigin(configured) || new URL(configured).protocol !== "https:") {
      throw new Error("NEXT_PUBLIC_SITE_URL must be the public HTTPS origin in Vercel production.");
    }
    return new URL(configured).origin;
  }

  if (configured && !isLocalOrigin(configured)) return new URL(z.string().url().parse(configured)).origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (isVercel) throw new Error("A public deployment URL is required for this Vercel environment.");
  if (configured) return new URL(z.string().url().parse(configured)).origin;
  return "http://localhost:3000";
}

export function secretEnvironment() {
  const { url } = publicEnvironment();
  return {
    url,
    supabaseSecret: optionalSecret.parse(process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY),
    stripeSecret: optionalSecret.parse(process.env.STRIPE_SECRET_KEY),
    stripeWebhookSecret: optionalSecret.parse(process.env.STRIPE_WEBHOOK_SECRET),
    stripePriceIdPersonal: optionalSecret.parse(process.env.STRIPE_PRICE_ID_PERSONAL),
    stripePriceIdFamily: optionalSecret.parse(process.env.STRIPE_PRICE_ID_FAMILY),
  };
}

export function hasStripeCheckoutConfiguration() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_PERSONAL && process.env.STRIPE_PRICE_ID_FAMILY);
}
