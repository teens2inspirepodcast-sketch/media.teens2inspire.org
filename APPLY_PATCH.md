# Teens2Inspire — Media app white-and-pink streaming design + persistent player

PATCH PACKAGE — **not a standalone project**.

## Exact base
Apply to the existing Next.js repository whose previous snapshot matches `Teens2Inspire-Media-Editorial-Redesign-2026-10-27.zip`. Do not replace an unrelated project or apply to the wrong domain.

## Install
1. Back up and commit your existing repository.
2. Extract this ZIP into the ROOT of the matching repository (where `package.json` is), preserving `src/` directory structure and overwriting the changed files.
3. Keep your current `.env` files and production variables. The patch contains no `.env` file.
4. Run `npm install`, `npm run lint` and `npm run build` from the repo root, then test locally/staging.
5. Commit and deploy the site through its existing Vercel project after manual review.

## What is included
- Clean white/pink streaming app, large interactive featured carousel with real published art and navigation dots.
- Horizontal Supabase content shelves and scrollable format filters.
- Five mobile tabs: Explore, Search, Library, Events and Settings.
- Persistent app-layout mini-player for authorized media with artwork, full player, progress/seek, +/-15 seconds, speed and close/minimize.
- Playback continues across /app route changes; existing /api/media/playback/[id] authorization reused.
- RSS.com embedded iframe podcasts are unchanged and not managed by the mini-player.
- Existing accounts, memberships, family profiles, admin, R2 and Supabase/Stripe functions remain unchanged.

## What is NOT changed
- No edits to `src/lib/supabase/`, Supabase Edge Functions, database migrations, Stripe prices/checkout/webhook, API routes, R2 keys/credentials, school codes or account data.
- Existing functionality and API contracts are reused. The new client player changes only the playback UI/lifecycle.

## Manual acceptance tests (not yet completed)
1. Check homepage, featured carousel dots, published content shelves and five tabs on phone/tablet/desktop.
2. Play an authorized hosted podcast; navigate to other /app routes, pause/resume, seek +/-15 s, change speed.
3. Play an authorized R2 video, expand/minimize, then navigate while playback continues.
4. Test expired sessions/non-member authorization, secure playback access denial and RSS.com iframe playback.
5. Test settings, family profile switching, favorites, admin upload, content publishing and event registration.

## Validation
- All TypeScript/TSX source files parsed locally with TypeScript; no syntax errors.
- Both CSS files parsed with PostCSS; no syntax errors.
- The source files were diffed against the base ZIP.
- `npm install --offline` was attempted but failed (dependencies not cached). A full Next.js production build, visual QA and live end-to-end testing are **not completed**.
- No live GitHub or Vercel deployment performed.

## Applying alongside the other patch
Deploy website and media app to their SEPARATE repositories. Never mix the folders.
