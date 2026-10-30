-- Additive Teens2Inspire app language and subtitle support.
-- Existing Stripe, R2, memberships, and auth functions are unchanged.
create table if not exists public.user_app_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'en' check (language in ('en','he','yi')),
  updated_at timestamptz not null default now()
);
alter table public.user_app_preferences enable row level security;
drop policy if exists "users read app language" on public.user_app_preferences;
drop policy if exists "users insert app language" on public.user_app_preferences;
drop policy if exists "users update app language" on public.user_app_preferences;
create policy "users read app language" on public.user_app_preferences for select to authenticated using (user_id=(select auth.uid()));
create policy "users insert app language" on public.user_app_preferences for insert to authenticated with check (user_id=(select auth.uid()));
create policy "users update app language" on public.user_app_preferences for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
grant select,insert,update on public.user_app_preferences to authenticated;
alter table public.content add column if not exists caption_path text;
alter table public.content drop constraint if exists content_caption_path_safe;
alter table public.content add constraint content_caption_path_safe check (caption_path is null or caption_path ~ '^captions/[a-f0-9-]{36}\.vtt$');
alter table public.content add column if not exists caption_language text not null default 'en';
alter table public.content drop constraint if exists content_caption_language_supported;
alter table public.content add constraint content_caption_language_supported check (caption_language in ('en','he','yi'));
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('media-captions','media-captions',false,5242880,array['text/vtt'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['text/vtt'];
drop policy if exists "captions admin upload" on storage.objects;
drop policy if exists "captions admin update" on storage.objects;
drop policy if exists "captions admin delete" on storage.objects;
drop policy if exists "captions authorized read" on storage.objects;
create policy "captions admin upload" on storage.objects for insert to authenticated
 with check (bucket_id='media-captions' and name ~ '^captions/[a-f0-9-]{36}\.vtt$' and public.is_admin());
create policy "captions admin update" on storage.objects for update to authenticated
 using (bucket_id='media-captions' and public.is_admin())
 with check (bucket_id='media-captions' and public.is_admin());
create policy "captions admin delete" on storage.objects for delete to authenticated
 using (bucket_id='media-captions' and public.is_admin());
create policy "captions authorized read" on storage.objects for select to authenticated
 using (bucket_id='media-captions' and (public.is_admin() or exists (
   select 1 from public.content c where c.caption_path=storage.objects.name and c.status='published'
   and (not c.member_only or exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.membership_status='active'))
 )));
create table if not exists public.content_translations (
 content_id uuid not null references public.content(id) on delete cascade,
 language text not null check (language in ('he','yi')),
 title text not null check (char_length(title) between 1 and 140),
 description text check (description is null or char_length(description)<=5000),
 body text,
 updated_at timestamptz not null default now(),
 primary key(content_id,language)
);
alter table public.content_translations enable row level security;
drop policy if exists "read published content translations" on public.content_translations;
drop policy if exists "admin manage content translations" on public.content_translations;
create policy "read published content translations" on public.content_translations for select to authenticated
 using (exists(select 1 from public.content c where c.id=content_id and c.status='published'));
create policy "admin manage content translations" on public.content_translations for all to authenticated
 using (public.is_admin()) with check (public.is_admin());
grant select,insert,update,delete on public.content_translations to authenticated;
