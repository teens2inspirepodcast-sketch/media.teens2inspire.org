-- Security hardening and school-code support. Apply after 001_initial.sql.
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.school_codes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  code_hash text not null unique,
  is_active boolean not null default true,
  expires_at timestamptz,
  max_uses integer not null default 1 check (max_uses > 0),
  uses integer not null default 0 check (uses >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.family_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_profile_name_length check (char_length(display_name) between 1 and 40)
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'subscribed' check (status in ('subscribed','unsubscribed')),
  created_at timestamptz not null default now()
);

alter table public.schools enable row level security;
alter table public.school_codes enable row level security;
alter table public.family_profiles enable row level security;
alter table public.newsletter_subscribers enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'administrator');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create policy "admin read profiles" on public.profiles for select to authenticated
  using (public.is_admin());
create policy "admin read inquiries" on public.inquiries for select to authenticated
  using (public.is_admin());
create policy "admin schools all" on public.schools for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy "admin school codes all" on public.school_codes for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy "family profiles owner read" on public.family_profiles for select to authenticated using (owner_user_id = auth.uid());
create policy "family profiles owner insert" on public.family_profiles for insert to authenticated with check (
  owner_user_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.membership_tier = 'family' and p.membership_status = 'active')
  and (select count(*) from public.family_profiles fp where fp.owner_user_id = auth.uid()) < 2
);
create policy "family profiles owner update" on public.family_profiles for update to authenticated
  using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "family profiles owner delete" on public.family_profiles for delete to authenticated using (owner_user_id = auth.uid());
create policy "admin newsletter all" on public.newsletter_subscribers for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- The caller can redeem only for their own authenticated account. Hashes are stored, never plaintext codes.
create or replace function public.redeem_school_code(p_code_hash text, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_code public.school_codes%rowtype;
  selected_school public.schools%rowtype;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    return jsonb_build_object('ok', false, 'message', 'Please sign in and try again.');
  end if;

  select * into selected_code from public.school_codes
    where code_hash = p_code_hash and is_active = true
      and (expires_at is null or expires_at > now()) and uses < max_uses
    for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'That code is invalid, expired, or has reached its use limit.');
  end if;

  select * into selected_school from public.schools where id = selected_code.school_id and is_active = true;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'This school code is not active.');
  end if;

  update public.school_codes set uses = uses + 1 where id = selected_code.id;
  update public.profiles set membership_tier = 'school', membership_status = 'active', updated_at = now() where id = p_user_id;
  return jsonb_build_object('ok', true, 'school_name', selected_school.name);
end;
$$;
revoke all on function public.redeem_school_code(text, uuid) from public;
grant execute on function public.redeem_school_code(text, uuid) to authenticated;

-- Users cannot edit role, billing, or membership fields directly: there is deliberately no profile UPDATE policy.
-- Do not create public Storage buckets for member-only media. Use a verified provider's short-lived signed playback URLs.

comment on column public.content.media_url is 'Deprecated: do not store permanent media URLs here. Use media_provider_id and the verified provider signed-playback adapter.';

create policy "admin section content all" on public.section_content for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
