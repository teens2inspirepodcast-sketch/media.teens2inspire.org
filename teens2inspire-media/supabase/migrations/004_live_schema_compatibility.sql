-- Compatibility repair for the live Supabase schema used by both Teens2Inspire sites.
create extension if not exists pgcrypto;

-- The marketing admin displays account email; keep a synchronized copy on profiles.
alter table public.profiles add column if not exists email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is distinct from u.email;
create or replace function public.sync_profile_email_from_auth_user()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;
drop trigger if exists sync_profile_email_from_auth_user on auth.users;
create trigger sync_profile_email_from_auth_user after insert or update of email on auth.users
for each row execute function public.sync_profile_email_from_auth_user();

-- Marketing pages use these two tables; the live schema had messages but not inquiries/events.
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'contact' check (kind in ('contact','school')),
  name text not null,
  email text not null,
  subject text not null default '',
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  registration_url text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);
create index if not exists events_status_starts_at_idx on public.events(status, starts_at);
create index if not exists inquiries_created_at_idx on public.inquiries(created_at desc);

alter table public.inquiries enable row level security;
alter table public.events enable row level security;
drop policy if exists "public inquiry insert" on public.inquiries;
create policy "public inquiry insert" on public.inquiries for insert to anon, authenticated
  with check (kind in ('contact','school'));
drop policy if exists "admin read inquiries" on public.inquiries;
create policy "admin read inquiries" on public.inquiries for select to authenticated using (public.is_admin());
drop policy if exists "published events visible" on public.events;
create policy "published events visible" on public.events for select to anon, authenticated using (status = 'published');
drop policy if exists "admin events all" on public.events;
create policy "admin events all" on public.events for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- The live schema contains both legacy `active` and current `is_active` school-code flags.
-- Redeem only codes that are active in both, within limits, and linked to an active school.
create or replace function public.redeem_school_code(p_code_hash text, p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare selected_code public.school_codes%rowtype; selected_school public.schools%rowtype;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    return jsonb_build_object('ok', false, 'message', 'Please sign in and try again.');
  end if;
  select * into selected_code from public.school_codes
   where code_hash = p_code_hash and active = true and is_active = true
     and (expires_at is null or expires_at > now()) and uses < max_uses
   for update;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'That code is invalid, expired, or has reached its use limit.');
  end if;
  select * into selected_school from public.schools
   where id = selected_code.school_id and is_active = true;
  if not found then
    return jsonb_build_object('ok', false, 'message', 'This school code is not active.');
  end if;
  update public.school_codes set uses = uses + 1 where id = selected_code.id;
  update public.profiles set membership_tier = 'school', membership_status = 'active',
    membership_type = 'school', school_id = selected_school.id, updated_at = now()
   where id = p_user_id;
  return jsonb_build_object('ok', true, 'school_name', selected_school.name);
end;
$$;
revoke all on function public.redeem_school_code(text, uuid) from public;
grant execute on function public.redeem_school_code(text, uuid) to authenticated;
