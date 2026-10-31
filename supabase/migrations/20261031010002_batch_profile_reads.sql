-- Load a page of follow-list profiles in one Data API request.
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
    and auth.uid() is not null
    and f.status = 'active' and a.status in ('active', 'at_risk')
    and (p_actor_fursona_id is null or core.owns_fursona(p_actor_fursona_id));
$$;

revoke all on function social.get_fursona_profiles_by_ids(uuid[], uuid) from public, anon;
grant execute on function social.get_fursona_profiles_by_ids(uuid[], uuid) to authenticated;
