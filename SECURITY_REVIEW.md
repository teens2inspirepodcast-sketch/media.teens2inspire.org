# Security and launch checks — Media App

Before launch:
- Restrict admin routes and server actions to the intended administrator role; test direct URL access.
- Ensure Supabase RLS prevents users from changing their own role, membership, or school entitlement.
- Do not expose public object URLs for private content. Use provider-authorized playback or short-lived signed URLs.
- Verify the media playback API checks authentication, membership/school access, and content publication state on every request.
- Keep provider credentials and service-role keys server-only.
- Test uploads, file type/size validation, content moderation, signed URL expiry, and error handling.
- Run `npm install`, `npm run build`, and end-to-end tests in the actual deployment environment.
- Verify PWA behavior on iOS Safari and Android Chrome.
