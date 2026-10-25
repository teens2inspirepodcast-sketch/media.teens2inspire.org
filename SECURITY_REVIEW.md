# Security and launch checks — Media App

- Admin routes and mutations must require the intended administrator role; test direct URL and server-action access.
- Confirm Supabase RLS prevents users from changing their role, membership, or school entitlement.
- Keep private media URLs out of database reads and rendered page HTML; only return provider-authorized short-lived playback URLs.
- Verify the playback API checks authentication, active paid membership or school access, content publication state, and provider response on every request.
- Cloudflare R2 signed PUT/GET routes are implemented; real bucket credentials, CORS, upload, and playback still require production smoke tests.
- Keep provider credentials and service-role keys server-only.
- Test favorites, family profile limits, school-code redemption, Stripe status sync, and admin workflows.
- Run `npm install`, `npm run build`, and end-to-end tests in the actual deployment environment.
- Verify PWA behavior on iOS Safari and Android Chrome. The service worker must not cache private pages, account data, API responses, or media.

## Repair pass — 2026-10-16

Completed in the current repair archive:
- Added the live-schema compatibility migration and security hardening migration.
- Applied compatibility/security migrations to the connected Supabase project; school-code sync, event/inquiry table operations, and relevant policies were smoke-tested.
- Restricted trigger-only SECURITY DEFINER functions from direct API execution and removed RPC access to obsolete/unused functions.
- Added administrator-only policies to legacy school membership-code and video asset tables.
- Updated the media app to accept either the Supabase anon key or publishable key in server, browser, and proxy clients.
- Hardened R2 upload authorization to return explicit JSON 401/403 responses, and made S3-compatible R2 addressing deterministic with path-style requests.
- Static TypeScript/TSX transpilation passed for all source files (syntax check only; not a full type-check or production build).

Still required before production launch:
- Enable leaked-password protection in Supabase Dashboard → Authentication → Settings / Password Security.
- Confirm `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME` are present as server-only variables on the media Vercel project.
- Apply the documented R2 bucket CORS rule and test a real admin upload followed by playback through the app.
- Run a full production build and browser end-to-end tests; package installation was unavailable in this environment.
- Test real Stripe checkout/webhook activation and confirm school, personal, and family access behavior in the deployed apps.
- Fixed two additional live-schema mismatches discovered during audit: family profiles now use the deployed `owner_id`/`first_name` columns, and section administration now uses `sections.name`, `is_active`, `display_order` plus `section_content.display_order`. A temporary section-and-mapping database smoke test passed and cleaned up its test records.
