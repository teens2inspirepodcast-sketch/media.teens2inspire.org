-- School admin compatibility repair for the current deployed schema.
-- Apply after 002_security_school_access.sql.
create extension if not exists pgcrypto;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'administrator'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.schools add column if not exists contact_email text;
alter table public.schools add column if not exists is_active boolean not null default true;

alter table public.school_codes
  add column if not exists school_name text,
  add column if not exists school_id uuid references public.schools(id) on delete cascade,
  add column if not exists is_active boolean not null default true;
alter table public.school_codes alter column school_name drop not null;

create or replace function public.sync_school_code_school_name()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.school_id is not null then
    select s.name into new.school_name from public.schools s where s.id = new.school_id;
    if new.school_name is null then
      raise exception 'The selected school does not exist';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists school_code_sync_school_name on public.school_codes;
create trigger school_code_sync_school_name
before insert or update of school_id on public.school_codes
for each row execute function public.sync_school_code_school_name();

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'subscribed'
    check (status in ('subscribed','unsubscribed')),
  created_at timestamptz not null default now()
);

alter table public.schools enable row level security;
alter table public.school_codes enable row level security;
alter table public.newsletter_subscribers enable row level security;

drop policy if exists "admin schools all" on public.schools;
create policy "admin schools all" on public.schools for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin school codes all" on public.school_codes;
create policy "admin school codes all" on public.school_codes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin newsletter all" on public.newsletter_subscribers;
create policy "admin newsletter all" on public.newsletter_subscribers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create index if not exists school_codes_school_id_idx on public.school_codes(school_id);
