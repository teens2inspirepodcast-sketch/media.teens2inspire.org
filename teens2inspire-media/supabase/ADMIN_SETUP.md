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
