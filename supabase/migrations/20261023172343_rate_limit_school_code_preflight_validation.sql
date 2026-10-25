-- Public preflight validation has a persistent per-source cooldown.
create table if not exists public.school_code_validation_rate_limits(ip_hash text primary key, window_started_at timestamptz not null default now(), attempts integer not null default 0, updated_at timestamptz not null default now());
alter table public.school_code_validation_rate_limits enable row level security;
revoke all on public.school_code_validation_rate_limits from public,anon,authenticated;
create or replace function public.consume_school_code_validation_attempt(p_ip_hash text) returns boolean language plpgsql security definer set search_path = '' as $$
declare v_started timestamptz; v_attempts integer;
begin
 if p_ip_hash !~ '^[0-9a-f]{64}$' then return false; end if;
 insert into public.school_code_validation_rate_limits(ip_hash,window_started_at,attempts,updated_at) values(p_ip_hash,now(),1,now()) on conflict(ip_hash) do nothing;
 select window_started_at,attempts into v_started,v_attempts from public.school_code_validation_rate_limits where ip_hash=p_ip_hash for update;
 if v_started < now()-interval '10 minutes' then update public.school_code_validation_rate_limits set window_started_at=now(),attempts=1,updated_at=now() where ip_hash=p_ip_hash; return true; end if;
 if v_attempts >= 10 then return false; end if;
 update public.school_code_validation_rate_limits set attempts=attempts+1,updated_at=now() where ip_hash=p_ip_hash; return true;
end; $$;
revoke all on function public.consume_school_code_validation_attempt(text) from public,anon,authenticated; grant execute on function public.consume_school_code_validation_attempt(text) to service_role;
create or replace function public.validate_school_code(p_code_hash text) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.school_codes sc join public.schools s on s.id=sc.school_id where sc.code_hash=p_code_hash and sc.active=true and sc.is_active=true and (sc.expires_at is null or sc.expires_at>now()) and sc.uses<sc.max_uses and s.is_active=true);
$$;
revoke all on function public.validate_school_code(text) from public,anon,authenticated; grant execute on function public.validate_school_code(text) to service_role;
