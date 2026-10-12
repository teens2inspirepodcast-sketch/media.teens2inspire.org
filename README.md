# Teens2Inspire Media — Media App

This ZIP is the **media and member app** intended for `media.teens2inspire.org`, separate from the public marketing website.

## Included
- Member app shell and Explore, Search, Library, Profile, and content pages
- Admin dashboard and content/sections/events/members/schools/inquiries areas
- Media playback API route foundation
- School-code administration API and form
- PWA manifest, service-worker registration, and shared Supabase helpers
- Shared database migrations and environment example

## Setup
1. Create a separate Vercel project for this folder and connect `media.teens2inspire.org`.
2. Install dependencies with `npm install`, then run `npm run dev`.
3. Configure `.env.local` and Vercel environment variables from `.env.example`.
4. Apply the SQL migrations to the same Supabase project used by the main website.
5. Configure the approved media provider's server-side API and signed playback flow before serving private content.
6. Test member access, admin role enforcement, playback authorization, and mobile installation.

## Important
This package is split from the main website for separate deployment. It is not a claim that production deployment or end-to-end tests have passed. The exact V2 media provider API still needs to be configured and verified before secure playback can be considered complete. The main website is supplied separately as `teens2inspire-website.zip`.

## Build-log fix included
The manifest icon `purpose` is set to the valid Next.js value `any` instead of the invalid value `any maskable` that caused TypeScript error TS2820.
