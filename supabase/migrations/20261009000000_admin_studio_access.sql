-- Ensure editorial shelves and their assignments exist for the Admin Studio.
create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  section_type text not null default 'content',
  display_order integer not null default 0,
  is_active boolean not null default true,
  show_on_homepage boolean not null default true,
  show_in_navigation boolean not null default false,
  see_all_label text not null default 'See all',
  max_items integer not null default 12 check (max_items between 1 and 100),
  card_style text not null default 'standard',
  artwork_url text,
  background_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.section_content (
  section_id uuid not null references public.sections(id) on delete cascade,
  content_id uuid not null references public.content(id) on delete cascade,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (section_id, content_id)
);
create index if not exists section_content_order_idx on public.section_content(section_id, display_order);

create table if not exists public.mailing_list (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text,
  display_name text,
  status text default 'subscribed',
  subscribed boolean not null default true,
  created_at timestamptz not null default now()
);

-- Admin Studio access policies. Review against the live schema before applying.
-- These policies keep public reads narrow and reserve management for administrators.

alter table if exists public.sections enable row level security;
drop policy if exists "admin studio reads all sections" on public.sections;
drop policy if exists "admin studio manages sections" on public.sections;
drop policy if exists "public reads active sections" on public.sections;
create policy "admin studio reads all sections" on public.sections
  for select to authenticated using (public.user_has_role(array['administrator']::text[]));
create policy "admin studio manages sections" on public.sections
  for all to authenticated using (public.user_has_role(array['administrator']::text[]))
  with check (public.user_has_role(array['administrator']::text[]));
create policy "public reads active sections" on public.sections
  for select to anon, authenticated using (is_active = true);
grant select on public.sections to anon, authenticated;
grant insert, update, delete on public.sections to authenticated;


alter table if exists public.section_content enable row level security;
drop policy if exists "admin studio manages section assignments" on public.section_content;
drop policy if exists "public reads visible section assignments" on public.section_content;
create policy "admin studio manages section assignments" on public.section_content
  for all to authenticated using (public.user_has_role(array['administrator']::text[]))
  with check (public.user_has_role(array['administrator']::text[]));
create policy "public reads visible section assignments" on public.section_content
  for select to anon, authenticated using (exists (
    select 1 from public.sections s join public.content c on c.id = section_content.content_id
    where s.id = section_content.section_id and s.is_active = true and c.status = 'published'
      and (c.member_only = false or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.membership_status = 'active'))
  ));
grant select on public.section_content to anon, authenticated;
grant insert, update, delete on public.section_content to authenticated;

alter table if exists public.mailing_list enable row level security;
drop policy if exists "admin studio reads mailing list" on public.mailing_list;
drop policy if exists "admin studio updates mailing list" on public.mailing_list;
drop policy if exists "public can subscribe to mailing list" on public.mailing_list;
create policy "admin studio reads mailing list" on public.mailing_list
  for select to authenticated using (public.user_has_role(array['administrator']::text[]));
create policy "admin studio updates mailing list" on public.mailing_list
  for update to authenticated using (public.user_has_role(array['administrator']::text[]))
  with check (public.user_has_role(array['administrator']::text[]));
create policy "public can subscribe to mailing list" on public.mailing_list
  for insert to anon, authenticated
  with check (
    char_length(email) between 5 and 254
    and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  );
grant insert on public.mailing_list to anon, authenticated;
grant select, update on public.mailing_list to authenticated;

-- Admins can view member profile metadata; members still manage only their own profile.
drop policy if exists "admin studio reads member profiles" on public.profiles;
create policy "admin studio reads member profiles" on public.profiles
  for select to authenticated using (public.user_has_role(array['administrator']::text[]));
