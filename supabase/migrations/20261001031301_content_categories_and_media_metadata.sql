-- Typed editorial metadata for V2 without changing existing category labels.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  content_type public.content_type,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists creator_name text check (creator_name is null or char_length(creator_name) <= 120),
  add column if not exists duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 86400),
  add column if not exists reading_time_minutes integer check (reading_time_minutes is null or reading_time_minutes between 1 and 600);

create index if not exists content_category_id_idx on public.content(category_id);
create index if not exists categories_type_active_order_idx on public.categories(content_type, is_active, display_order);

alter table public.categories enable row level security;
create policy "public reads active categories" on public.categories
  for select to anon using (is_active = true);
create policy "members and admins read categories" on public.categories
  for select to authenticated using (is_active = true or public.user_has_role(array['administrator']::text[]));
create policy "admins create categories" on public.categories
  for insert to authenticated with check (public.user_has_role(array['administrator']::text[]));
create policy "admins update categories" on public.categories
  for update to authenticated using (public.user_has_role(array['administrator']::text[]))
  with check (public.user_has_role(array['administrator']::text[]));
create policy "admins delete categories" on public.categories
  for delete to authenticated using (public.user_has_role(array['administrator']::text[]));
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
