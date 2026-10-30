# Media app route audit — October 30, 2026

Audited all 26 Next.js page routes. Zero unresolved literal internal links were found among TSX files. No page route was deleted because each has a current functional purpose.

- `/` redirects to the authenticated `/app` experience.
- `/login`, `/signup` provide account access and fallback signup flows.
- `/app` is the member homepage.
- `/app/explore`, `/app/search`, `/app/library`, `/app/events` are the five-navigation destinations except Settings.
- `/app/profile` is account settings, language preferences, billing controls, and family profile management.
- `/app/profiles`, `/app/profiles/add` are family picker and profile creation.
- `/app/content/[id]` is the secure member content detail/player page.
- `/admin` is the authenticated content studio.
- `/admin/add` is the content-type chooser.
- `/admin/content`, `/admin/content/new`, `/admin/content/[id]/edit` manage records and media uploads.
- `/admin/codes`, `/admin/schools`, `/admin/members`, `/admin/inquiries` manage school and subscriber operations.
- `/admin/events`, `/admin/partnerships`, `/admin/podcast-platforms`, `/admin/sections`, `/admin/site-settings` manage their respective records and published sections.

The related authorization, account deletion, R2 playback, and caption API routes are retained unchanged. No arbitrary data cleanup or backend deletion was performed.

**Verification:** syntax parse and browser CSS check, not a full Next.js production build or authenticated functional test. Test language changes in both directions after Vercel deployment.
