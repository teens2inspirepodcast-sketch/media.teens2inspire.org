-- Teens2Inspire security hardening applied to the connected Supabase project.
-- Trigger functions are invoked by their triggers, not through PostgREST RPC.
do $$ begin
  if to_regprocedure('public.sync_profile_email_from_auth_user()') is not null then
    execute 'revoke all on function public.sync_profile_email_from_auth_user() from public, anon, authenticated';
  end if;
  if to_regprocedure('public.sync_school_code_school_name()') is not null then
    execute 'revoke all on function public.sync_school_code_school_name() from public, anon, authenticated';
  end if;
  if to_regprocedure('public.t2i_protect_profile_security_fields()') is not null then
    execute 'revoke all on function public.t2i_protect_profile_security_fields() from public, anon, authenticated';
  end if;
  if to_regprocedure('public.redeem_school_code(text)') is not null then
    execute 'revoke all on function public.redeem_school_code(text) from public, anon, authenticated';
  end if;
  if to_regprocedure('public.validate_school_code(text)') is not null then
    execute 'revoke all on function public.validate_school_code(text) from public, anon, authenticated';
  end if;
end $$;

-- Keep legacy code and video asset tables admin-only when these legacy tables exist.
-- Fresh installs may not create them; current playback uses content.r2_media_key instead.
do $$ begin
  if to_regclass('public.school_membership_codes') is not null then
    execute 'alter table public.school_membership_codes enable row level security';
    execute 'drop policy if exists "admin manage school membership codes" on public.school_membership_codes';
    execute 'create policy "admin manage school membership codes" on public.school_membership_codes for all to authenticated using (public.is_admin()) with check (public.is_admin())';
  end if;
  if to_regclass('public.video_assets') is not null then
    execute 'alter table public.video_assets enable row level security';
    execute 'drop policy if exists "admin manage legacy video assets" on public.video_assets';
    execute 'create policy "admin manage legacy video assets" on public.video_assets for all to authenticated using (public.is_admin()) with check (public.is_admin())';
  end if;
end $$;

-- Legacy RPCs unused by either current application are disabled until a reviewed caller is added. Family-profile RPCs remain available to authenticated users because they enforce ownership and active Family entitlement internally.
do $$ begin
  if to_regprocedure('public.issue_school_code(text,text,integer,timestamp with time zone)') is not null then execute 'revoke all on function public.issue_school_code(text,text,integer,timestamp with time zone) from public, anon, authenticated'; end if;
  if to_regprocedure('public.register_for_event(uuid)') is not null then execute 'revoke all on function public.register_for_event(uuid) from public, anon, authenticated'; end if;
  if to_regprocedure('public.studio_user_count()') is not null then execute 'revoke all on function public.studio_user_count() from public, anon, authenticated'; end if;
end $$;
