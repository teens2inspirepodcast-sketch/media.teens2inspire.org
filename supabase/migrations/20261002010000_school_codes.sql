create table if not exists public.school_codes (
  id uuid primary key default gen_random_uuid(), code text not null unique, school_name text not null,
  active boolean not null default true, max_uses integer, uses integer not null default 0,
  expires_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.school_codes enable row level security;
revoke all on public.school_codes from anon, authenticated;
create policy "administrators manage school codes" on public.school_codes for all to authenticated using (public.user_has_role(array['administrator']::text[])) with check (public.user_has_role(array['administrator']::text[]));
grant select, insert, update, delete on public.school_codes to authenticated;

create table if not exists public.school_code_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_code_id uuid not null references public.school_codes(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(user_id)
);
alter table public.school_code_claims enable row level security;
revoke all on public.school_code_claims from anon, authenticated;
create policy "users read own school claim" on public.school_code_claims for select to authenticated using ((select auth.uid()) = user_id);
create policy "administrators manage school claims" on public.school_code_claims for all to authenticated using (public.user_has_role(array['administrator']::text[])) with check (public.user_has_role(array['administrator']::text[]));
grant select on public.school_code_claims to authenticated;
