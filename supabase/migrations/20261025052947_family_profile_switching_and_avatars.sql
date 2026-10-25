-- Family profile switching and private avatar uploads.
-- Run through the existing Supabase migration process before deploying this UI.

alter table public.profiles add column if not exists avatar_path text;
alter table public.family_profiles add column if not exists avatar_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', false, 3145728, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = false, file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif'];

-- Files are private. The first path segment must be the authenticated owner UUID.
drop policy if exists "profile avatars owner read" on storage.objects;
drop policy if exists "profile avatars owner insert" on storage.objects;
drop policy if exists "profile avatars owner update" on storage.objects;
drop policy if exists "profile avatars owner delete" on storage.objects;
create policy "profile avatars owner read" on storage.objects for select to authenticated
  using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "profile avatars owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "profile avatars owner update" on storage.objects for update to authenticated
  using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "profile avatars owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create or replace function public.set_my_profile_avatar(p_avatar_path text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_avatar_path is null or length(p_avatar_path) > 300
     or p_avatar_path !~ ('^' || v_uid::text || '/owner/[A-Za-z0-9-]+\.(jpg|png|webp|avif)$') then
    raise exception 'Invalid avatar path';
  end if;
  update public.profiles set avatar_path = p_avatar_path, updated_at = now() where id = v_uid;
end; $$;
revoke all on function public.set_my_profile_avatar(text) from public, anon;
grant execute on function public.set_my_profile_avatar(text) to authenticated;

create or replace function public.set_family_profile_avatar(p_profile_id uuid, p_avatar_path text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_avatar_path is null or length(p_avatar_path) > 300
     or p_avatar_path !~ ('^' || v_uid::text || '/' || p_profile_id::text || '/[A-Za-z0-9-]+\.(jpg|png|webp|avif)$') then
    raise exception 'Invalid avatar path';
  end if;
  if not exists (select 1 from public.profiles p where p.id = v_uid and p.membership_tier = 'family'
      and p.membership_status = 'active' and p.stripe_subscription_id is not null
      and (p.membership_period_end is null or p.membership_period_end > now())
      and (p.membership_expires_at is null or p.membership_expires_at > now())) then
    raise exception 'An active Family membership is required';
  end if;
  update public.family_profiles set avatar_path = p_avatar_path, updated_at = now()
    where id = p_profile_id and owner_id = v_uid;
  if not found then raise exception 'Family profile not found'; end if;
end; $$;
revoke all on function public.set_family_profile_avatar(uuid,text) from public, anon;
grant execute on function public.set_family_profile_avatar(uuid,text) to authenticated;
