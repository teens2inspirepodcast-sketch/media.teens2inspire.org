# Security and launch checks — Media App

- Admin routes and mutations must require the intended administrator role; test direct URL and server-action access.
- Confirm Supabase RLS prevents users from changing their role, membership, or school entitlement.
- Keep private media URLs out of database reads and rendered page HTML; only return provider-authorized short-lived playback URLs.
- Verify the playback API checks authentication, active paid membership or school access, content publication state, and provider response on every request.
- The current V2 adapter is intentionally not implemented without the provider's verified API contract. It must remain fail-closed.
- Keep provider credentials and service-role keys server-only.
- Test favorites, family profile limits, school-code redemption, Stripe status sync, and admin workflows.
- Run `npm install`, `npm run build`, and end-to-end tests in the actual deployment environment.
- Verify PWA behavior on iOS Safari and Android Chrome. The service worker must not cache private pages, account data, API responses, or media.
