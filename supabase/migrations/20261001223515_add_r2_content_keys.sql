-- Cloudflare R2 stores the bytes; Supabase stores the object references and access metadata.
alter table public.content
  add column if not exists r2_media_key text,
  add column if not exists r2_thumbnail_key text;

alter table public.content
  add constraint content_r2_media_key_safe_check
    check (r2_media_key is null or (r2_media_key ~ '^(podcasts|videos|downloads)/[A-Za-z0-9._/-]+$' and r2_media_key !~ '(^|/)\.\.?(/|$)')),
  add constraint content_r2_thumbnail_key_safe_check
    check (r2_thumbnail_key is null or (r2_thumbnail_key ~ '^artwork/[A-Za-z0-9._/-]+$' and r2_thumbnail_key !~ '(^|/)\.\.?(/|$)'));

comment on column public.content.r2_media_key is 'Private Cloudflare R2 object key. The server chooses the configured private bucket.';
comment on column public.content.r2_thumbnail_key is 'Public Cloudflare R2 artwork object key served through the configured custom domain.';
