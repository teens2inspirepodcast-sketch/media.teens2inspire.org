-- Align family_profiles with the media app's current schema, including older installs.
create table if not exists public.family_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  first_name text not null,
  display_name text not null,
  interests text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.family_profiles add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.family_profiles add column if not exists first_name text;
alter table public.family_profiles add column if not exists interests text[] not null default '{}'::text[];
alter table public.family_profiles add column if not exists updated_at timestamptz not null default now();

do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='family_profiles' and column_name='owner_user_id') then
    execute 'update public.family_profiles set owner_id = owner_user_id where owner_id is null';
    execute 'alter table public.family_profiles alter column owner_user_id drop not null';
  end if;
end $$;
update public.family_profiles set first_name = display_name where first_name is null or btrim(first_name) = '';
alter table public.family_profiles alter column owner_id set not null;
alter table public.family_profiles alter column first_name set not null;
alter table public.family_profiles alter column interests set default '{}'::text[];
alter table public.family_profiles alter column interests set not null;

alter table public.family_profiles enable row level security;
drop policy if exists "family_profiles_read_own" on public.family_profiles;
drop policy if exists "family profiles owner read" on public.family_profiles;
drop policy if exists "family profiles owner insert" on public.family_profiles;
drop policy if exists "family profiles owner update" on public.family_profiles;
drop policy if exists "family profiles owner delete" on public.family_profiles;
create policy "family_profiles_read_own" on public.family_profiles for select to authenticated using (owner_id = (select auth.uid()));

-- Only these guarded functions may mutate family profiles. They validate ownership,
-- paid active Family entitlement, and the maximum of two additional profiles.
create or replace function public.add_family_profile(p_first_name text, p_display_name text, p_interests text[] default '{}'::text[])
returns public.family_profiles
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_count integer; v_row public.family_profiles;
begin
  if v_uid is null then raise exception 'Sign in is required'; end if;
  if char_length(trim(coalesce(p_first_name,''))) not between 1 and 60 or char_length(trim(coalesce(p_display_name,''))) not between 1 and 40 then
    raise exception 'Enter a first name and display name';
  end if;
  if not exists (
    select 1 from public.profiles p where p.id=v_uid and p.membership_tier='family'
      and p.membership_status='active' and p.stripe_subscription_id is not null
      and p.membership_period_end > now()
  ) then raise exception 'An active Family membership is required'; end if;
  select count(*) into v_count from public.family_profiles where owner_id=v_uid;
  if v_count >= 2 then raise exception 'A Family membership includes three profiles in total'; end if;
  insert into public.family_profiles(owner_id,first_name,display_name,interests)
    values(v_uid,left(trim(p_first_name),60),left(trim(p_display_name),40),coalesce(p_interests,'{}'))
    returning * into v_row;
  return v_row;
end; $$;

create or replace function public.remove_family_profile(p_profile_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in is required'; end if;
  delete from public.family_profiles f where f.id=p_profile_id and f.owner_id=(select auth.uid());
  if not found then raise exception 'Profile not found'; end if;
end; $$;

revoke all on function public.add_family_profile(text,text,text[]) from public, anon;
grant execute on function public.add_family_profile(text,text,text[]) to authenticated;
revoke all on function public.remove_family_profile(uuid) from public, anon;
grant execute on function public.remove_family_profile(uuid) to authenticated;
