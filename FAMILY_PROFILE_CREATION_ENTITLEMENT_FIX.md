# Family Profile Creation Fix — 2026-10-25

The live `add_family_profile` RPC previously required both a non-null Stripe subscription ID and a future `membership_period_end`, in addition to an active Family tier/status. Those optional metadata fields can be absent even when the account is marked active, causing profile creation to redirect back to the form instead of saving.

The function now validates the authenticated user, active Family tier/status, profile name, and maximum of two additional profiles. It inserts the profile under the signed-in account and retains authenticated-only execute permissions. The migration was applied to the connected Supabase project.
