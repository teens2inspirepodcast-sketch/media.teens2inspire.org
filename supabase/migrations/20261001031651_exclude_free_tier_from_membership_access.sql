-- The legacy signup trigger creates a free/active membership row for every new account.
-- Exclude that row explicitly anywhere paid-member access is checked.

drop policy if exists "authenticated content access" on public.content;
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
            and m.tier::text <> 'free'
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

drop policy if exists "members submit pending posts or admins publish" on public.community_posts;
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
          and m.status = 'active' and m.tier::text <> 'free'
          and (m.expires_at is null or m.expires_at > now()))
        or exists (select 1 from public.subscriptions s where s.user_id = (select auth.uid())
          and s.status in ('active', 'trialing') and (s.current_period_end is null or s.current_period_end > now()))
      )
    )
  );
