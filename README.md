# Teens2Inspire Media — Member App

This is the **light, app-like media experience** for `media.teens2inspire.org`, separate from the dark marketing site.

## Design direction
- White and warm-blush interface with the actual Teens2Inspire wordmark and vivid pink accents.
- Mobile app chrome inspired by the supplied references: pink branded top bar, image-led featured content, horizontally swipeable shelves, compact cards, and a persistent four-tab bottom navigation (Explore, Search, Library, Settings).
- Desktop navigation expands into a clean top navigation while the content shelves remain responsive.
- Subtle entrance/hover transitions, visible focus states, touch-friendly controls, and reduced-motion support.
- Uses real published cover URLs from Supabase when present. If no cover exists, it uses a restrained typographic gradient tile rather than fabricated photography.

## Included
- App home, Explore with functional type filters, Search, My List/favorites, Settings, content detail, and secure-player interface
- Admin dashboard and content/sections/events/members/schools/inquiries pages
- Login and signup on the media domain, plus email-verification callback
- PWA manifest, service-worker registration, actual logo asset, and app icon
- School-code administration API, shared Supabase migrations, environment example

## Setup
1. Create a separate Vercel project for this folder and connect `media.teens2inspire.org`.
2. Run `npm install`, then `npm run dev` locally.
3. Configure `.env.local` and Vercel environment variables from `.env.example`.
4. Apply the SQL migrations to the same Supabase project used by the main website.
5. Verify membership/school entitlements and admin role enforcement in Supabase before launch.
6. Configure the Cloudflare R2 credentials in `.env.local` and Vercel server environment variables. Store the exact private R2 object key in each content item’s `r2_media_key`. Playback URLs are signed for five minutes and are only issued after sign-in, RLS-protected content lookup, and membership checks.
7. Test the app on iPhone Safari, Android Chrome, tablet, and desktop, including install behavior.

## Readiness status
The redesign's TypeScript/TSX files passed a syntax parse. A production build has **not** been verified because dependency installation timed out in this environment. Run `npm install` and `npm run build` in Vercel or a network-enabled environment before deploying.

**Playback configuration requirement:** The signed-playback route now supports private Cloudflare R2 objects. Playback remains unavailable until the four R2 server environment variables are configured, the objects exist in the private bucket, and a real member/non-member playback test passes. The main website is supplied separately as `teens2inspire-website-redesigned.zip`.


## Repair notes
- Corrected profile lookup to avoid selecting the nonexistent `profiles.email` column.
- Corrected section and section-content query column names to match the known Supabase schema.
- Required public Vercel variables are shown in `.env.example`. Do not add Stripe secret keys to Vercel.
- The project ZIP has not been proven production-ready by a live deployment/build; test authentication, entitlements, content shelves, and admin access after upload.


## Supabase schema repair and school-code creation

Migration `supabase/migrations/003_school_admin_schema_compatibility.sql` aligns
the school-code admin API with the live schema: it provides the `schools` table,
the `school_codes.school_id` and `is_active` fields, a trigger to keep the school
name compatible, and administrator-only RLS policies. Apply migrations in order
to a fresh project. In the connected Teens2Inspire Supabase project, this
compatibility migration was applied and a database insert smoke test passed.
The Next.js app itself still needs a deployment-level test of school-code
creation using the actual administrator login.

## Admin media uploads to Cloudflare R2

The Content Studio supports direct browser-to-R2 uploads for audio/video files up to 500 MB. The server checks the signed-in administrator, validates the file type/size, and issues a short-lived presigned PUT URL. The app saves the private object key in `content.r2_media_key`; playback uses the authenticated `/api/media/playback/[id]` route to issue short-lived signed GET URLs. The upload route returns JSON 401/403 responses for missing/non-admin sessions rather than redirecting the browser upload request to an HTML login page.

Required server-only Vercel environment variables on `media.teens2inspire.org`:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_PRIVATE_BUCKET_NAME` (preferred private bucket variable)
- `R2_BUCKET_NAME` (backward-compatible fallback if the private name is not set)
- `R2_PUBLIC_BUCKET_NAME` is optional and is not used by the current private-media upload/playback code.

Never prefix credentials with `NEXT_PUBLIC_` and never commit actual credentials. The upload and playback routes prefer `R2_PRIVATE_BUCKET_NAME`, then fall back to `R2_BUCKET_NAME`.

### Required R2 bucket CORS

In Cloudflare Dashboard → R2 → your bucket → Settings → CORS, add a rule that allows the exact production origin and any preview origin used for testing. Example for production:

```json
[
  {
    "AllowedOrigins": ["https://media.teens2inspire.org"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type", "x-amz-*"],
    "ExposeHeaders": ["etag"],
    "MaxAgeSeconds": 3600
  }
]
```

If the bucket is configured to require additional signed headers, ensure the browser PUT sends those same headers. Test with a small non-sensitive sample media file after deploying and verify playback through the app, not through a public bucket URL.


### Security compatibility migration
Apply `supabase/migrations/005_security_hardening.sql` after the earlier migrations. It restricts trigger-only SECURITY DEFINER functions from direct RPC use, adds administrator-only policies to legacy school-code/video-asset tables, and disables obsolete school-code RPC overloads not used by the current apps. The connected Supabase project has this migration applied.


### Family profile repair
Migration `006_restore_guarded_family_profile_rpcs.sql` aligns the `family_profiles` table with the app's current `owner_id`, `first_name`, `display_name`, and `interests` fields. The UI calls guarded database functions for creating/removing profiles; direct member INSERT/DELETE policies are intentionally absent. Apply this migration after `005_security_hardening.sql`.


### Fresh-install schema compatibility
Migration `007_complete_app_schema.sql` brings older base migrations up to the current app schema, including section metadata, R2 content keys, categories, membership/subscription tables, Stripe webhook idempotency records, and current access-control policies. Apply migrations in numeric order through `007` before configuring production credentials.


## Root URL and environment variable mapping

The domain root (`https://media.teens2inspire.org/`) redirects to `/app`, so the marketing site's sign-in handoff and the installed app entry point work without a root-page 404. The app reads `NEXT_PUBLIC_SUPABASE_URL` and either `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Private media uses `R2_PRIVATE_BUCKET_NAME` (preferred) or the existing `R2_BUCKET_NAME` fallback, plus `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY`.

Stripe secrets and price IDs are not read by this Next.js media app. The marketing site's checkout invokes the Supabase `stripe-checkout` Edge Function; keep `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PERSONAL`, and `STRIPE_PRICE_ID_FAMILY` in Supabase Edge Function secrets. Configure Stripe's webhook to the Supabase `stripe-webhook` function URL, not the Vercel `/api/stripe/webhook` placeholder route.
