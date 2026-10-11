# Teens2Inspire Media App — fresh source project

This repository is the member-facing app for `media.teens2inspire.org`. It is intentionally app-like (persistent navigation, responsive mobile menu, live content catalog) and separate from the public marketing site.

## Local development
- Node.js 22.12+.
- Copy `.env.example` to `.env.local` and fill in the Supabase public URL/key, server-only Supabase service-role key, and Cloudflare R2 server credentials.
- Run `npm install`, `npm run typecheck`, `npm run test:routes`, then `npm run build`.
- Vercel is configured to use `npm install` because this source bundle cannot contain a trustworthy generated lockfile without reaching the npm registry. Once running in a networked environment, generate and commit `package-lock.json`, then change the Vercel install command back to `npm ci`.

## Stripe / Supabase
Stripe is deliberately called from Supabase Edge Functions; no Stripe secret belongs in the Vercel environment or browser bundle.
1. Deploy `supabase/functions/create-checkout-session`, `supabase/functions/create-billing-portal`, and `supabase/functions/stripe-webhook`.
2. Configure Supabase Edge Function secrets using `supabase/.env.example` as a name/value checklist.
3. The public project includes a compatibility route at `https://teens2inspire.org/api/stripe/webhook` that forwards the raw signed event to the Supabase function. Keep the existing Stripe endpoint and use its current signing secret as `STRIPE_WEBHOOK_SECRET` in Supabase. Subscribe to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`. Alternatively, after testing, you may point Stripe directly at `https://mphswidvmesdkefkgwjz.supabase.co/functions/v1/stripe-webhook` and use the new endpoint signing secret.
4. Do not remove or change the existing endpoint until the forwarding route and Supabase function have passed a real Stripe test event.
5. Verify checkout and cancellation with Stripe test mode/test cards before changing to live mode.

## Cloudflare R2
- Private media bucket: `R2_PRIVATE_BUCKET_NAME`. Never enable public access for this bucket.
- Public artwork bucket: `R2_PUBLIC_BUCKET_NAME`, exposed only through `R2_PUBLIC_BASE_URL`.
- Uploads use short-lived presigned PUT URLs so large files do not pass through Vercel's request body limit.
- In the Cloudflare R2 bucket Settings → CORS Policy → JSON tab, paste the array in `R2-CORS-SETUP.json` (the dashboard expects an array of rule objects). It allows `PUT`, `GET`, and `HEAD` from `https://media.teens2inspire.org` and `http://localhost:3000`. Verify with a small test file before large uploads.

## Important launch checks
- Supabase Auth Site URL and redirect allowlist must include `https://media.teens2inspire.org/auth/callback`.
- Enable leaked-password protection in Supabase Auth.
- Apply `supabase/migrations/20261011_school_code_redemption.sql` before relying on the school-code flow. Apply `supabase/migrations/20261011_signup_privacy.sql` so new accounts enter the mailing list only when they explicitly opt in.
- Test account creation and confirmation, login, password recovery, Personal/Family checkout, webhook subscription synchronization, school-code redemption, private playback denial for a non-member, playback for an entitled member, R2 upload, publish/unpublish, and admin denial for non-admin users.
- Do not call the project production-ready until these tests pass against the real account and services.


Build configuration note: Supabase Edge Functions under `supabase/functions/**` run in the Deno Edge Runtime and use Deno URL/Jsr imports. They are intentionally excluded from the Next.js TypeScript build; deploy and type-check them with the Supabase CLI/Edge Runtime, not `next build`.
