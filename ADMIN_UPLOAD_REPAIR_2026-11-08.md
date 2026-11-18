# Teens2Inspire Content Studio — Upload Repair (2026-11-08)

## Confirmed changes

- Corrected the deployed Supabase `content_caption_path_safe` validation constraint and `media-captions` storage upload policy. A valid `captions/<uuid>.vtt` path was previously rejected due to regex escaping; both now use an unambiguous `[.]vtt` expression. These changes have already been applied directly to the existing Supabase project.
- Replaced the two-step `form.requestSubmit()` re-submission in `src/components/admin-upload-form.tsx` with a controlled save: validate the form, authenticate, upload selected files, collect **metadata only**, then invoke the secured Next.js Server Action in a React transition. One click remains sufficient.
- Added clear error handling for expired browser sessions, unsupported media, storage authorization errors, failed R2 transfers, and rejected cover/caption uploads.
- Added extension-based MIME fallbacks for common media where browsers omit or vary the reported MIME type (e.g. iPhone MOV, M4A), preserving strict allowed formats and file-size limits.
- Maintained the same protected R2 signing endpoint, public artwork bucket, private captions bucket, membership validation, RLS policies, and content editing actions.
- Existing Cloudflare R2 bucket `teens2inspire-media` was inspected; live CORS already allows the media app origin and PUT, so its settings were **not** altered.

## Deployment

This is a **complete media-app source ZIP** intended for `teens2inspirepodcast-sketch/media.teens2inspire.org`. Replace the repository files with this full project, commit and deploy. Do **not** upload the ZIP itself to a GitHub repository and do not replace the marketing/website repository.

## Validation still needed

Source syntax and ZIP integrity were checked. A real authenticated admin upload, including R2 PUT and final database insert, has **not** been executed from this environment, and a Vercel production build was not available. There are recent Supabase `refresh_token_not_found` errors in authentication logs. If the admin session fails, sign out and sign back in on the **media** domain before retesting. If uploading still fails, copy the **exact red error text** from Content Studio and identify the file type and whether this happens before or after the upload progress message.

## Safe smoke-test sequence after deployment

1. Sign out, then sign in as the administrator on `media.teens2inspire.org`.
2. Create a draft article with a title and no file (checks database submission).
3. Add a small JPG cover to another draft (checks Supabase public artwork).
4. Upload a short MP4 or MP3 (checks the signed R2 PUT and metadata save).
5. Upload a small valid WebVTT file when editing a video (checks private captions).
6. Check that the new draft appears on Content Studio; open it and verify its cover/media reference is present.
7. Retest a real video on the player and check the upload's publishing status before announcing it.
