-- Fix Family profile creation for valid active subscriptions whose optional Stripe
-- period metadata is absent. Membership tier/status are maintained by the webhook.
create or replace function public.add_family_profile(p_first_name text, p_display_name text, p_interests text[] default '{}'::text[])
returns public.family_profiles
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_count integer; v_row public.family_profiles;
begin
  if v_uid is null then raise exception 'Sign in is required'; end if;
  if char_length(trim(coalesce(p_first_name,''))) not between 1 and 60 or char_length(trim(coalesce(p_display_name,''))) not between 1 and 40 then
    raise exception 'Enter a profile name';
  end if;
  if not exists (select 1 from public.profiles p where p.id=v_uid and p.membership_tier='family' and p.membership_status='active') then
    raise exception 'An active Family membership is required';
  end if;
  select count(*) into v_count from public.family_profiles where owner_id=v_uid;
  if v_count >= 2 then raise exception 'A Family membership includes three profiles in total'; end if;
  insert into public.family_profiles(owner_id,first_name,display_name,interests)
    values(v_uid,left(trim(p_first_name),60),left(trim(p_display_name),40),coalesce(p_interests,'{}'))
    returning * into v_row;
  return v_row;
end; $$;
revoke all on function public.add_family_profile(text,text,text[]) from public, anon;
grant execute on function public.add_family_profile(text,text,text[]) to authenticated;
