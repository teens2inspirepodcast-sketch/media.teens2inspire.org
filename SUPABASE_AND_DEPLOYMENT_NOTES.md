# Teens2Inspire deployment notes (October 23, 2026)

This project is one half of the split deployment. `teens2inspire.org` is the marketing/signup site; `media.teens2inspire.org` is the protected media app. Both use the shared Supabase project `mphswidvmesdkefkgwjz`. Keep their public Supabase URL and publishable/anon key aligned. Do not place the service-role key, Stripe secret, Stripe webhook secret, or R2 secret/access key in any `NEXT_PUBLIC_*` variable.

## Live backend

The shared Supabase Edge Functions are `contact`, `school-code-validation`, `r2-media`, `stripe-checkout`, and `stripe-webhook`. They are also included under `supabase/functions/` here. The verified active Stripe live prices are Personal $7.99/month (`price_1ULE0PIgMA67dR4JrQy2EINd`) and Family $9.99/month (`price_1ULE7KIgMA67dR4JCMyFbFo4`). R2 private bucket: `teens2inspire-media`. Uploads are private; the app receives short-lived signed URLs only after the admin/access checks.

The 20261023 schema hardening, school-code rate-limiter, and public marketing-CMS migrations are already applied to the live Supabase project. The migration files are included for audit/version control; the repository's earlier migration history should be reconciled before running `supabase db push` against a database with existing history.

## Website/admin synchronization

Marketing copy, the About bio, partner carousel, and podcast-platform links read from `marketing_settings`, `partnerships`, and `podcast_platforms` in Supabase. Admin write policies require Goldie's designated `administrator` account. Changes appear on the public site on its next dynamic render. Content and private playback remain account/membership gated.

## Final live test still required

Before public paid launch, verify with a controlled test account and Stripe test/live-mode decision: (1) valid/invalid/expired/exhausted School codes; (2) no signed-out access to media; (3) admin upload of MP4/MP3/PDF/JPEG to R2 and publishing the row in `content`; (4) nonmember denial and active-member playback/download; (5) Personal and Family Stripe checkout and webhook profile updates; (6) a 15% promo and one-month 100% gift card. A deployment artifact does not prove the real R2 bucket CORS policy or Stripe account mode/secret values are correct.
