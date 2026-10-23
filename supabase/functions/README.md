# Supabase Edge Functions

These functions target the shared Supabase project for Teens2Inspire: `mphswidvmesdkefkgwjz`. The live project has `contact`, `school-code-validation`, `r2-media`, `stripe-checkout`, and `stripe-webhook` deployed. Function sources are kept in both site ZIPs so the source bundle travels with either repository.

Do not put Stripe or R2 secrets in the browser or commit them. Required server-side Edge Function secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PRIVATE_BUCKET_NAME` (and `RESEND_API_KEY` / `CONTACT_FROM_EMAIL` for email delivery). `R2_PRIVATE_BUCKET_NAME` should be `teens2inspire-media`. Secrets stay configured in Supabase, not in these files.
