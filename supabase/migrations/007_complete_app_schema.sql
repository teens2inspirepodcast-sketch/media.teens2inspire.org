-- Complete the fresh-install schema so it matches the current media app and Stripe webhook.
create extension if not exists pgcrypto;

-- Profiles: fields used by account settings, school access, and entitlement checks.
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists interests text[] not null default '{}'::text[];
alter table public.profiles add column if not exists membership_type text not null default 'standard';
alter table public.profiles add column if not exists membership_expires_at timestamptz;
alter table public.profiles add column if not exists school_id uuid references public.schools(id) on delete set null;
alter table public.profiles add column if not exists school_code text;
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists accepted_terms_at timestamptz;
alter table public.profiles add column if not exists membership_period_end timestamptz;
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists cancel_at_period_end boolean not null default false;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- Content metadata and private R2 object keys.
alter table public.content add column if not exists recipe_ingredients text;
alter table public.content add column if not exists recipe_instructions text;
alter table public.content add column if not exists recipe_prep_time text;
alter table public.content add column if not exists recipe_cook_time text;
alter table public.content add column if not exists recipe_servings text;
alter table public.content add column if not exists resource_category text;
alter table public.content add column if not exists event_starts_at timestamptz;
alter table public.content add column if not exists event_ends_at timestamptz;
alter table public.content add column if not exists event_location text;
alter table public.content add column if not exists registration_url text;
alter table public.content add column if not exists body text;
alter table public.content add column if not exists location text;
alter table public.content add column if not exists address text;
alter table public.content add column if not exists organizer text;
alter table public.content add column if not exists capacity integer;
alter table public.content add column if not exists ticket_info text;
alter table public.content add column if not exists starts_at timestamptz;
alter table public.content add column if not exists ends_at timestamptz;
alter table public.content add column if not exists short_description text;
alter table public.content add column if not exists category_id uuid;
alter table public.content add column if not exists creator_name text;
alter table public.content add column if not exists duration_seconds integer;
alter table public.content add column if not exists reading_time_minutes integer;
alter table public.content add column if not exists r2_media_key text;
alter table public.content add column if not exists r2_thumbnail_key text;

-- Sections: bridge the old title/is_published/sort_order schema to the current admin UI.
alter table public.sections add column if not exists name text;
alter table public.sections add column if not exists artwork_url text;
alter table public.sections add column if not exists background_image_url text;
alter table public.sections add column if not exists section_type text not null default 'collection';
alter table public.sections add column if not exists display_order integer not null default 0;
alter table public.sections add column if not exists is_active boolean not null default true;
alter table public.sections add column if not exists show_on_homepage boolean not null default true;
alter table public.sections add column if not exists show_in_navigation boolean not null default false;
alter table public.sections add column if not exists card_style text not null default 'poster';
alter table public.sections add column if not exists max_items integer not null default 6;
alter table public.sections add column if not exists see_all_label text not null default 'See all';
alter table public.sections add column if not exists updated_at timestamptz not null default now();
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='sections' and column_name='title') then
    execute 'update public.sections set name = title where name is null and title is not null';
    execute 'alter table public.sections alter column title drop not null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='sections' and column_name='sort_order') then
    execute 'update public.sections set display_order = sort_order where display_order = 0 and sort_order is not null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='sections' and column_name='is_published') then
    execute 'update public.sections set is_active = is_published where is_published is not null and is_active is distinct from is_published';
  end if;
end $$;
alter table public.sections alter column name set not null;

alter table public.section_content add column if not exists display_order integer not null default 0;
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='section_content' and column_name='sort_order') then
    execute 'update public.section_content set display_order = sort_order where display_order = 0 and sort_order is not null';
  end if;
end $$;

-- Categories are used by the content metadata relationship in the app.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  content_type public.content_type,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname='content_category_id_fkey' and conrelid='public.content'::regclass) then
    alter table public.content add constraint content_category_id_fkey foreign key (category_id) references public.categories(id) on delete set null;
  end if;
