CREATE TABLE IF NOT EXISTS public.privacy_deletion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  cancellation_effective_at timestamptz,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed')),
  retained_for text NOT NULL DEFAULT 'billing_reconciliation'
);
CREATE INDEX IF NOT EXISTS privacy_deletion_log_requested_idx ON public.privacy_deletion_log(requested_at DESC);
ALTER TABLE public.privacy_deletion_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS privacy_deletion_log_admin_read ON public.privacy_deletion_log;
CREATE POLICY privacy_deletion_log_admin_read ON public.privacy_deletion_log FOR SELECT TO authenticated USING (public.user_has_role(ARRAY['administrator']::text[]));
REVOKE ALL ON public.privacy_deletion_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.privacy_deletion_log TO authenticated;
GRANT INSERT, UPDATE, SELECT ON public.privacy_deletion_log TO service_role;
