-- Teens2Inspire V2: close anonymous access to member-only catalog records and
-- add member-owned progress, moderation, support, and billing state.

drop policy if exists "published content public read" on public.content;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  status text not null check (status in ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_status_idx
  on public.subscriptions(user_id, status, current_period_end desc);

create policy "published free content public read"
  on public.content for select to anon, authenticated
  using (status = 'published' and member_only = false);

create policy "active members read member content"
  on public.content for select to authenticated
  using (
    status = 'published'
    and member_only = true
    and (
      exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid())
          and p.membership_status = 'active'
          and (p.membership_period_end is null or p.membership_period_end > now())
          and (p.membership_expires_at is null or p.membership_expires_at > now())
      )
      or exists (
        select 1 from public.memberships m
        where m.user_id = (select auth.uid())
          and m.status = 'active'
          and (m.expires_at is null or m.expires_at > now())
      )
      or exists (
        select 1 from public.subscriptions s
        where s.user_id = (select auth.uid())
          and s.status in ('active', 'trialing')
          and (s.current_period_end is null or s.current_period_end > now())
      )
    )
  );

alter table public.subscriptions enable row level security;
create policy "users read own subscriptions" on public.subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "admins read all subscriptions" on public.subscriptions
  for select to authenticated using (public.user_has_role(array['administrator']::text[]));
grant select on public.subscriptions to authenticated;
revoke insert, update, delete on public.subscriptions from anon, authenticated;

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  livemode boolean not null default false,
  status text not null default 'received' check (status in ('received', 'processing', 'processed', 'failed')),
  processing_started_at timestamptz,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text
);

alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon, authenticated;
grant all on public.stripe_webhook_events to service_role;

create or replace function public.claim_stripe_event(p_event_id text, p_event_type text, p_livemode boolean)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  existing_status text;
  started_at timestamptz;
begin
  insert into public.stripe_webhook_events(event_id, event_type, livemode)
  values (p_event_id, p_event_type, p_livemode)
  on conflict (event_id) do nothing;

  select e.status, e.processing_started_at into existing_status, started_at
  from public.stripe_webhook_events e where e.event_id = p_event_id for update;

  if existing_status = 'processed' then return false; end if;
  if existing_status = 'processing' and started_at > now() - interval '5 minutes' then return false; end if;

  update public.stripe_webhook_events
  set status = 'processing', processing_started_at = now(), last_error = null
  where event_id = p_event_id;
  return true;
end;
$function$;

create or replace function public.finish_stripe_event(p_event_id text, p_success boolean, p_error text default null)
returns void
language sql
security invoker
set search_path = ''
as $function$
  update public.stripe_webhook_events
  set status = case when p_success then 'processed' else 'failed' end,
      processed_at = case when p_success then now() else null end,
      last_error = case when p_success then null else left(p_error, 1000) end
  where event_id = p_event_id;
$function$;

revoke all on function public.claim_stripe_event(text, text, boolean) from public, anon, authenticated;
revoke all on function public.finish_stripe_event(text, boolean, text) from public, anon, authenticated;
grant execute on function public.claim_stripe_event(text, text, boolean) to service_role;
grant execute on function public.finish_stripe_event(text, boolean, text) to service_role;

create table if not exists public.media_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_id uuid not null references public.content(id) on delete cascade,
  position_seconds integer not null default 0 check (position_seconds >= 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

alter table public.media_progress enable row level security;
create policy "users manage own media progress" on public.media_progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.media_progress to authenticated;

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  moderator_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists community_posts_status_created_idx
  on public.community_posts(status, created_at desc);
alter table public.community_posts enable row level security;
create policy "members read approved posts and own submissions" on public.community_posts
  for select to authenticated using (
    status = 'approved'
    or author_id = (select auth.uid())
    or public.user_has_role(array['administrator']::text[])
  );
create policy "active members submit pending posts" on public.community_posts
  for insert to authenticated with check (
    author_id = (select auth.uid()) and status = 'pending' and (
      exists (select 1 from public.profiles p where p.id = (select auth.uid())
        and p.membership_status = 'active'
        and (p.membership_period_end is null or p.membership_period_end > now())
        and (p.membership_expires_at is null or p.membership_expires_at > now()))
      or exists (select 1 from public.memberships m where m.user_id = (select auth.uid())
        and m.status = 'active' and (m.expires_at is null or m.expires_at > now()))
      or exists (select 1 from public.subscriptions s where s.user_id = (select auth.uid())
        and s.status in ('active', 'trialing') and (s.current_period_end is null or s.current_period_end > now()))
    )
  );
create policy "administrators moderate community posts" on public.community_posts
  for all to authenticated using (public.user_has_role(array['administrator']::text[]))
  with check (public.user_has_role(array['administrator']::text[]));
grant select, insert, update, delete on public.community_posts to authenticated;

create table if not exists public.member_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 120),
  status text not null default 'open' check (status in ('open', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.member_inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.member_inquiries(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists member_inquiries_user_created_idx
  on public.member_inquiries(user_id, created_at desc);
create index if not exists member_inquiry_messages_thread_idx
  on public.member_inquiry_messages(inquiry_id, created_at);
alter table public.member_inquiries enable row level security;
alter table public.member_inquiry_messages enable row level security;
create policy "users read and open own inquiries" on public.member_inquiries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "users create own inquiries" on public.member_inquiries
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "administrators manage inquiries" on public.member_inquiries
  for all to authenticated using (public.user_has_role(array['administrator']::text[]))
  with check (public.user_has_role(array['administrator']::text[]));
create policy "users and administrators read inquiry messages" on public.member_inquiry_messages
  for select to authenticated using (
    sender_id = (select auth.uid())
    or exists (select 1 from public.member_inquiries i where i.id = inquiry_id and i.user_id = (select auth.uid()))
    or public.user_has_role(array['administrator']::text[])
  );
create policy "users reply only to own inquiries" on public.member_inquiry_messages
  for insert to authenticated with check (
    sender_id = (select auth.uid())
    and exists (select 1 from public.member_inquiries i where i.id = inquiry_id and i.user_id = (select auth.uid()))
  );
create policy "administrators reply to inquiries" on public.member_inquiry_messages
  for insert to authenticated with check (public.user_has_role(array['administrator']::text[]));
grant select, insert, update on public.member_inquiries to authenticated;
grant select, insert on public.member_inquiry_messages to authenticated;

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved')),
  created_at timestamptz not null default now(),
  unique (reporter_id, post_id)
);

alter table public.community_reports enable row level security;
create policy "members report posts" on public.community_reports
  for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy "administrators review community reports" on public.community_reports
  for select to authenticated using (public.user_has_role(array['administrator']::text[]));
create policy "administrators update community reports" on public.community_reports
  for update to authenticated using (public.user_has_role(array['administrator']::text[]))
  with check (public.user_has_role(array['administrator']::text[]));
grant select, insert, update on public.community_reports to authenticated;

grant select on public.content, public.sections, public.section_content, public.site_images to anon, authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, insert, delete on public.event_registrations to authenticated;