end $$;

-- Stripe billing tables required by the deployed Supabase Edge Functions.
do $$ begin create type public.membership_tier as enum ('free','member'); exception when duplicate_object then null; end $$;
do $$ begin create type public.membership_status as enum ('active','inactive','cancelled','expired'); exception when duplicate_object then null; end $$;
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  tier public.membership_tier not null default 'free',
  status public.membership_status not null default 'inactive',
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  school_id uuid,
  plan text,
  profile_limit integer not null default 1,
  school_code text
);
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  livemode boolean not null default false,
  status text not null default 'processing',
  processing_started_at timestamptz,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text
);

-- Current user progress table, retained separately from the legacy watch_progress table.
create table if not exists public.media_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_id uuid not null references public.content(id) on delete cascade,
  position_seconds integer not null default 0,
  duration_seconds integer,
  updated_at timestamptz not null default now(),
  primary key (user_id, content_id)
);
create table if not exists public.event_registrations (
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_id uuid not null references public.content(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

-- Safe default RLS for the new tables. Billing writes are service-role/webhook only.
alter table public.categories enable row level security;
drop policy if exists "active categories visible" on public.categories;
create policy "active categories visible" on public.categories for select to anon, authenticated using (is_active = true);
drop policy if exists "admin categories all" on public.categories;
create policy "admin categories all" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.memberships enable row level security;
drop policy if exists "memberships read own" on public.memberships;
create policy "memberships read own" on public.memberships for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions read own or admin" on public.subscriptions;
create policy "subscriptions read own or admin" on public.subscriptions for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
alter table public.stripe_webhook_events enable row level security;
-- No client policies for webhook-event data: only the service role can access it.
alter table public.media_progress enable row level security;
drop policy if exists "users manage own media progress" on public.media_progress;
create policy "users manage own media progress" on public.media_progress for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter table public.event_registrations enable row level security;
drop policy if exists "users read own event registrations" on public.event_registrations;
create policy "users read own event registrations" on public.event_registrations for select to authenticated using (user_id = (select auth.uid()));

-- The new app reads sections by is_active, and section membership by display_order.
drop policy if exists "published sections visible" on public.sections;
drop policy if exists "sections active visible" on public.sections;
create policy "sections active visible" on public.sections for select to authenticated using (is_active = true);
drop policy if exists "published section content visible" on public.section_content;
drop policy if exists "active section content visible" on public.section_content;
create policy "active section content visible" on public.section_content for select to authenticated using (
  exists (select 1 from public.sections s where s.id = section_id and s.is_active = true)
);

-- Member-only media is only visible to active, unexpired memberships. Admin policy remains separate.
drop policy if exists "published content visible" on public.content;
drop policy if exists "anonymous reads published free content" on public.content;
drop policy if exists "authenticated content access" on public.content;
create policy "anonymous reads published free content" on public.content for select to anon
  using (status = 'published' and member_only = false);
create policy "authenticated content access" on public.content for select to authenticated using (
  public.is_admin() or (
    status = 'published' and (
      member_only = false or
      exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.membership_status = 'active'
        and (p.membership_period_end is null or p.membership_period_end > now())
        and (p.membership_expires_at is null or p.membership_expires_at > now())) or
      exists (select 1 from public.memberships m where m.user_id = (select auth.uid()) and m.status = 'active'
        and m.tier <> 'free' and (m.expires_at is null or m.expires_at > now())) or
      exists (select 1 from public.subscriptions s where s.user_id = (select auth.uid()) and s.status in ('active','trialing')
        and (s.current_period_end is null or s.current_period_end > now())
    )
  )
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists stripe_webhook_events_status_idx on public.stripe_webhook_events(status, received_at desc);
create index if not exists media_progress_user_updated_idx on public.media_progress(user_id, updated_at desc);
