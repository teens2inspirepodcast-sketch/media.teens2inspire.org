-- School-code redemption for authenticated accounts.
-- The hash is checked and use-count incremented atomically. No raw code is stored.
create or replace function public.redeem_school_code(p_code_hash text)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_expiry timestamptz;
  v_current_tier text;
  v_current_status text;
begin
  if v_uid is null then raise exception 'Sign in is required'; end if;
  if p_code_hash !~ '^[0-9a-f]{64}$' then raise exception 'That school code is invalid or no longer available'; end if;

  select membership_tier, membership_status into v_current_tier, v_current_status
    from public.profiles where id = v_uid;
  if not found then raise exception 'Profile could not be found'; end if;
  if v_current_status = 'active' and v_current_tier in ('personal','family') then
    raise exception 'An active paid membership is already attached to this account';
  end if;

  update public.school_codes
     set uses = uses + 1
   where code_hash = p_code_hash
     and active
     and (expires_at is null or expires_at > now())
     and uses < max_uses
  returning expires_at into v_expiry;
  if not found then raise exception 'That school code is invalid or no longer available'; end if;

  update public.profiles
     set membership_tier = 'school',
         membership_status = 'active',
         membership_type = 'school',
         membership_expires_at = v_expiry,
         membership_period_end = v_expiry,
         stripe_customer_id = null,
         stripe_subscription_id = null,
         cancel_at_period_end = false
   where id = v_uid;
end;
$function$;
