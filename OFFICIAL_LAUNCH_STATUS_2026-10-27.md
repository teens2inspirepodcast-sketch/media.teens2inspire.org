# Teens2Inspire Media — Official Launch Candidate

This package is based on the latest official media app homepage-fix source. The homepage redirects to `/app`; the launch contrast repair adds explicit readable text colors to episode detail, article, and player surfaces. Existing Supabase, Stripe, and R2 integration files were left unchanged.

## Requested work tracked for completion
- [ ] Cover artwork: upload an image from the device/photo library and persist it as content artwork (not paste an image URL).
- [ ] Global persistent mini-player that continues audio while navigating, with play/pause, close, and expand controls.
- [ ] Edit existing entries throughout the admin dashboard (episodes/content, school codes, partnerships, events, and other records).
- [ ] Admin-managed promotional pop-up for Teens2Inspire.org, with editable copy, video, thumbnail, enable/disable, and close behavior.
- [ ] Verify that uploaded media and artwork persist and render correctly on cards and detail pages.
- [ ] Verify family profile creation, all admin workflows, responsive behavior, Stripe checkout/webhooks, and Supabase authorization in production.

## Release caution
This ZIP is a launch candidate, not a verified production release. The items above are not all implemented by the contrast patch. A full dependency install/build and authenticated end-to-end production test have not been completed. Do not describe the app as fully launch-ready until these checks pass.
