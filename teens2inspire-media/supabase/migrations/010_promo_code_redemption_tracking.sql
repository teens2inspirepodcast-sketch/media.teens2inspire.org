-- Idempotent redemption recording. Only the Stripe webhook service role can call this.
create or replace function public.record_promo_code_redemption(
  p_code_id uuid,
  p_user_id uuid,
  p_checkout_session_id text,
  p_subscription_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserted integer;
begin
  if p_code_id is null or p_user_id is null
     or p_checkout_session_id is null
     or length(trim(p_checkout_session_id)) = 0 then
    raise exception 'Promo redemption requires a code, user, and Stripe checkout session';
  end if;

  perform 1 from public.promo_codes where id = p_code_id for update;
  if not found then raise exception 'Promo code not found'; end if;

  insert into public.promo_code_redemptions (
    promo_code_id, user_id, stripe_checkout_session_id, stripe_subscription_id
  ) values (p_code_id, p_user_id, p_checkout_session_id, p_subscription_id)
  on conflict (stripe_checkout_session_id) do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted > 0 then
    update public.promo_codes
    set uses = uses + 1, last_redeemed_at = now()
    where id = p_code_id;
  end if;
end;
$$;

revoke all on function public.record_promo_code_redemption(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.record_promo_code_redemption(uuid, uuid, text, text)
  to service_role;
