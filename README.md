# Teens2Inspire Media — member streaming app

Full Next.js source for `media.teens2inspire.org`. Existing authenticated media playback, Cloudflare R2, user profiles, content management, and Supabase/Stripe integrations are preserved.

## October 30, 2026 changes
- Account Settings: dark-on-dark account deletion panel repaired. Text uses dark ink on pale blush, with a visible outlined action button.
- Account deletion description uses clear customer-facing wording without referencing payment infrastructure.
- App language: saves English/Hebrew/Yiddish to the existing `user_app_preferences` record, updates the cookie, and **reloads the application layout** after saving. Repeated language switches (including switching back to English) are supported in source.
- Localization restores original English DOM text and attributes before retranslation, and sets language/direction on the document for Hebrew and Yiddish.
- Obsolete marketing-editor fields no longer displayed because the public website no longer uses those sections.

## Functionality preserved
Existing playback, mini-player, fullscreen controls, captions, private R2 uploads, secure API routes, Supabase auth, profiles, membership access, and Stripe infrastructure were not changed.

## Deployment / verification
Extract into the existing media-app repository. Keep all current environment variables. Run `npm ci`, `npm run lint`, and `npm run build`. On an authenticated phone test English → Hebrew → English → Yiddish → English, navigation labels, account settings contrast, family profiles, media playback, R2 uploads, and membership controls.

Source syntax checks and representative browser CSS checks passed. A full Next.js build, live authenticated functional tests, and deployment were **not** run here.
