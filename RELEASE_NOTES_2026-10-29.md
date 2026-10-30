# Teens2Inspire Media App — Single-Save Uploads and Full Editing

This is a full-source Next.js project package, based on the 2026-10-27 editorial source with the 2026-10-28 white/pink player patch applied. Overlay it onto the media app repository (`media.teens2inspire.org`). Do not upload the ZIP as a ZIP file into the repo; extract and commit the files at the repository root.

## New workflow: one Save button
- Open **Admin → Add content** or **Admin → Content → Edit**.
- Choose the media file and (optional) cover image directly from your device.
- Press **Upload & Save**. The selected private media file is uploaded through the existing admin-authorized `/api/admin/media/upload-url` endpoint and Cloudflare R2 presigned PUT. The returned object key is submitted to the existing Supabase content Server Action in the same form workflow.
- The cover image is stored publicly in Supabase Storage bucket `site-brand-assets` so it can display on both the marketing website and app. The live `r2-media` Edge Function does **not** have the newer artwork action, so this release deliberately does not depend on that action or modify the live function.
- If the upload fails, the content action is not submitted. If a later database save fails after a successful upload, an unused object may remain in storage; no destructive automatic cleanup is attempted.
- Existing external RSS.com links and existing R2 keys remain usable.

## Editing existing records
- **Admin → Content:** Edit existing content (title, slug, category, tags, description, article/recipe body, image, private media file, external URL, member-only, featured, status, collection assignment). Updates the original record.
- **Admin → Partnerships:** Edit an existing partner's name, logo (file upload or URL), website, description, order, active status.
- **Admin → Podcast platforms:** Edit name, logo, slug, destination, order, active status.
- **Admin → Events:** Edit time, title, description, flyer image, URL, location, and status. Existing form dates are labeled UTC as the server stores timestamps in UTC.
- **Admin → Sections:** Edit collection title, slug, description, order and publishing state.
- **Admin → Site settings:** Edit the live website's headline, hero image, app preview copy, membership copy, brand logo, footer, About and podcast copy; image fields upload directly to Supabase on Save.

## Supabase changes
- New public-image bucket `site-brand-assets`, 10 MB per image, JPEG/PNG/WebP/GIF/AVIF; existing `public.is_admin()` function gates writes through Storage RLS.
- The migration `supabase/migrations/20261029220000_site_brand_assets.sql` was already applied successfully to the Teens2Inspire project on 2026-10-29. It is included for version-control documentation.
- Existing `marketing_settings`, `partnerships`, `podcast_platforms`, `content`, `events`, `sections` tables are reused. No Stripe or Supabase Edge Functions modified.

## What is not yet verified
- Full `next build`/TypeScript type-check (dependencies are not present in the work environment and no lockfile was included); browser end-to-end uploading (requires live R2 CORS, Supabase access and authentication) and live Stripe checkout were not executed.
- Changes are in this source package, not deployed to the user's Vercel project.
- Static legal policies, Stripe plan prices, and membership eligibility rules are intentionally not editable as unreviewed website copy.
