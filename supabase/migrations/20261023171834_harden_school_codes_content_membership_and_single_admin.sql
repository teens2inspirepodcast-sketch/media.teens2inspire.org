-- Live repair migration: secure school redemption, private content access, and single admin.
create extension if not exists pgcrypto;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select auth.uid()),'00000000-0000-0000-0000-000000000000'::uuid) = '8e8ba797-0f01-4956-b747-8122b28a777a'::uuid
     and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='administrator'::public.user_role);
$$;
create or replace function public.user_has_role(required_roles text[]) returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) = '8e8ba797-0f01-4956-b747-8122b28a777a'::uuid and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role::text = any(required_roles));
$$;

-- Remove the stale overload that let callers pass a user ID via the old one-argument path.
drop function if exists public.redeem_school_code(text);
create or replace function public.redeem_school_code(p_code_hash text, p_user_id uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_code public.school_codes%rowtype; v_school public.schools%rowtype; v_profile public.profiles%rowtype;
begin
  if (select auth.uid()) is null or (select auth.uid()) <> p_user_id then return jsonb_build_object('ok',false,'message','Please sign in and try again.'); end if;
  select * into v_profile from public.profiles where id=p_user_id for update;
  if not found or v_profile.membership_tier <> 'school' or v_profile.membership_status <> 'pending_school_code' then return jsonb_build_object('ok',false,'message','Choose School membership during account creation before redeeming a school code.'); end if;
  if p_code_hash !~ '^[0-9a-f]{64}$' then return jsonb_build_object('ok',false,'message','That code is invalid or no longer available.'); end if;
  select * into v_code from public.school_codes where code_hash=p_code_hash and active=true and is_active=true and (expires_at is null or expires_at>now()) and uses<max_uses for update;
  if not found then return jsonb_build_object('ok',false,'message','That code is invalid, expired, or has reached its use limit.'); end if;
  select * into v_school from public.schools where id=v_code.school_id and is_active=true;
  if not found then return jsonb_build_object('ok',false,'message','This school code is not active.'); end if;
  update public.school_codes set uses=uses+1 where id=v_code.id and uses<max_uses;
  if not found then return jsonb_build_object('ok',false,'message','That code has reached its use limit.'); end if;
  update public.profiles set membership_tier='school',membership_type='school',membership_status='active',school_id=v_school.id,school_code=null,stripe_customer_id=null,stripe_subscription_id=null,membership_period_end=null,membership_expires_at=null,cancel_at_period_end=false,updated_at=now() where id=p_user_id;
  insert into public.memberships(user_id,tier,status,plan,profile_limit,expires_at,updated_at) values(p_user_id,'free'::public.membership_tier,'active'::public.membership_status,'school',1,null,now()) on conflict(user_id) do update set tier='free'::public.membership_tier,status='active'::public.membership_status,plan='school',profile_limit=1,expires_at=null,updated_at=now();
  return jsonb_build_object('ok',true,'school_name',v_school.name);
end; $$;
revoke all on function public.redeem_school_code(text,uuid) from public,anon; grant execute on function public.redeem_school_code(text,uuid) to authenticated;

-- No anonymous access to the content catalog. Signed-in content requests are gated by active entitlements.
drop policy if exists "public can view published content" on public.content;
drop policy if exists "published content visible to everyone" on public.content;
revoke select on public.content from anon;
