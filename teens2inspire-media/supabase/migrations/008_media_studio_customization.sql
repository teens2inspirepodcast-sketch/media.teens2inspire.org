-- Teens2Inspire media studio additions. Apply after migrations 001–007.
-- Adds personal profile accents and a structured promo/gift code registry.
alter table public.profiles add column if not exists profile_color text not null default '#B85679';

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  code_type text not null check (code_type in ('discount','gift_card')),
  membership_plan text not null check (membership_plan in ('personal','family')),
  duration_months integer not null default 1 check (duration_months between 1 and 24),
  discount_percent integer check (discount_percent between 1 and 100),
  max_uses integer not null default 1 check (max_uses between 1 and 100000),
  uses integer not null default 0 check (uses >= 0),
  expires_at timestamptz,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.promo_codes enable row level security;
drop policy if exists "admin manage promo codes" on public.promo_codes;
create policy "admin manage promo codes" on public.promo_codes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create index if not exists promo_codes_active_created_idx on public.promo_codes(is_active, created_at desc);

create or replace function public.update_my_profile_settings(p_display_name text, p_profile_color text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(trim(coalesce(p_display_name,''))) < 1 or char_length(trim(p_display_name)) > 80 then raise exception 'Name must be 1–80 characters'; end if;
  if p_profile_color !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'Invalid profile color'; end if;
  update public.profiles set display_name = trim(p_display_name), profile_color = upper(p_profile_color), updated_at = now() where id = auth.uid();
end; $$;
revoke all on function public.update_my_profile_settings(text,text) from public;
grant execute on function public.update_my_profile_settings(text,text) to authenticated;
alter table public.content add column if not exists external_url text;
