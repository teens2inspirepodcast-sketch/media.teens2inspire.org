# Production handoff — Teens2Inspire

Audit updated: 2026-10-24

## Confirmed in this pass

- The supplied project ZIP was opened and source files were inspected.
- TypeScript/TSX syntax parsing passed, but this is not equivalent to a dependency-aware typecheck or a Next.js production build.
- The shared Supabase project is `mphswidvmesdkefkgwjz` and reports `ACTIVE_HEALTHY`.
- Live Supabase Edge Functions currently listed as active: `contact`, `stripe-webhook`, `stripe-checkout`, `r2-media`, and `school-code-validation`.
- The live database contains a migration history that is longer than the migration files included in these source archives. Treat the archive SQL as application/source migrations, not as a verified complete export of the production database history. Do not use these files alone to rebuild a fresh production database.
- A production SQL hardening migration, `20261025015040_harden_profile_settings_function_search_path.sql`, was applied to Supabase. It sets an empty `search_path` for `update_my_profile_settings` and explicitly qualifies database objects. The same migration is included in this source archive.

## Verified Cloudflare R2 update (2026-10-25)

- Confirmed buckets `teens2inspire-media` (private media) and `teens2inspire-public` (public assets) exist in the connected Cloudflare account.
- Updated and re-read the `teens2inspire-media` CORS policy to allow `PUT`, `GET`, and `HEAD` from `https://teens2inspire.org` and `https://media.teens2inspire.org`, with `Content-Type`, `Range`, and `x-amz-*` request headers and playback-related response headers exposed. This supports browser uploads and range-based media playback; signed URL playback still needs a live upload/playback test.

## Outstanding production gates

1. **Vercel:** project permissions, root directories, environment variables, domain mappings, deployment status, and build logs must be checked by the account owner in Vercel. Do not infer these from local source.
2. **Build:** npm dependency resolution failed in this environment with `EAI_AGAIN` for `registry.npmjs.org`. No dependency lockfile is included. Run `npm install` (or choose and commit a package manager plus its lockfile), `npm run lint`, and `npm run build` in an environment with registry access.
3. **Supabase Auth:** the live Security Advisor reports leaked-password protection disabled. Enable it in Supabase Authentication password-security settings, then re-check the advisor.
4. **SECURITY DEFINER functions:** the advisor reports six callable functions. Their current definitions were reviewed for ownership/authentication checks and schema qualification; the warnings remain because the linter flags all authenticated-callable SECURITY DEFINER functions. Do not revoke their execute grants blindly because the app uses these RPCs. Test intended calls and cross-user denial before changing grants.
5. **Stripe:** verify Personal ($7.99/month) and Family ($9.99/month) checkout in a safe test flow, email confirmation, webhook signatures/idempotency, cancellation, failed payment, and entitlement synchronization. Do not replace configured price IDs based solely on a copied ID in chat; confirm the active IDs in Stripe first.
6. **R2 and Stripe cancellation:** configure the exact private R2 bucket and server-only R2 credentials in Vercel; configure `STRIPE_SECRET_KEY` as a server-only Vercel variable for the media app cancellation route and separately in Supabase Edge Function secrets. Verify CORS, admin upload, signed playback, cancellation, and denied playback for signed-out/non-entitled users.
7. **End-to-end:** verify school-code expiry/use limits, school membership activation, family profile limit (up to three total), password reset, cross-domain auth, mobile/PWA behavior, and admin-only server actions.
8. **Legal/privacy:** review Terms, Privacy, age/guardian-consent, data retention, and deletion flows before public launch.

## Security notes

- The SQL hardening migration above is applied to the live database and included here for source tracking. Stripe checkout and webhook source in this archive now honor `STRIPE_PRICE_ID_PERSONAL` and `STRIPE_PRICE_ID_FAMILY` Edge Function secrets, with the previously configured active IDs retained as fallbacks. These source changes have not been deployed to the live Edge Functions; deploy checkout and webhook together only after confirming the configured secret values. It does not clear the other Supabase Security Advisor warnings.
- Do not put Stripe secrets, Supabase service-role keys, or R2 secret keys in `NEXT_PUBLIC_*` variables or commit them to source control.
- Never mark the project production-ready until the build and the critical payment, authorization, and media-access tests pass.


## GitHub build verification

- Added a GitHub Actions workflow at `.github/workflows/validate.yml` to install dependencies, run the TypeScript check, and run the Next.js production build on pushes and pull requests.
- Direct dependency ranges were pinned to the versions already declared in the supplied package manifest. The Node engine floor is documented.
- A lockfile could not be generated in this environment because DNS/network access to `registry.npmjs.org` failed. The workflow uses `npm install` and will expose build/type errors once pushed, but for reproducible builds generate and commit `package-lock.json` in an environment with npm registry access before final release.
