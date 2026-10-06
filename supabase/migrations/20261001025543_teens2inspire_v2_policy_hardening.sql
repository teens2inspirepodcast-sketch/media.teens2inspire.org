-- Keep authenticated read rules on one policy per action while retaining the
-- anonymous free catalog, and index the new foreign-key lookups.

drop policy if exists "published free content public read" on public.content;
drop policy if exists "active members read member content" on public.content;
drop policy if exists "administrator read all content" on public.content;

create policy "anonymous reads published free content" on public.content
  for select to anon using (status = 'published' and member_only = false);

create policy "authenticated content access" on public.content
  for select to authenticated using (
    public.user_has_role(array['administrator']::text[])
    or (
      status = 'published'
      and (
        member_only = false
        or exists (
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
    )
  );

drop policy if exists "users read own subscriptions" on public.subscriptions;
drop policy if exists "admins read all subscriptions" on public.subscriptions;
create policy "users and admins read subscriptions" on public.subscriptions
  for select to authenticated using (
    (select auth.uid()) = user_id or public.user_has_role(array['administrator']::text[])
  );

drop policy if exists "administrators moderate community posts" on public.community_posts;
drop policy if exists "active members submit pending posts" on public.community_posts;
create policy "members submit pending posts or admins publish" on public.community_posts
  for insert to authenticated with check (
    public.user_has_role(array['administrator']::text[])
    or (
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
    )
  );
create policy "administrators update community posts" on public.community_posts
  for update to authenticated using (public.user_has_role(array['administrator']::text[]))
  with check (public.user_has_role(array['administrator']::text[]));
create policy "administrators delete community posts" on public.community_posts
  for delete to authenticated using (public.user_has_role(array['administrator']::text[]));

drop policy if exists "administrators manage inquiries" on public.member_inquiries;
create policy "members and admins read inquiries" on public.member_inquiries
  for select to authenticated using (
    (select auth.uid()) = user_id or public.user_has_role(array['administrator']::text[])
  );
drop policy if exists "users read and open own inquiries" on public.member_inquiries;
create policy "members and admins open inquiries" on public.member_inquiries
  for insert to authenticated with check (
    (select auth.uid()) = user_id or public.user_has_role(array['administrator']::text[])
  );
create policy "administrators update inquiries" on public.member_inquiries
  for update to authenticated using (public.user_has_role(array['administrator']::text[]))
  with check (public.user_has_role(array['administrator']::text[]));
create policy "administrators delete inquiries" on public.member_inquiries
  for delete to authenticated using (public.user_has_role(array['administrator']::text[]));

drop policy if exists "users reply only to own inquiries" on public.member_inquiry_messages;
drop policy if exists "administrators reply to inquiries" on public.member_inquiry_messages;
create policy "members and admins send inquiry replies" on public.member_inquiry_messages
  for insert to authenticated with check (
    sender_id = (select auth.uid())
    and (
      public.user_has_role(array['administrator']::text[])
      or exists (
        select 1 from public.member_inquiries i
        where i.id = inquiry_id and i.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "members read approved posts and own submissions" on public.community_posts;
create policy "members and admins read community posts" on public.community_posts
  for select to authenticated using (
    status = 'approved' or author_id = (select auth.uid())
    or public.user_has_role(array['administrator']::text[])
  );

drop policy if exists "users and administrators read inquiry messages" on public.member_inquiry_messages;
create policy "members and admins read inquiry messages" on public.member_inquiry_messages
  for select to authenticated using (
    sender_id = (select auth.uid())
    or exists (select 1 from public.member_inquiries i where i.id = inquiry_id and i.user_id = (select auth.uid()))
    or public.user_has_role(array['administrator']::text[])
  );

create policy "stripe events blocked for client roles" on public.stripe_webhook_events
  for all to anon, authenticated using (false) with check (false);

create index if not exists community_posts_author_idx on public.community_posts(author_id);
create index if not exists community_posts_reviewed_by_idx on public.community_posts(reviewed_by);
create index if not exists community_reports_post_id_idx on public.community_reports(post_id);
create index if not exists media_progress_content_id_idx on public.media_progress(content_id);
create index if not exists member_inquiry_messages_sender_id_idx on public.member_inquiry_messages(sender_id);
grant all on public.subscriptions to service_role;
