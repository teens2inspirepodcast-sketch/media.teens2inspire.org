drop policy if exists "members and admins read community posts" on public.community_posts;
create policy "members and admins read community posts" on public.community_posts
  for select to authenticated using (
    author_id = (select auth.uid())
    or public.user_has_role(array['administrator']::text[])
    or (
      status = 'approved'
      and (
        exists (select 1 from public.profiles p where p.id = (select auth.uid())
          and p.membership_status = 'active'
          and (p.membership_period_end is null or p.membership_period_end > now())
          and (p.membership_expires_at is null or p.membership_expires_at > now()))
        or exists (select 1 from public.memberships m where m.user_id = (select auth.uid())
          and m.status = 'active' and m.tier::text <> 'free'
          and (m.expires_at is null or m.expires_at > now()))
        or exists (select 1 from public.subscriptions s where s.user_id = (select auth.uid())
          and s.status in ('active', 'trialing') and (s.current_period_end is null or s.current_period_end > now()))
      )
    )
  );

drop policy if exists "members report posts" on public.community_reports;
create policy "active members report approved posts" on public.community_reports
  for insert to authenticated with check (
    reporter_id = (select auth.uid()) and status = 'open'
    and exists (select 1 from public.community_posts c where c.id = post_id and c.status = 'approved')
    and (
      exists (select 1 from public.profiles p where p.id = (select auth.uid())
        and p.membership_status = 'active'
        and (p.membership_period_end is null or p.membership_period_end > now())
        and (p.membership_expires_at is null or p.membership_expires_at > now()))
      or exists (select 1 from public.memberships m where m.user_id = (select auth.uid())
        and m.status = 'active' and m.tier::text <> 'free'
        and (m.expires_at is null or m.expires_at > now()))
      or exists (select 1 from public.subscriptions s where s.user_id = (select auth.uid())
        and s.status in ('active', 'trialing') and (s.current_period_end is null or s.current_period_end > now()))
    )
  );
