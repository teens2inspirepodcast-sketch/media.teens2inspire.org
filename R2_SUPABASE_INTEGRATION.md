# Supabase + Cloudflare R2 integration update

The media upload-authorization and playback API routes now call the deployed Supabase Edge Function `r2-media`. Supabase validates the user session and admin/membership access, then generates short-lived R2 signed URLs. The browser sends file bytes directly to R2; Supabase remains the authorization engine and database for media metadata.

Required secrets in Supabase Edge Functions: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PRIVATE_BUCKET_NAME=teens2inspire-media`. Do not place R2 secrets in public environment variables.

The upload form stores the returned R2 object key in the content editor. After saving content, verify `content.r2_media_key` is populated. Playback requires the content to be published and a signed-in user; member-only items also require an eligible membership or school access.

Validation note: this source bundle was assembled after deploying `r2-media` v2. The remote secrets' values are not readable through this bundle. A live upload/playback round-trip and a production build still need to be run before calling production readiness verified.
