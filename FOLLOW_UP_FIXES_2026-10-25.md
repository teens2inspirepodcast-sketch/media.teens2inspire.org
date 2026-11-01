# Media app follow-up fixes — 2026-10-25

## Included
- Added a branded `/app` route loading screen using the existing Teens2Inspire symbol icon (`public/icon-192.png`).
- Added a persistent one-year lifetime to Supabase auth cookies on the browser, server, and proxy clients, retaining the shared `.teens2inspire.org` domain configuration. This is intended to keep the signed-in session across normal browser/PWA restarts; explicit sign-out still ends the session.
- Fixed the mobile header CSS so the account/avatar link is visible on phone-sized screens. It links to `/app/profile` and displays the account initial with the saved profile accent color.

## Verification limits
- Source files were updated and the archive is structurally valid, but a full Next.js build and live iOS Home Screen/PWA session test were not run in this environment.
- The current Family membership implementation supports creating/removing up to two additional `family_profiles` records (three total including the account holder) through guarded Supabase RPCs. The supplied app source does **not** implement a profile-picker/switching experience for those additional records, and live database/RPC behavior has not been exercised here. Do not treat profile switching as complete.
- A true uploaded profile photo is not currently supported by the supplied schema/UI; the account circle uses the user's initial and profile accent color.
