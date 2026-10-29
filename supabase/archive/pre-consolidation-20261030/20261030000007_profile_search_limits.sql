-- Trigram indexes support the leading wildcard on both searchable fields.
create extension if not exists pg_trgm with schema extensions;
create index fursonas_username_trgm_idx on core.fursonas
  using gin (username extensions.gin_trgm_ops);
create index fursonas_display_name_trgm_idx on core.fursonas
  using gin (display_name extensions.gin_trgm_ops);

-- One counter per user keeps the limit shared across app instances and direct RPC calls.
create table private.profile_search_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count between 1 and 20)
);
revoke all on private.profile_search_limits from public, anon, authenticated;

create or replace function core.search_fursonas(search_term text)
returns table (id uuid, username text, display_name text, avatar_url text, species text)
language plpgsql volatile security definer
set search_path = pg_catalog, core, private
as $$
declare
  v_user_id uuid := auth.uid();
  v_term text := btrim(search_term);
  v_pattern text;
  v_now timestamptz := clock_timestamp();
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if not exists (select 1 from core.accounts
      where user_id = v_user_id and status in ('active', 'at_risk')) then
    raise exception 'account cannot search' using errcode = '42501';
  end if;
  if v_term is null or char_length(v_term) < 3 or char_length(v_term) > 50 then
    raise exception 'search term must contain 3 to 50 characters' using errcode = '22023';
  end if;

  insert into private.profile_search_limits (user_id, window_started_at, request_count)
  values (v_user_id, v_now, 1)
  on conflict (user_id) do update
    set window_started_at = case
          when private.profile_search_limits.window_started_at <= v_now - interval '1 minute'
            then v_now else private.profile_search_limits.window_started_at end,
        request_count = case
          when private.profile_search_limits.window_started_at <= v_now - interval '1 minute'
            then 1 else private.profile_search_limits.request_count + 1 end
    where private.profile_search_limits.window_started_at <= v_now - interval '1 minute'
       or private.profile_search_limits.request_count < 20;
  if not found then
    raise exception 'profile search rate limit exceeded' using errcode = 'PT429';
  end if;

  -- Escape LIKE metacharacters so a short wildcard cannot match every profile.
  v_pattern := '%' || replace(replace(replace(v_term, chr(92), chr(92) || chr(92)),
    '%', chr(92) || '%'), '_', chr(92) || '_') || '%';
  return query
    select f.id, f.username, f.display_name,
      case when f.visibility = 'public' then f.avatar_url else null end,
      case when f.visibility = 'public' then f.species else null end
    from core.fursonas f join core.accounts a on a.id = f.account_id
    where a.status in ('active', 'at_risk') and f.status = 'active'
      and (f.username ilike v_pattern escape chr(92)
        or f.display_name ilike v_pattern escape chr(92))
    order by case when lower(f.username) = lower(v_term) then 0 else 1 end, f.username
    limit 25;
end;
$$;

revoke all on function core.search_fursonas(text) from public, anon, authenticated;
grant execute on function core.search_fursonas(text) to authenticated;
