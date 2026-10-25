# Teens2Inspire Media — functional fixes and release status

## Changes in this package
- Member-only content pages now show a membership gate instead of rendering the article body, printable/resource download URL, or media player to accounts without an active membership.
- Invalid expiry dates in the promo-code admin form are rejected safely rather than causing a server exception.
- Includes the redesigned admin studio and Supabase migration `008_media_studio_customization.sql` from the previous package.

## Required before deployment
1. Apply `supabase/migrations/008_media_studio_customization.sql` to the correct Supabase project after migrations 001–007.
2. Ensure the Vercel project has the environment variables listed in `.env.example`. R2 playback/upload requires `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_PRIVATE_BUCKET_NAME` (or the supported bucket fallback).
3. Confirm the R2 bucket CORS allows browser `PUT` requests from `https://media.teens2inspire.org` and the relevant Vercel preview origin during testing.
4. Verify Stripe checkout and webhook configuration in Supabase Edge Function secrets, as described in `.env.example`; the media app requires a server-only `STRIPE_SECRET_KEY` in Vercel for its cancellation API, while checkout/webhook secrets must also be set in Supabase Edge Function secrets.
5. Deploy to a Vercel preview first and test login, content create/edit, upload/playback, membership gating, and mobile layout before promoting to production.

## Known incomplete functionality
- Promo/gift codes are currently an admin registry only. They do not redeem, create Stripe coupons, apply discounts, or grant free membership time.
- Family profile management is not a full in-app profile-switcher.
- PDFs/printables use HTTPS links; there is no PDF upload flow to private R2 yet.
- Admin cannot view user passwords (correctly); password recovery should use Supabase Auth.

## Verification status
- ZIP archive integrity is checked after packaging.
- A local production build and TypeScript check could not be completed in this environment because dependency installation timed out. Do not treat this package as production-build-verified until Vercel or a local environment completes a successful build.


## Promo-code integration update (2026-10-22)
- Supabase migration `promo_codes_stripe_integration` adds Stripe coupon/promotion-code identifiers and constrains repeating coupon duration to 1–12 months.
- Supabase migration `promo_code_redemption_tracking` adds a private redemption ledger and service-role-only atomic redemption RPC.
- Supabase Edge Function `stripe-checkout` v15 validates admin-created Supabase codes (active state, plan, expiry, and usage limit), creates a matching Stripe coupon/promotion code, and applies it at checkout. Gift cards use 100% off for the configured 1–12 month repeating duration.
- Supabase Edge Function `stripe-webhook` v10 records successful redemptions after `checkout.session.completed`, relying on Stripe webhook idempotency and a database uniqueness constraint.
- Live checkout has not been exercised end-to-end in this environment. Confirm Stripe secret mode matches the configured live price IDs, then test one discount code, one gift code, invalid/expired codes, plan mismatch, and redemption limits before announcing availability.
