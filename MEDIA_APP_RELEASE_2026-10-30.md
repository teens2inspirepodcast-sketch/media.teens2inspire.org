# Teens2Inspire Media App — Full Watch Player and Multilingual Settings

## Added
- Dedicated mobile-friendly watch player when you open an episode's content page; the player becomes a compact mini-player only after navigating to another app page. The `<video>` and `<audio>` elements remain in the persistent provider across route changes.
- Fullscreen control (standard Fullscreen API and iOS Safari's native `webkitEnterFullscreen` fallback), 15-second seeking, timeline seeking, playback speed, play/pause, minimize/close, and WebVTT subtitles when uploaded.
- English, Hebrew, Yiddish account-language setting, persisted per user in Supabase (`user_app_preferences`). Hebrew and Yiddish use right-to-left app layouts.
- Translated first-party interface labels, menus, settings, and status messages. User-authored episode descriptions, titles, article text, collection names, and event details are not automatically machine-translated.
- Optional Hebrew and Yiddish **content title/description/article text** inputs in the existing Content Studio and edit forms. Member views use the saved translations when present, and fall back to English otherwise.
- Private Supabase Storage `media-captions` for optional `.vtt` subtitle files, attachable with the existing one-Save admin upload workflow.
- Authorized same-origin caption route `/api/media/captions/[id]`, with authentication, published status, and membership checks. No changes to the existing Cloudflare R2 playback endpoint.

## Supabase changes
Already applied to the connected `teens2inspire` project on 2026-10-30:
- `user_app_preferences` table and self-service RLS.
- `content.caption_path` and `content.caption_language` additive fields.
- Private `media-captions` bucket with administrator-only upload and content-access-gated reads.
- `content_translations` table with RLS (admin writes, authenticated published-content reads).
The additive SQL is also included under `supabase/migrations/20261030004000_app_languages_captions_content_translations.sql` for new databases. **Do not apply the migration again to the same project unless required by your deployment tooling.**

## Limitations
- Captions appear only after an administrator uploads an accurate WebVTT file. Automatic transcription or translation of the video is not provided.
- Published editorial text needs an author-provided Hebrew/Yiddish translation. Administrative dashboards, authentication pages, and some dynamic messages retain English while localization is expanded; this is not a claim of full multilingual coverage yet.
- RSS.com iframe podcast episodes retain their own embedded player; they do not use the R2 persistent player.
- The code was checked with a TypeScript/TSX syntax parser and the CSS with PostCSS. A standalone CSS mobile watch-page preview was inspected. Dependencies (`next`, React and other package modules) are not installed in this environment, so a full Next.js production build and authenticated end-to-end playback/caption tests were **not** completed.
- No production Vercel deployment was performed. Deploy this media app to its own GitHub/Vercel project, then test on an iPhone and Android device.

## Functionality preservation
- Existing Stripe checkout, subscriptions, webhooks, Supabase auth and profiles, school access, family profile switching, R2 credential handling, `r2-media` Edge Function and `/api/media/playback/[id]` were not changed.
