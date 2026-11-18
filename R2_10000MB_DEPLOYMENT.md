# Teens2Inspire 10,000 MB (10 GB) media upload upgrade

This updates the maximum size **per individual R2 media file** to 10,000,000,000 bytes (decimal MB). It does not change total R2 bucket storage quotas or billing. It does not change artwork, branding images, captions, or popup video limits.

## Deploy both parts
1. Deploy `supabase/functions/r2-media/index.ts` as the existing `r2-media` Supabase Edge Function, preserving its current environment variables and authentication settings.
2. Update the media-app repository with the two changed `src/` files, commit, and deploy on Vercel. The full ZIP includes the previous popup/contrast changes too.
3. Cloudflare R2 CORS must allow PUT and expose `ETag` (previously verified).
4. Test first with a small file, then a large file.

Uploads over 80 MiB use 20 MiB multipart parts with retries; 10 GB requires up to 477 parts. Keep the browser tab open; **cross-reload resume is not implemented**. Network quality, browser memory, and upload duration can still affect success. Large uploads consume R2 storage and operation costs.

Status: prepared source files, not deployed or production tested.
