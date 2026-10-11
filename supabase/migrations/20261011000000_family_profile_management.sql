-- Family profile management: owner-scoped access and server-side entitlement checks.
create table if not exists public.family_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  first_name text not null check (char_length(btrim(first_name)) between 1 and 60),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  interests text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists family_profiles_owner_created_idx
  on public.family_profiles(owner_id, created_at);

alter table public.family_profiles enable row level security;
drop policy if exists "owners read own family profiles" on public.family_profiles;
create policy "owners read own family profiles" on public.family_profiles
  for select to authenticated using (owner_id = (select auth.uid()));
grant select on public.family_profiles to authenticated;
revoke all on public.family_profiles from public, anon, authenticated;

create or replace function public.add_family_profile(
  p_display_name text,
  p_first_name text,
  p_interests text[] default '{}'::text[]
) returns public.family_profiles
language plpgsql security definer set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_result public.family_profiles%rowtype;
  v_count integer;
begin
  if v_uid is null then raise exception 'Sign in required'; end if;
  if char_length(btrim(coalesce(p_first_name, ''))) not between 1 and 60
    or char_length(btrim(coalesce(p_display_name, ''))) not between 1 and 40 then
    raise exception 'Enter a first name and display name';
  end if;

  select p.* into v_profile from public.profiles p where p.id = v_uid for update;
  if not found or v_profile.membership_tier is distinct from 'family' then
    raise exception 'An active Family membership is required';
  end if;

  if not (
    exists (select 1 from public.subscriptions s where s.user_id = v_uid
      and s.status in ('active', 'trialing') and (s.current_period_end is null or s.current_period_end > now()))
    or exists (select 1 from public.memberships m where m.user_id = v_uid
      and m.status = 'active' and (m.expires_at is null or m.expires_at > now()))
    or (v_profile.membership_status = 'active'
      and (v_profile.membership_period_end is null or v_profile.membership_period_end > now())
      and (v_profile.membership_expires_at is null or v_profile.membership_expires_at > now()))
  ) then raise exception 'An active Family membership is required'; end if;

  select count(*) into v_count from public.family_profiles fp where fp.owner_id = v_uid;
  if v_count >= 2 then raise exception 'The Family plan supports three profiles total, including the account owner'; end if;

  insert into public.family_profiles(owner_id, first_name, display_name, interests)
  values (v_uid, btrim(p_first_name), btrim(p_display_name), coalesce(p_interests, '{}'::text[]))
  returning * into v_result;
  return v_result;
end;
$function$;

create or replace function public.remove_family_profile(p_profile_id uuid)
returns void language plpgsql security definer set search_path = ''
as $function$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Sign in required'; end if;
  delete from public.family_profiles where id = p_profile_id and owner_id = v_uid;
  if not found then raise exception 'Family profile not found'; end if;
end;
$function$;

revoke all on function public.add_family_profile(text, text, text[]) from public, anon;
revoke all on function public.remove_family_profile(uuid) from public, anon;
grant execute on function public.add_family_profile(text, text, text[]) to authenticated;
grant execute on function public.remove_family_profile(uuid) to authenticated;
