-- Stripe-backed promo-code support. Safe to apply after migration 008.
alter table public.promo_codes
  add column if not exists stripe_coupon_id text,
  add column if not exists stripe_promotion_code_id text,
  add column if not exists last_redeemed_at timestamptz;

alter table public.promo_codes
  drop constraint if exists promo_codes_duration_months_check;
alter table public.promo_codes
  add constraint promo_codes_duration_months_check
  check (duration_months between 1 and 12);

create index if not exists promo_codes_active_created_idx
  on public.promo_codes (is_active, created_at desc);

create table if not exists public.promo_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_checkout_session_id text unique,
  stripe_subscription_id text,
  redeemed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (promo_code_id, user_id)
);

create index if not exists promo_code_redemptions_code_time_idx
  on public.promo_code_redemptions (promo_code_id, redeemed_at desc);
create index if not exists promo_code_redemptions_user_id_idx
  on public.promo_code_redemptions (user_id);

alter table public.promo_code_redemptions enable row level security;
drop policy if exists "admin read promo redemptions" on public.promo_code_redemptions;
create policy "admin read promo redemptions"
  on public.promo_code_redemptions
  for select to authenticated
  using (public.is_admin());

revoke all on public.promo_code_redemptions from anon, authenticated;
grant select on public.promo_code_redemptions to authenticated;
