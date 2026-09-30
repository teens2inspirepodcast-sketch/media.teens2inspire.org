-- Prevent direct object downloads from legacy media buckets. The app validates
-- published content and creates short-lived server-side URLs through its media API.
DROP POLICY IF EXISTS "public media read" ON storage.objects;
DROP POLICY IF EXISTS "t2i public read assets" ON storage.objects;
CREATE POLICY t2i_public_artwork_read ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'artwork');
UPDATE storage.buckets SET public = false WHERE id IN ('media', 'downloads');
