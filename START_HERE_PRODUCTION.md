# Start here — production release (media app)

## What this repository contains

This is the Next.js media app project. Its `package.json` must remain at the repository root. Deploy this repository as a separate Vercel project; do not combine the website and media app into one Vercel project.

## Account onboarding

The media app sends new signups to `https://teens2inspire.org/signup` so age confirmation, Terms/Privacy acceptance, School-code validation, and Stripe checkout use one canonical flow. Existing members sign in at `https://media.teens2inspire.org/login`.

## 1. GitHub upload

1. Create/use the GitHub repository intended for this app.
2. Extract this ZIP and upload the **contents** of the folder, so `package.json`, `src/`, `public/`, and `.github/` are at repository root. Do not upload the ZIP itself as a nested file and expect Vercel to build it.
3. Check that no `.env`, `.env.local`, API secret, Stripe secret, Supabase service-role key, or R2 secret was uploaded. `.env.example` is a template and should remain secret-free.
4. Wait for the GitHub Actions `Validate application` workflow. It runs `npm install`, `npm run lint`, and `npm run build`. Do not proceed if the workflow fails; inspect its logs first.

## 2. Vercel project

1. Import this repository into a separate Vercel project.
2. Framework preset: **Next.js**. Root Directory: `./` (repository root). Build command: `npm run build`. Leave the standard Next.js output directory setting unchanged.
3. Add the following variables to **Production**, and add them to Preview if you want preview deployments to work. Redeploy after changing variables.

Required Vercel Production environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` — `https://mphswidvmesdkefkgwjz.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` **or** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — public client key only
- `NEXT_PUBLIC_MARKETING_URL` — `https://teens2inspire.org`
- `NEXT_PUBLIC_MEDIA_URL` — `https://media.teens2inspire.org`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_PRIVATE_BUCKET_NAME` — `teens2inspire-media` (confirmed in Cloudflare)
- `STRIPE_SECRET_KEY` — server-only Stripe secret used by the media app’s membership-cancellation route; use the same live-mode Stripe account as the subscriptions

**Never** put Stripe secret keys, Supabase service-role keys, Stripe webhook secrets, or R2 secret keys into `NEXT_PUBLIC_*` variables or commit them to GitHub. The media app’s `STRIPE_SECRET_KEY` belongs in Vercel as a server-only variable for cancellation, and must also be configured separately in Supabase Edge Function secrets for checkout/webhook processing.

## 3. Shared Supabase backend — separate from Vercel

Vercel does not deploy the Edge Functions under `supabase/functions/`. The two apps share one Supabase project. The source archives contain overlapping/condensed migration history and are **not** a complete fresh-database bootstrap. Do not blindly run every SQL file against production. The current production database already has its own migration history.

The `stripe-checkout` and `stripe-webhook` functions are intentionally kept in sync across both source archives. Deploy those functions together only after reviewing the GitHub source and confirming the existing live Stripe secret values. Configure these secrets in Supabase Edge Function secrets, not Vercel:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_PERSONAL` — active monthly $7.99 price ID
- `STRIPE_PRICE_ID_FAMILY` — active monthly $9.99 price ID

The `r2-media` Edge Function also requires its documented Cloudflare R2 and Supabase server-side secrets in Supabase. Do not share or paste secret values into chat.

## 4. Remaining manual launch gate

- In Supabase Dashboard, open **Authentication → Password Security** and enable leaked-password protection, then re-run the Security Advisor. This project connection does not expose the Auth configuration control, so this setting was not changed here.
- The Security Advisor reports callable `SECURITY DEFINER` RPCs. They include ownership/role checks and are used by the app; do not revoke execute permissions blindly. Verify normal use and cross-account denial before changing grants.
- Run real test flows: email confirmation, sign-in/sign-out, password reset, school-code expiry and use limits, Personal and Family checkout, subscription cancellation/payment failure, family profile cap, admin-only upload, private R2 signed playback, and rejection for signed-out/non-entitled users.
- Review the Terms/Privacy and age/guardian-consent workflow before public launch.

## Build-verification limitation

A full build could not be run in the preparation environment because DNS/network access to `registry.npmjs.org` failed (`EAI_AGAIN`). No fake lockfile has been created. The GitHub Actions workflow is included to run the dependency-aware typecheck and production build in GitHub's networked runner. Commit a generated `package-lock.json` after running `npm install` in a networked development environment for reproducible dependency resolution. Until the workflow passes, this project is **not build-verified**.
