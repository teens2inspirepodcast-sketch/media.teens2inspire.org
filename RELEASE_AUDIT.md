# Teens2Inspire media app release audit

Audit date: 2026-10-21

## Included
- Full Next.js media/member app source
- Explore, Search, Library/My List, Profile, content detail/player, login/signup, and protected admin pages
- Admin content, section/collection, event, school, inquiry, and member pages
- Actual `public/teens2inspire-logo.png` asset, icons, and PWA assets
- Supabase client/auth code, seven SQL migration files, and Cloudflare R2 upload/playback routes

## Changes in the 2026-10-22 update
- Podcast media cards default to portrait cover art so uploaded episode artwork is more prominent in carousels.

## Checks completed in this environment
- ZIP archive opened and all source files extracted successfully.
- TypeScript transpilation/syntax diagnostics passed for all 41 media source files after these edits.
- Static navigation audit found no missing linked media routes; dynamic content detail paths are present.
- TypeScript/TSX syntax transpilation passed for 41 source files with zero syntax diagnostics.
- No `.env`, `.env.local`, or PEM credential files were included in the archive.
- The media domain root now redirects to `/app` instead of returning a root-page 404.
- R2 upload/playback now prefer `R2_PRIVATE_BUCKET_NAME` and retain `R2_BUCKET_NAME` as a backward-compatible fallback.
- Environment examples clarify that Stripe secrets and price IDs are consumed by Supabase Edge Functions, not the media app.

## Not yet verified
- Full dependency-aware typecheck/build could not be run: `npm install` timed out in this environment.
- `npm install` timed out in this environment, so a full dependency-aware typecheck and `next build` could not be completed.
- Real R2 uploads, CORS, signed playback, membership entitlements, school access, and admin workflows still require deployment-level tests.
- PWA install behavior and cross-domain authentication need browser tests on deployed domains.

This archive is a release candidate, not a claim of fully verified production readiness.


## Podcast hub update (2026-10-22)
- Added `/app/podcast` with episode-cover cards from published podcast content and the embedded full-show Spotify player.
- Added a podcast promotion shelf and Spotify player to the media-app home page.
- Confirm Spotify show ID and published episode cover art after deployment.


## Admin management additions (2026-10-22)
- Content Studio now supports editing content fields and deleting content records, in addition to status changes.
- Events admin supports editing/deleting events and attaching a flyer image URL. Flyer file uploads use the public R2 bucket and require `R2_PUBLIC_BASE_URL` (or `NEXT_PUBLIC_R2_PUBLIC_URL`) plus the existing server-side R2 credentials. The public bucket must allow the media app origin in CORS.
- School Access lists school-code records with active/revoked status, usage limits, usage counts, and expiry; admins can revoke/reactivate/delete codes and delete school records. Existing raw school codes cannot be recovered because only SHA-256 hashes are stored; the plaintext is displayed once when a code is first generated.
- These changes are source updates only; deploy and verify with an administrator account before production use.
