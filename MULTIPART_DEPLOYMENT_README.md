# Teens2Inspire R2 2,000 MB upload upgrade

## Required deployment order
1. Deploy `supabase/functions/r2-media/index.ts` as the `r2-media` Edge Function in the existing Supabase project. Keep its existing environment secrets and authentication settings. This must happen before deploying the website change.
2. Replace the media app files and commit/push to the `media.teens2inspire.org` GitHub repository. Vercel deploys the app from the repository.
3. In Cloudflare R2 CORS for `teens2inspire-media`, ensure PUT allowed and `ETag` is in ExposeHeaders (verified present on Nov 17).
4. Test an authenticated administrator upload using a small file and then a >80 MB test file.

The media limit is 2,000,000,000 bytes (2,000 decimal MB). Files above 80 MiB are split into 20 MiB R2 multipart chunks; each chunk retries up to twice and the final file is assembled server-side. This is in-session retry, not cross-browser/reload resume. Do not close the tab during uploads. Artwork and Supabase branding/captions have separate limits.

The patch does NOT modify Stripe, profiles, memberships, or other database records. The update is not live until both deployments succeed.
