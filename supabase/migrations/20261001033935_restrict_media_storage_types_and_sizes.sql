-- Existing storage buckets stay in place; constrain accepted payloads and sizes.

update storage.buckets set
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
where id = 'artwork';

update storage.buckets set
  file_size_limit = 524288000,
  allowed_mime_types = array['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/x-m4a']::text[]
where id = 'media';

update storage.buckets set
  file_size_limit = 52428800,
  allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
where id = 'downloads';

update storage.buckets set
  file_size_limit = 1073741824,
  allowed_mime_types = array['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v']::text[]
where id = 'video-assets';

update storage.buckets set
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
where id = 'profile-photos';
