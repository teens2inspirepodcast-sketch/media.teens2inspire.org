# Teens2Inspire — 30 October 2026 focused update

## Media app
- The pale loading text is replaced with a dark rose on the very light splash card.
- Secondary text and rose accents on light app backgrounds have stronger contrast. The dark featured panel retains white text.
- No playback, account, R2, Supabase, or Stripe API changes.

## Website
- Added a benefits section describing the media app without exposing episode titles, artworks, or media links.
- Added an invitation section with Join Us and Membership routes.
- The main CTA remains `/signup`, sign-in remains `/login`, and Partners remain on the homepage.
- New homepage benefit copy can be edited at `/admin/website` and is backed by the existing `marketing_settings` Supabase table.
- No Supabase migration is required because the table accepts new setting keys.

## Testing / deployment
- Files have syntax and CSS structure checks, but a full Next.js production build, live mobile browser tests, and end-to-end checkout/playback validation are not complete.
- Deploy each source tree to its corresponding Vercel project after checking the rendered screens.
