# Teens2Inspire Media — Member App

This is the **light, app-like media experience** for `media.teens2inspire.org`, separate from the dark marketing site.

## Design direction
- White and warm-blush interface with the actual Teens2Inspire wordmark and vivid pink accents.
- Mobile app chrome inspired by the supplied references: pink branded top bar, image-led featured content, horizontally swipeable shelves, compact cards, and a persistent four-tab bottom navigation (Explore, Search, Library, Settings).
- Desktop navigation expands into a clean top navigation while the content shelves remain responsive.
- Subtle entrance/hover transitions, visible focus states, touch-friendly controls, and reduced-motion support.
- Uses real published cover URLs from Supabase when present. If no cover exists, it uses a restrained typographic gradient tile rather than fabricated photography.

## Included
- App home, Explore with functional type filters, Search, My List/favorites, Settings, content detail, and secure-player interface
- Admin dashboard and content/sections/events/members/schools/inquiries pages
- Login and signup on the media domain, plus email-verification callback
- PWA manifest, service-worker registration, actual logo asset, and app icon
- School-code administration API, shared Supabase migrations, environment example

## Setup
1. Create a separate Vercel project for this folder and connect `media.teens2inspire.org`.
2. Run `npm install`, then `npm run dev` locally.
3. Configure `.env.local` and Vercel environment variables from `.env.example`.
4. Apply the SQL migrations to the same Supabase project used by the main website.
5. Verify membership/school entitlements and admin role enforcement in Supabase before launch.
6. Configure the confirmed V2 media provider API and signed playback adapter before serving private video/audio.
7. Test the app on iPhone Safari, Android Chrome, tablet, and desktop, including install behavior.

## Readiness status
The redesign's TypeScript/TSX files passed a syntax parse. A production build has **not** been verified because dependency installation timed out in this environment. Run `npm install` and `npm run build` in Vercel or a network-enabled environment before deploying.

**Playback blocker:** The V2 playback endpoint deliberately fails closed until the actual provider API contract and credentials are configured. Do not treat private playback as production-ready until that integration is implemented and tested. The main website is supplied separately as `teens2inspire-website-redesigned.zip`.


## Repair notes
- Corrected profile lookup to avoid selecting the nonexistent `profiles.email` column.
- Corrected section and section-content query column names to match the known Supabase schema.
- Required public Vercel variables are shown in `.env.example`. Do not add Stripe secret keys to Vercel.
- The project ZIP has not been proven production-ready by a live deployment/build; test authentication, entitlements, content shelves, and admin access after upload.
