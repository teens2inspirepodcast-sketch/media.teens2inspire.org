# Teens2Inspire production handoff

## Architecture
- `teens2inspire.org` owns signup, account creation, membership selection, and Stripe Checkout.
- `media.teens2inspire.org` is the authenticated content app and Admin Studio. Both use the same Supabase Auth project.
- Supabase stores users, profile/entitlement records, content metadata, shelves, events, and permissions. Cloudflare R2 stores media objects. Stripe is the payment processor.

## Required Vercel settings
Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` on each project. Set `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.teens2inspire.org` on both production projects so auth cookies are shared across the subdomains.

On the public website, set server-only `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PERSONAL`, `STRIPE_PRICE_ID_FAMILY`, and the Supabase Edge Function configuration. The price IDs are the Personal $7.99/month and Family $9.99/month prices previously configured.

On the media project, set the same Supabase public variables and shared cookie domain. Configure R2 variables in the Supabase Edge Function secrets: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PRIVATE_BUCKET_NAME`, `R2_PUBLIC_BUCKET_NAME`. Never expose these as `NEXT_PUBLIC_*`. `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` should point only to a public bucket/custom domain intended for artwork, not private media.

## Supabase setup
Review and apply the migrations in `supabase/migrations/` to the actual project, in order. Deploy the functions in `supabase/functions/` and set their secrets. Verify the `teens2inspire@gmail.com` profile has the administrator role through the secured admin setup process. Configure Supabase Auth Site URL and allowed redirect URLs for `https://teens2inspire.org/auth/callback` and `https://media.teens2inspire.org/auth/callback`.

## Stripe setup
Deploy `create-checkout`, `create-billing-portal`, and `stripe-webhook` functions. Set `STRIPE_SECRET_KEY`, both price IDs, `STRIPE_WEBHOOK_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` as Edge Function secrets. In Stripe, configure the webhook endpoint `https://teens2inspire.org/api/stripe/webhook` for `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`. The webhook signing secret must match the exact endpoint. Test using Stripe test mode before enabling live payments.

## R2 setup
Keep the media bucket private. Configure CORS to allow the production media origin for required upload methods and headers. Uploads should use short-lived signed URLs; private playback must be authorized by Supabase before a short-lived read URL is issued. Do not make the private bucket public.

## Launch checklist
- [ ] `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e` pass for each project in a network-enabled Node 22.12+ environment.
- [ ] Confirm signup/email confirmation, sign-in across both subdomains, password reset, and logout.
- [ ] Complete Personal and Family test-mode checkout; verify webhook idempotency, profile/subscription sync, cancellation, and failed payment behavior.
- [ ] Verify school code redemption and expiry.
- [ ] Verify non-admin users cannot access Admin Studio or upload endpoints.
- [ ] Verify R2 upload, artwork display, protected playback, expiry of signed URLs, and denied access for logged-out/non-member users.
- [ ] Check desktop, tablet, and mobile layouts on real browsers.

**Important:** A source ZIP cannot prove that external Supabase, Stripe, Vercel, and Cloudflare settings are correct. This package includes the source and setup requirements; run the checks above against the connected services before treating it as production-ready.
