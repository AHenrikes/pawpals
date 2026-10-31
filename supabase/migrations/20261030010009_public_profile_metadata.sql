-- Profiles and their media are visible to signed-in users. Visibility gates posts.
create or replace function core.search_fursonas(search_term text)
returns table(id uuid, username text, display_name text, avatar_url text, species text)
language plpgsql security definer
set search_path to 'pg_catalog', 'core', 'private'
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

  v_pattern := '%' || replace(replace(replace(v_term, chr(92), chr(92) || chr(92)),
    '%', chr(92) || '%'), '_', chr(92) || '_') || '%';
  return query
    select f.id, f.username, f.display_name, f.avatar_url, f.species
    from core.fursonas f join core.accounts a on a.id = f.account_id
    where a.status in ('active', 'at_risk') and f.status = 'active'
      and (f.username ilike v_pattern escape chr(92)
        or f.display_name ilike v_pattern escape chr(92))
    order by case when lower(f.username) = lower(v_term) then 0 else 1 end, f.username
    limit 25;
end;
$$;

create or replace function social.get_fursona_profile(
  p_target_fursona_id uuid, p_actor_fursona_id uuid default null::uuid
) returns table(id uuid, username text, display_name text, bio text, species text,
  pronouns text, avatar_url text, banner_url text, visibility core.profile_visibility,
  social_links jsonb, show_reputation boolean, show_events boolean,
  show_communities boolean, featured_achievements text[], created_at timestamptz,
  updated_at timestamptz)
language sql stable security definer
set search_path to 'pg_catalog', 'core', 'social'
as $$
  select f.id, f.username, f.display_name, f.bio, f.species, f.pronouns,
    f.avatar_url, f.banner_url, f.visibility, f.social_links,
    f.show_reputation, f.show_events, f.show_communities,
    f.featured_achievements, f.created_at, f.updated_at
  from core.fursonas f
  join core.accounts a on a.id = f.account_id
  where f.id = p_target_fursona_id and auth.uid() is not null
    and f.status = 'active' and a.status in ('active', 'at_risk')
    and (p_actor_fursona_id is null or core.owns_fursona(p_actor_fursona_id));
$$;

create or replace function social.get_fursona_profile_by_identifier(
  p_identifier text, p_actor_fursona_id uuid default null::uuid
) returns table(id uuid, username text, display_name text, bio text, species text,
  pronouns text, avatar_url text, banner_url text, visibility core.profile_visibility,
  social_links jsonb, show_reputation boolean, show_events boolean,
  show_communities boolean, featured_achievements text[], created_at timestamptz,
  updated_at timestamptz, can_view_content boolean, profile_theme text)
language sql stable security definer
set search_path to 'pg_catalog', 'core', 'social'
as $$
  select f.id, f.username, f.display_name, f.bio, f.species, f.pronouns,
    f.avatar_url, f.banner_url, f.visibility, f.social_links,
    f.show_reputation, f.show_events, f.show_communities,
    f.featured_achievements, f.created_at, f.updated_at,
    social.can_view_fursona(p_actor_fursona_id, f.id), f.profile_theme
  from core.fursonas f
  join core.accounts a on a.id = f.account_id
  where (f.id::text = p_identifier or lower(f.username) = lower(p_identifier))
    and auth.uid() is not null
    and f.status = 'active' and a.status in ('active', 'at_risk')
    and (p_actor_fursona_id is null or core.owns_fursona(p_actor_fursona_id))
  limit 1;
$$;

drop policy if exists profile_media_read on storage.objects;
create policy profile_media_read on storage.objects for select to authenticated
using (
  bucket_id in ('fursona-avatars', 'fursona-banners')
  and auth.uid() is not null
  and exists (
    select 1 from core.fursonas f
    join core.accounts a on a.id = f.account_id
    where f.id::text = (storage.foldername(name))[1]
      and f.status = 'active' and a.status in ('active', 'at_risk')
  )
);
