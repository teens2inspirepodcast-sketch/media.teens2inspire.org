# Administrator and database setup

1. In the correct Supabase project, apply `migrations/001_initial.sql`, then `migrations/002_security_school_access.sql`.
2. Sign up through the website and verify the administrator email address.
3. In the Supabase SQL Editor, run the following query with the exact email used for the admin account:

```sql
update public.profiles p
set role = 'administrator'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('YOUR_ADMIN_EMAIL_HERE');
```

4. Confirm exactly one row changed. If none changed, check that the auth user exists and the profile trigger created a matching row.
5. Sign in and verify `/admin` is accessible only to the administrator. Test with a normal user too.
6. Use **School Access** in the admin dashboard to generate school codes. Each raw code is shown only once; store and distribute it securely. The database stores only its hash.
7. Do not manually update membership status to simulate payment in production. Stripe webhook events should control paid membership state.

## Promo-code migrations (media app)

For a fresh environment, apply migrations `008_media_studio_customization.sql`,
`009_stripe_promo_code_integration.sql`, and
`010_promo_code_redemption_tracking.sql` in order. The last migration restricts
redemption recording to `service_role`; never call it from a browser client.
The Stripe checkout and webhook Edge Functions must be deployed together with
these schema changes. Test in Stripe test mode before enabling public promotion
codes in live checkout.

## Promo-code migrations and webhook

Apply migrations 008, 009, and 010 in order on a fresh database. The Stripe webhook calls `record_promo_code_redemption` with parameter names `p_code_id`, `p_user_id`, `p_checkout_session_id`, and `p_subscription_id`; keep these names aligned between SQL and Edge Function code. Deploy checkout and webhook functions together, and test in Stripe test mode before enabling live promotion codes.
