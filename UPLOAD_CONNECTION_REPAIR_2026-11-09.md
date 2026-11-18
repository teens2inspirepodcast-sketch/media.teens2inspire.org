# Teens2Inspire — Admin upload connection diagnostic patch

## Verified findings

- On November 9, 2026 the GitHub media-app repository still contained the old `AdminUploadForm` code (SHA `5c09fe3b6624578c1f168f150fb1b17687da4e31`), last updated November 1. The November 8 repair was not deployed there.
- The private R2 bucket `teens2inspire-media` currently has a CORS rule permitting `https://media.teens2inspire.org` with PUT and Content-Type. The R2 CORS policy was not changed.
- The Supabase caption-path constraint was previously corrected. This patch does not touch tables, payments, existing media, or Supabase Edge Functions.

## Changes

One client component is replaced: `src/components/admin-upload-form.tsx`.

- Direct browser-to-R2 PUT now uses XMLHttpRequest (XHR) rather than Fetch so transfer progress and failures can be displayed on Safari and desktop browsers.
- Shows upload percentage and identifies which file is uploading.
- If a network-interrupted R2 upload occurs, retries once with a freshly authorized signed URL; does not repeatedly submit a failed content record.
- Shows distinct errors for: checking the session, obtaining a signed R2 upload URL, transferring the file, uploading artwork or captions, and saving content to the database.
- Runs the Next.js Server Action in a React transition with metadata only, not with the original media bytes.
- Existing successfully uploaded files are cached within the form instance so a retry after a metadata-save failure need not upload them again.

## Deployment from laptop (preferred)

1. Open the connected GitHub Desktop clone for `teens2inspirepodcast-sketch/media.teens2inspire.org`.
2. Unzip the small patch and copy `src/components/admin-upload-form.tsx` into the same path in the cloned repository, replacing the existing file.
3. Commit and push. Wait until the Vercel production deployment completes successfully.
4. Refresh the media-admin page; sign out and sign in as admin if session-related errors appear.
5. Test a small JPG cover-only content item, then test an audio or video file. Keep the tab visible during upload.
6. If it fails, record the named upload stage, percent, approximate file size, browser, and exact error text; this distinguishes session, authorization, R2, Supabase Storage and save errors.

## Limits / open verification

- Source syntax checks and ZIP-integrity checks do not prove the authenticated production flow.
- A single-request PUT for large videos can still fail with weak mobile connections; true resumable uploads require a separate multipart-R2 implementation and should be tested before release.
- The GitHub / Vercel production projects were not modified by this package.
