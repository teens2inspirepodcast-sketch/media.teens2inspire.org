# Media app deployment checklist

- [ ] Attach and verify `media.teens2inspire.org` to this Vercel project.
- [ ] Confirm Vercel root directory points to this media project, not the marketing-site source.
- [ ] Add Supabase URL/public key and server-only service-role key to Vercel.
- [ ] Add Cloudflare R2 server credentials, exact private/public bucket names, endpoint, and public artwork URL.
- [ ] Configure R2 CORS for direct browser-to-R2 PUT uploads.
- [ ] Deploy the three Supabase Edge Functions and set Stripe/Supabase secrets in Supabase.
- [ ] Set the existing Stripe webhook signing secret in Supabase; the updated marketing site forwards the existing webhook URL to Supabase. Do not change the live Stripe endpoint until a test event succeeds.
- [ ] Add Auth redirect allowlist for the callback route and enable leaked-password protection.
- [ ] Apply the school redemption migration.
- [ ] Run route smoke test, TypeScript check, production build, then authenticated end-to-end tests.
- [ ] Verify admin upload/publish, private playback 401/403/200 behavior, membership lifecycle, and school code use limits.
