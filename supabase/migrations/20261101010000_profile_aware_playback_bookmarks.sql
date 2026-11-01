-- Added to the existing Teens2Inspire Supabase project on 2026-11-01.
-- Each authenticated account / Family profile gets independent resume positions.
-- This migration does not modify Stripe, R2, or existing membership functions.
create table if not exists public.media_playback_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null,
  content_id uuid not null references public.content(id) on delete cascade,
  position_seconds numeric(12,2) not null default 0 check (position_seconds >= 0),
  duration_seconds numeric(12,2) not null default 0 check (duration_seconds >= 0),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key(user_id,profile_id,content_id)
);
create index if not exists media_playback_bookmarks_recent_idx on public.media_playback_bookmarks(user_id,profile_id,updated_at desc);
alter table public.media_playback_bookmarks enable row level security;
drop policy if exists "viewer read own bookmarks" on public.media_playback_bookmarks;
drop policy if exists "viewer insert own bookmarks" on public.media_playback_bookmarks;
drop policy if exists "viewer update own bookmarks" on public.media_playback_bookmarks;
drop policy if exists "viewer delete own bookmarks" on public.media_playback_bookmarks;
create policy "viewer read own bookmarks" on public.media_playback_bookmarks for select to authenticated using (
  user_id=(select auth.uid()) and (profile_id=user_id or exists(select 1 from public.family_profiles f where f.id=profile_id and f.owner_id=user_id))
);
create policy "viewer insert own bookmarks" on public.media_playback_bookmarks for insert to authenticated with check (
  user_id=(select auth.uid()) and (profile_id=user_id or exists(select 1 from public.family_profiles f where f.id=profile_id and f.owner_id=user_id))
);
create policy "viewer update own bookmarks" on public.media_playback_bookmarks for update to authenticated using (
  user_id=(select auth.uid()) and (profile_id=user_id or exists(select 1 from public.family_profiles f where f.id=profile_id and f.owner_id=user_id))
) with check (
  user_id=(select auth.uid()) and (profile_id=user_id or exists(select 1 from public.family_profiles f where f.id=profile_id and f.owner_id=user_id))
);
create policy "viewer delete own bookmarks" on public.media_playback_bookmarks for delete to authenticated using (
  user_id=(select auth.uid()) and (profile_id=user_id or exists(select 1 from public.family_profiles f where f.id=profile_id and f.owner_id=user_id))
);
grant select,insert,update,delete on public.media_playback_bookmarks to authenticated;
insert into public.media_playback_bookmarks(user_id,profile_id,content_id,position_seconds,duration_seconds,completed,updated_at)
select user_id,user_id,content_id,greatest(position_seconds,0)::numeric(12,2),greatest(coalesce(duration_seconds,0),0)::numeric(12,2),
  coalesce(duration_seconds,0)>10 and position_seconds>=duration_seconds-5,coalesce(updated_at,now())
from public.media_progress
on conflict(user_id,profile_id,content_id) do nothing;
