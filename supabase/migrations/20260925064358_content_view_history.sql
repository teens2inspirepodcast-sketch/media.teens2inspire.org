CREATE TABLE IF NOT EXISTS public.content_views (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, content_id)
);
CREATE INDEX IF NOT EXISTS content_views_recent_idx ON public.content_views(user_id, viewed_at DESC);
ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_views_own_access ON public.content_views;
CREATE POLICY content_views_own_access ON public.content_views FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
REVOKE ALL ON public.content_views FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_views TO authenticated;
