-- A valid Auth session alone must not bypass an account suspension.
create or replace function core.can_read_member_data()
returns boolean language sql stable security definer
set search_path to 'pg_catalog', 'core'
as $$
  select exists (
    select 1 from core.accounts
    where user_id = auth.uid() and status in ('active', 'at_risk')
  );
$$;
revoke all on function core.can_read_member_data() from public, anon;
grant execute on function core.can_read_member_data() to authenticated;

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
  where f.id = p_target_fursona_id and core.can_read_member_data()
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
    and core.can_read_member_data()
    and f.status = 'active' and a.status in ('active', 'at_risk')
    and (p_actor_fursona_id is null or core.owns_fursona(p_actor_fursona_id))
  limit 1;
$$;

create or replace function social.get_fursona_profiles_by_ids(
  p_ids uuid[], p_actor_fursona_id uuid default null
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
  where f.id = any(p_ids)
    and cardinality(p_ids) <= 20
    and core.can_read_member_data()
    and f.status = 'active' and a.status in ('active', 'at_risk')
    and (p_actor_fursona_id is null or core.owns_fursona(p_actor_fursona_id));
$$;

create or replace function social.can_read_profile_media(p_bucket text, p_name text)
returns boolean language sql stable security definer
set search_path to 'pg_catalog', 'core', 'social'
as $$
  select core.can_read_member_data() and exists (
    select 1 from core.fursonas f
    join core.accounts a on a.id = f.account_id
    where f.id::text = split_part(p_name, '/', 1)
      and f.status = 'active' and a.status in ('active', 'at_risk')
      and (
        core.owns_fursona(f.id, false)
        or (p_bucket = 'fursona-avatars'
          and f.avatar_url = '/api/media/fursona-avatars/' || p_name)
        or (p_bucket = 'fursona-banners'
          and f.banner_url = '/api/media/fursona-banners/' || p_name)
      )
  );
$$;
