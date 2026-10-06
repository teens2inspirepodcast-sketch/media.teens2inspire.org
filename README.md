# Teens2Inspire Media

The separate media/PWA app for `media.teens2inspire.com`.

## Architecture
- Next.js 16 + TypeScript
- Supabase Auth/database
- Cloudflare R2 for media bytes
- Supabase `content` metadata
- Admin-only publishing studio
- Same Supabase accounts as `teens2inspire.org`

## Vercel production variables
Set the values from the production Supabase and Cloudflare R2 accounts. Never commit secrets.

Required:
`NEXT_PUBLIC_SUPABASE_URL`
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
`NEXT_PUBLIC_SITE_URL=https://media.teens2inspire.com`
`SUPABASE_SECRET_KEY`
`R2_ACCOUNT_ID`
`R2_ACCESS_KEY_ID`
`R2_SECRET_ACCESS_KEY`
`R2_PRIVATE_BUCKET_NAME`
`R2_PUBLIC_BUCKET_NAME`
`R2_PUBLIC_BASE_URL=https://media.teens2inspire.com`

## Supabase
The media app uses the existing Teens2Inspire project and existing `profiles`, `family_profiles`, `content`, `favorites`, `subscriptions`, and membership logic.

Add this redirect URL to Supabase Auth if using any email-auth flow on the media app:
`https://media.teens2inspire.com/auth/callback`

The primary account creation and email verification flow remains on `https://teens2inspire.org`.

## R2
Use a private bucket for video/audio and a public bucket for thumbnails/artwork. Configure `R2_PUBLIC_BASE_URL` to the custom domain attached to the public R2 bucket.

## Deploy
Import this repository into a new Vercel project and assign the custom domain `media.teens2inspire.com`.
