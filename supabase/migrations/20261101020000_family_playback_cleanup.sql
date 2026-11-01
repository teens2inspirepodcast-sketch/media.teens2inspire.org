-- Remove private history if a Family profile is deleted (safe and limited trigger).
create or replace function public.cleanup_deleted_family_playback_bookmarks()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.media_playback_bookmarks where user_id=old.owner_id and profile_id=old.id;
  return old;
end;
$$;
drop trigger if exists cleanup_deleted_family_playback_bookmarks on public.family_profiles;
create trigger cleanup_deleted_family_playback_bookmarks
  after delete on public.family_profiles for each row
  execute function public.cleanup_deleted_family_playback_bookmarks();
