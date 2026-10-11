-- School access codes are stored as SHA-256 hashes; plaintext codes are shown only once in Admin Studio.
create table if not exists public.school_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique check (code_hash ~ '^[a-f0-9]{64}$'),
  school_name text not null check (char_length(school_name) between 2 and 120),
  active boolean not null default true,
  max_uses integer not null default 100000 check (max_uses > 0),
  uses integer not null default 0 check (uses >= 0),
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.school_codes add column if not exists updated_at timestamptz not null default now();
create index if not exists school_codes_active_expiry_idx on public.school_codes(active, expires_at);
alter table public.school_codes enable row level security;
revoke all on public.school_codes from anon, authenticated;
drop policy if exists "administrators manage school codes" on public.school_codes;
drop policy if exists "admin studio manages school codes" on public.school_codes;
create policy "admin studio manages school codes" on public.school_codes for all to authenticated
  using (public.user_has_role(array['administrator']::text[]))
  with check (public.user_has_role(array['administrator']::text[]));
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
drop policy if exists "users read own school claim" on public.school_code_claims;
drop policy if exists "administrators manage school claims" on public.school_code_claims;
create policy "users read own school claim" on public.school_code_claims for select to authenticated using ((select auth.uid()) = user_id);
create policy "administrators manage school claims" on public.school_code_claims for all to authenticated
  using (public.user_has_role(array['administrator']::text[]))
  with check (public.user_has_role(array['administrator']::text[]));
grant select on public.school_code_claims to authenticated;

create or replace function public.validate_school_code(p_code_hash text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.school_codes c
    where c.code_hash = p_code_hash
      and c.active = true
      and c.uses < c.max_uses
      and (c.expires_at is null or c.expires_at > now())
  );
$$;
revoke all on function public.validate_school_code(text) from public, anon;
grant execute on function public.validate_school_code(text) to anon, authenticated;

create or replace function public.redeem_school_code(p_code_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  code_row public.school_codes%rowtype;
  inserted_rows integer;
begin
  if current_user_id is null then return false; end if;
  if exists (select 1 from public.school_code_claims where user_id = current_user_id) then
    return exists (
      select 1 from public.school_code_claims claim
      join public.school_codes code on code.id = claim.school_code_id
      where claim.user_id = current_user_id and code.code_hash = p_code_hash
    );
  end if;
  select * into code_row from public.school_codes
  where code_hash = p_code_hash and active = true and uses < max_uses
    and (expires_at is null or expires_at > now())
  for update;
  if not found then return false; end if;
  insert into public.school_code_claims(user_id, school_code_id)
  values (current_user_id, code_row.id) on conflict (user_id) do nothing;
  get diagnostics inserted_rows = row_count;
  if inserted_rows = 0 then return false; end if;
  update public.school_codes set uses = uses + 1, updated_at = now() where id = code_row.id;
  update public.profiles set membership_tier = 'school', membership_status = 'active',
    membership_type = 'school', membership_expires_at = code_row.expires_at, updated_at = now()
  where id = current_user_id;
  return true;
end;
$$;
revoke all on function public.redeem_school_code(text) from public, anon;
grant execute on function public.redeem_school_code(text) to authenticated;
