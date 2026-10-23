-- Self-service account deletion. The function can only delete the currently authenticated user.
-- Apply through Supabase SQL editor/migrations before enabling the account deletion control.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  delete from auth.users where id = current_user_id;
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
