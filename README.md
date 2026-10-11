# Teens2Inspire Media

The separate media/PWA app for `media.teens2inspire.org`.

## Architecture
- Next.js 16 + TypeScript
- Supabase Auth/database
- Cloudflare R2 for media bytes
- Supabase `content` metadata
- Admin-only publishing studio for content, events, categories, home shelves, school codes, Stripe promotion codes, mailing list, and member profiles
- Same Supabase accounts as `teens2inspire.org`

## Vercel production variables

Set only the public values from `.env.example` in Vercel. `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` is the public custom domain for the artwork bucket. Stripe secrets, the Supabase service-role key, and R2 access keys must not be stored in Vercel; they belong in the Supabase Edge Function secrets for the shared Supabase project.

## Supabase
The media app uses the existing Teens2Inspire project and existing `profiles`, `family_profiles`, `content`, `favorites`, `subscriptions`, and membership logic.

Add this redirect URL to Supabase Auth if using any email-auth flow on the media app:
`https://media.teens2inspire.org/auth/callback`

The primary account creation and email verification flow remains on `https://teens2inspire.org`.

## R2
Use a private bucket for video/audio/documents and a public bucket for thumbnails/artwork. Configure `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` in Vercel to the actual custom domain attached to the public R2 bucket (for example, an assets subdomain). The signing credentials are stored only in Supabase Edge Function secrets.

## Deploy
Import this repository into a new Vercel project and assign the custom domain `media.teens2inspire.org`.

## Shared sign-in across both subdomains

Set `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.teens2inspire.org` in **both production Vercel projects** so the Supabase SSR session cookie can be shared between `teens2inspire.org` and `media.teens2inspire.org`. Leave it blank for localhost development. Add both production origins and their auth callback paths to the Supabase Auth URL allow list.

## Shared Edge Functions

Deploy the `create-checkout`, `create-billing-portal`, `manage-promotions`, `stripe-webhook`, and `r2-media` functions from the `supabase/functions` folder in the `teens2inspire.org` project package. Both sites call the same Supabase functions. Set private Stripe/R2 values as Supabase Edge Function secrets, not Vercel variables.

The admin studio relies on the `20261009000000_admin_studio_access.sql` migration for editorial shelf, mailing-list, and profile policies. Review and apply it only after checking the current Supabase schema.

For Cloudflare R2, allow `PUT` from `https://media.teens2inspire.org` with the `Content-Type` header in bucket CORS. During local development, also allow `http://localhost:3000`. Keep the private media bucket private; only thumbnails/artwork belong in the public bucket.

## Fixes in this candidate package

- Paid signup preserves the selected Personal or Family plan through email confirmation and resumes Stripe checkout after confirmation.
- The media app now has a protected `/saved` Library page and the mobile Library link points to it.
- Family profile create/remove controls use the existing owner-scoped RPC contract. The added migration creates the table and restricts the RPCs to an active Family entitlement; it allows the account owner plus up to two additional profiles.
- Playwright tests now target actual routes in this two-site architecture rather than removed `/membership`, `/discover`, and `/v2/*` pages.
- Media content shelves fall back gracefully when Supabase is temporarily unreachable.

## Build verification status

**Not fully tested.** Static TypeScript/TSX parsing and local-import checks passed. The environment could not resolve `registry.npmjs.org`, so `npm ci` did not complete. The subsequent `npm run build` failed with `next: not found`, and Playwright E2E could not run because the dependency installation was incomplete. Do not deploy this candidate until dependencies can be installed and `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e` pass in a network-enabled environment. Review and test the new family-profile migration against the existing Supabase schema before applying it.
