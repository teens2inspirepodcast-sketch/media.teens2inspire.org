-- Add the missing FK-side indexes reported by Supabase's performance advisor.
-- These are additive and preserve all existing rows and constraints.
CREATE INDEX IF NOT EXISTS admin_audit_log_actor_id_idx ON public.admin_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS content_created_by_idx ON public.content(created_by);
CREATE INDEX IF NOT EXISTS content_views_content_id_idx ON public.content_views(content_id);
CREATE INDEX IF NOT EXISTS event_registrations_content_id_idx ON public.event_registrations(content_id);
CREATE INDEX IF NOT EXISTS favorites_content_id_idx ON public.favorites(content_id);
CREATE INDEX IF NOT EXISTS privacy_deletion_log_actor_id_idx ON public.privacy_deletion_log(actor_id);
