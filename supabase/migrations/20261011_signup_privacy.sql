-- Only add newly created accounts to the mailing list when the user explicitly opted in.
-- Existing mailing-list rows are intentionally not modified by this migration.
create or replace function public.add_user_to_mailing_list()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if coalesce(new.raw_user_meta_data->>'newsletter_opt_in', 'false') = 'true' then
    insert into public.mailing_list (id, email, first_name, display_name)
    values (
      gen_random_uuid(),
      new.email,
      left(new.raw_user_meta_data->>'first_name', 60),
      left(new.raw_user_meta_data->>'display_name', 60)
    )
    on conflict (email) do nothing;
  end if;
  return new;
end;
$function$;
