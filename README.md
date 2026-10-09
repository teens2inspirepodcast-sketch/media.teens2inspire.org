# Teens2Inspire media PWA

App-like media frontend for `media.teens2inspire.org`, with a dark premium mobile-first design, PWA manifest/service worker, install guide, explore/search/library/profile pages, and Supabase client foundation.

## Setup
1. `npm install`, then `npm run dev`.
2. Copy `.env.example` to `.env.local` and set the public Supabase URL and anon key.
3. Deploy to Vercel and attach `media.teens2inspire.org`; ensure HTTPS is active.
4. Configure the shared Supabase schema, RLS, Edge Functions, and authentication redirect URLs.

## Important security boundary
This frontend intentionally does not contain R2 credentials, Stripe secrets, or public private-media URLs. Before serving production media, implement and deploy a server-side/Supabase Edge Function that authenticates the user, verifies active Stripe-backed membership or a valid school entitlement, and returns a short-lived signed R2 URL. Every content record and media object must be protected by RLS/server-side authorization. Do not expose R2 buckets publicly. The current category pages are safe placeholders; they do not claim to stream content before authorization is implemented.

## Build status
Reconstructed from saved Teens2Inspire requirements. Network access to npm registry timed out in this environment, so dependencies and production build could not be installed or verified. The frontend is not end-to-end production-ready until Supabase Edge Functions/schema, membership gates, content catalog, protected playback, and checkout have been configured and tested.
