# Teens2Inspire media app release audit

Audit date: 2026-10-22

Status: release candidate; not cleared for public paid launch until the deployment and live-flow checks below pass.

## Included
- Full Next.js media/member app source
- Explore, Search, Library/My List, Profile, content detail/player, login/signup, and protected admin pages
- Admin content, section/collection, event, school, inquiry, and member pages
- Actual `public/teens2inspire-logo.png` asset, icons, and PWA assets
- Supabase client/auth code, seven SQL migration files, and Cloudflare R2 upload/playback routes

## Checks completed in this environment
- ZIP archive opened and all source files extracted successfully.
- TypeScript/TSX syntax transpilation passed for 41 source files with zero syntax diagnostics.
- No `.env`, `.env.local`, or PEM credential files were included in the archive.
- The media domain root now redirects to `/app` instead of returning a root-page 404.
- R2 upload/playback now prefer `R2_PRIVATE_BUCKET_NAME` and retain `R2_BUCKET_NAME` as a backward-compatible fallback.
- Environment examples distinguish the media app’s server-only `STRIPE_SECRET_KEY` (used by its cancellation API) from the checkout/webhook secrets that must also be configured in Supabase Edge Functions.

## Added in this repair pass
- Added migrations `009_stripe_promo_code_integration.sql` and `010_promo_code_redemption_tracking.sql` so a fresh database can reproduce the Stripe promo-code schema and idempotent webhook redemption logic. They are written to tolerate the already-present columns/table on the connected project.
- Documented the required migration order and the requirement to deploy checkout and webhook functions together.

## Not yet verified
- `npm install` timed out in this environment, so a full dependency-aware typecheck and `next build` could not be completed.
- Real R2 uploads, CORS, signed playback, membership entitlements, school access, and admin workflows still require deployment-level tests.
- PWA install behavior and cross-domain authentication need browser tests on deployed domains.

This archive is a release candidate, not a claim of fully verified production readiness.


## Repair pass 2026-10-22
- Deployed `stripe-webhook` version 12 after checking the live database RPC signature; it uses the actual live parameter names for promo redemption.
- Added an index on `promo_code_redemptions.user_id` to address the current foreign-key index advisor finding.
- Updated local migrations 009/010 to match the live redemption table and RPC parameter names. These local files still need to be committed to GitHub and build-verified before a future clean install can be considered reproducible.
- Production checkout, promo redemption, R2 upload/playback, and full app build remain unverified end to end.


## Production prep pass 2026-10-25
- Added GitHub Actions validation workflow for install, TypeScript check, and Next.js build.
- Added exact Node/npm runtime metadata and pinned the direct dependency versions from the supplied manifest.
- Corrected the Apple Podcasts URL to the project's current listing and added a data-correction migration.
- Corrected newly generated school access code display prefix to use the full Teens2Inspire brand name.
- The complete production build remains unverified because registry DNS is unavailable in this environment; no lockfile was fabricated.
