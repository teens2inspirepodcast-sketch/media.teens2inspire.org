# Family profile creation fix — 2026-10-25

- Simplified add-profile flow to one required profile-name field.
- No profile picture, avatar, or color customization is required to create a profile.
- Calls the existing guarded `add_family_profile` RPC and stores the profile under the authenticated account owner.
- On success, returns to the dedicated “Who’s watching today?” picker and displays a creation confirmation.
- On failure, keeps the user on the add/picker page with a readable error instead of sending them to settings.
- Revalidates profile picker, settings, and app routes after successful creation.

The existing Supabase RPC enforces active Family membership and the two-additional-profile limit. Verify the active Family subscription fields in Supabase if creation still reports that membership is unavailable. Full production build and end-to-end deployment testing have not been performed in this environment.
