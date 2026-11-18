# Teens2Inspire: Pop-up editor unblock repair

## Live Supabase restoration
The `site-popup-media` bucket was missing even though its Supabase storage policies already existed. It was restored in the connected Supabase project with public read access for displaying announcements, an 80 MiB per-object limit, and an allowlist of image/video MIME types. Existing `is_admin()` policies continue to restrict uploads/updates/deletes to administrators.

## Files in the media app patch
- `src/components/site-popup-editor.tsx`: save via a direct server action, pending state from React `useFormStatus`, close preview with Escape, accurate draft status and accessible preview dialog.
- `src/app/admin/popup/page.tsx`: working View Website link, helpful error message when settings cannot be read.
- `src/app/popup-editor-unblock.css`: responsive one-column editor on mobile, proper contrast and a visible fixed preview modal with a close control; prevents preview from pushing or obstructing the page.
- `src/app/layout.tsx`: loads pop-up styles after general contrast repair.
- Prior November 17 patch retains text contrast and media multipart upload changes.

## Deploy
1. Apply patch ZIP *contents* to media repository `teens2inspirepodcast-sketch/media.teens2inspire.org` at root, preserving existing files.
2. Commit/push so Vercel deploys. Or use complete source archive, but only if replacing the complete media project intentionally.
3. Check `https://media.teens2inspire.org/admin/popup` as an administrator. Change title or message, Save changes, verify success banner; preview, close, toggle enabled, test uploaded JPG.
4. The live bucket has been restored separately; deployment is still required for updated editor controls.

Note: This editor is for the **public Teens2Inspire.org marketing pop-up**, managed from the media-app administrator dashboard. The website must read shared Supabase `site_popup` settings for visitors to see changes.
