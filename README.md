# Teens2Inspire.org — fresh project

A new Next.js app built independently of the previous source tree. Public-facing marketing website for Teens2Inspire; the actual member library is hosted separately at `media.teens2inspire.org`.

## Run locally
1. Use Node.js 22.12 or newer.
2. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and publishable/anon key.
3. Run `npm install`, then `npm run dev`.
4. Run `npm run build` before deployment.

## Current scope
- New responsive editorial design, motion effects, accessible reduced-motion handling, membership plans, school page, contact page.
- Member-only playback is intentionally not hosted here; calls to the member library link to the separate media domain.
- Signup and checkout links need to be aligned to the actual configured Supabase Auth/Edge Function endpoints before launch.

Do not commit secrets or `.env.local`.
