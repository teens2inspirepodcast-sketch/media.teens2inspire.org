# Teens2Inspire Media App — Admin Redesign Release Notes

This release redesigns the media app admin workspace while keeping the marketing site (`teens2inspire.org`) separate and unchanged.

## Included in this package
- Card-based admin dashboard with summary metrics and quick actions; the old persistent sidebar is removed.
- A dedicated Add Content format chooser and separate editor route for podcast, video, article, printable, resource, original, pick, and recipe content.
- Printable/resource content detail pages show cover artwork and a download/open action rather than rendering a video player.
- Article and recipe text is stored in the existing `content.body` field and rendered as readable content.
- Event admin form accepts flyer artwork and validates date ranges and HTTPS links.
- Member-facing profile settings for display name and accent color.
- Initial admin registry for discount and gift-code definitions, with plan, duration, discount, use limit, expiry, and active state.
- Mobile-friendly admin navigation and responsive layouts.
- Supabase migration `008_media_studio_customization.sql` for profile color, external content URLs, promo code registry, and a safe self-profile settings RPC.

## Required Supabase step
Before deploying this release, apply `supabase/migrations/008_media_studio_customization.sql` in the Supabase SQL Editor. Keep the existing migrations and environment variables.

## Important implementation boundaries
- Passwords are never viewable by an administrator; Supabase Auth stores password credentials securely and does not expose them. Use account recovery/reset flows instead.
- The codes page currently stores and manages code definitions. It does **not** yet redeem codes or automatically apply free months/discounts in Stripe. Do not advertise gift-card redemption as active until a redemption endpoint and billing tests are implemented.
- Family accounts retain the existing owner + up to two additional profile management. This package does not implement a true profile-switching session across every app route; do not claim the profile-picker workflow is complete.
- Admin account deletion through Supabase Auth is not included; deleting a profile row is not the same as securely deleting its Auth account.
- Printable/resource links are HTTPS URLs. This package does not add private PDF upload/signing; the existing private R2 uploader remains for supported audio/video formats.
- No secrets or `.env.local` files are included. Use the Vercel environment variables already configured for the project.

## Deployment checklist
1. Review this diff locally.
2. Apply migration 008 to the correct Supabase project.
3. Upload the project files to the existing GitHub repository, preserving the `teens2inspire-media/` root folder convention expected by the deployment.
4. Deploy to a Vercel preview first.
5. Test admin sign-in, content create/publish, podcast playback, printable open links, event create, profile customization, family profile limits, and existing school-code access before promoting to production.
