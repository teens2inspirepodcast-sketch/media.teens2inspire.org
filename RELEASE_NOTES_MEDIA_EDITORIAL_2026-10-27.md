# Teens2Inspire media app — editorial redesign and pop-up studio entry

## Changes
- Reworked the media-app home layout and styles: edition ribbon, much larger cinematic hero, gallery-style artwork cards, editorial headings, collection shelves, mobile category pills, and cleaner navigation.
- Refined the **Admin Studio** dashboard: stronger page hierarchy, improved action cards/metrics, accent treatment, and an announcement-focused callout.
- Added **Website pop-up** action card in the media-app admin dashboard and navigation. This opens the administrator editor on `https://teens2inspire.org/admin/popup`. Both projects continue to use the preexisting shared Supabase login/session setup.
- Kept existing media, authentication, membership, billing, payment, media upload, API route, and R2-related source implementation intact.
- Continued the rule: all dark-background page text is white or light pink; light surfaces are explicit exceptions.

## Deployment
Push this source ZIP to the **media.teens2inspire.org** GitHub repo, at the repository root, and redeploy on Vercel. Deploy the new website ZIP separately to its respective Vercel project. The website's pop-up editor lives on the main domain, not inside the media app.

## Verification limits
All TS/TSX source files passed syntax parsing and CSS passed PostCSS syntax checking. Full Next.js production build, browser UI review, payment flow, and media playback verification still require deployment/staging testing. This release changes appearance and admin navigation only; it does not implement the previously requested persistent global audio mini-player.
