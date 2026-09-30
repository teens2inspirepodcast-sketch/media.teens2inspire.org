-- Database-backed homepage sections and auditable Studio mutations.
CREATE TABLE IF NOT EXISTS public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text CHECK (description IS NULL OR char_length(description) <= 2000),
  artwork_url text,
  background_image_url text,
  section_type text NOT NULL DEFAULT 'collection' CHECK (section_type IN ('collection','editorial','seasonal','featured')),
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  is_active boolean NOT NULL DEFAULT true,
  show_on_homepage boolean NOT NULL DEFAULT true,
  show_in_navigation boolean NOT NULL DEFAULT false,
  card_style text NOT NULL DEFAULT 'poster' CHECK (card_style IN ('poster','landscape','compact')),
  max_items integer NOT NULL DEFAULT 6 CHECK (max_items BETWEEN 1 AND 24),
  see_all_label text NOT NULL DEFAULT 'See all' CHECK (char_length(see_all_label) BETWEEN 1 AND 32),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.section_content (
  section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (section_id, content_id)
);
CREATE INDEX IF NOT EXISTS sections_homepage_order_idx ON public.sections(show_on_homepage, is_active, display_order);
CREATE INDEX IF NOT EXISTS section_content_order_idx ON public.section_content(section_id, display_order);
CREATE INDEX IF NOT EXISTS section_content_content_idx ON public.section_content(content_id);
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sections_public_read ON public.sections;
CREATE POLICY sections_public_read ON public.sections FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS sections_admin_manage ON public.sections;
CREATE POLICY sections_admin_manage ON public.sections FOR ALL TO authenticated USING (public.user_has_role(ARRAY['administrator']::text[])) WITH CHECK (public.user_has_role(ARRAY['administrator']::text[]));
DROP POLICY IF EXISTS section_content_public_read ON public.section_content;
CREATE POLICY section_content_public_read ON public.section_content FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.sections s JOIN public.content c ON c.id = section_content.content_id WHERE s.id = section_content.section_id AND s.is_active = true AND c.status = 'published'));
DROP POLICY IF EXISTS section_content_admin_manage ON public.section_content;
CREATE POLICY section_content_admin_manage ON public.section_content FOR ALL TO authenticated USING (public.user_has_role(ARRAY['administrator']::text[])) WITH CHECK (public.user_has_role(ARRAY['administrator']::text[]));
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (char_length(action) BETWEEN 1 AND 80),
  entity_type text NOT NULL CHECK (char_length(entity_type) BETWEEN 1 AND 80),
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_entity_idx ON public.admin_audit_log(entity_type, entity_id, created_at DESC);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_audit_log_admin_read ON public.admin_audit_log;
CREATE POLICY admin_audit_log_admin_read ON public.admin_audit_log FOR SELECT TO authenticated USING (public.user_has_role(ARRAY['administrator']::text[]));
REVOKE INSERT, UPDATE, DELETE ON public.admin_audit_log FROM anon, authenticated;
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.admin_audit_log_id_seq TO service_role;
