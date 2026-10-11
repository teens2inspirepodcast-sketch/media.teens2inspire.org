-- Enforce event capacity in one transaction. The row lock prevents concurrent signups
-- from exceeding capacity, and the function checks the same verified membership state
-- used to protect member-only content.
create or replace function public.register_for_event(p_event_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_user_id uuid := (select auth.uid());
  event_row record;
  registered_count bigint;
begin
  if current_user_id is null then return 'unauthenticated'; end if;

  select c.id, c.capacity, c.event_starts_at, c.member_only, c.status
    into event_row
    from public.content c
    where c.id = p_event_id and c.type = 'event'::public.content_type
    for update;

  if not found or event_row.status <> 'published' then return 'not_found'; end if;
  if event_row.event_starts_at is not null and event_row.event_starts_at <= now() then return 'closed'; end if;
  if event_row.member_only and not (
    exists (
      select 1 from public.profiles p where p.id = current_user_id
        and p.membership_status = 'active'
        and (p.membership_period_end is null or p.membership_period_end > now())
        and (p.membership_expires_at is null or p.membership_expires_at > now())
    ) or exists (
      select 1 from public.memberships m where m.user_id = current_user_id
        and m.status = 'active' and m.tier::text <> 'free'
        and (m.expires_at is null or m.expires_at > now())
    ) or exists (
      select 1 from public.subscriptions s where s.user_id = current_user_id
        and s.status in ('active', 'trialing')
        and (s.current_period_end is null or s.current_period_end > now())
    )
  ) then return 'membership_required'; end if;

  if exists (select 1 from public.event_registrations r where r.content_id = p_event_id and r.user_id = current_user_id) then
    return 'already_registered';
  end if;

  if event_row.capacity is not null then
    select count(*) into registered_count from public.event_registrations r where r.content_id = p_event_id;
    if registered_count >= event_row.capacity then return 'full'; end if;
  end if;

  insert into public.event_registrations(user_id, content_id) values (current_user_id, p_event_id);
  return 'registered';
end;
$function$;

revoke all on function public.register_for_event(uuid) from public, anon;
grant execute on function public.register_for_event(uuid) to authenticated;
revoke insert on public.event_registrations from anon, authenticated;
