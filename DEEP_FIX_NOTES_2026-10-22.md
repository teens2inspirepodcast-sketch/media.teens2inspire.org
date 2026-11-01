# Teens2Inspire Media — continued repair pass

## Implemented in this source archive
- Retained supplied pink symbol as favicon / Apple touch icon and kept header wordmark asset separate.
- Added direct private R2 file uploads for supported audio, video, PDF and image MIME types; content form attaches the returned R2 object key.
- Added download-key support in the `r2-media` Edge Function and member-facing printable/resource route support from the previous pass.
- Added visible Explore type filters from the previous pass.
- Added admin delete actions for content records and promo codes; existing publish/draft/archive and code activate/deactivate actions remain.
- Added a self-service Stripe cancellation endpoint that schedules cancellation at the end of the current billing period and syncs profile cancellation flags.
- Added account deletion UI, API route, and migration `011_self_service_account_deletion.sql`. Account deletion is deliberately unavailable until that migration is applied to the connected Supabase project.
- Excluded `supabase/functions` from Next.js TypeScript compilation.

## Required before launch
1. Apply Supabase migration `011_self_service_account_deletion.sql` after reviewing it in the Supabase SQL editor.
2. Confirm `STRIPE_SECRET_KEY` is configured in Vercel and matches the same Stripe mode as the subscription IDs stored in Supabase.
3. Deploy the updated `supabase/functions/r2-media/index.ts` function. The source in this archive does not update the deployed function by itself.
4. Configure Cloudflare R2 CORS for the production media origin and verify signed PUT/GET behavior.
5. Run a clean install and production build on Vercel, then test upload -> saved content -> published library -> playback/download, subscription cancellation, account deletion, admin permissions, and every route.

## Not certified
This local source pass was not built or tested against the live Supabase/Stripe/R2 services. The dependency installation timed out in the available environment, so no claim is made that production build or live end-to-end checks passed. Account deletion is a permanent action; do not enable it until the migration and data-retention behavior have been reviewed. Deleting a Teens2Inspire account may not automatically cancel Stripe billing, so cancel the membership separately first.
