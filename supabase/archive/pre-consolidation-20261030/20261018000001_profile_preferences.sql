-- Public profile customization and privacy preferences.
alter table core.fursonas
  add column social_links jsonb not null default '[]'::jsonb,
  add column show_reputation boolean not null default true,
  add column show_events boolean not null default true,
  add column show_communities boolean not null default true,
  add column featured_achievements text[] not null default '{}';

alter table core.fursonas
  add constraint fursonas_social_links_array
    check (jsonb_typeof(social_links) = 'array' and jsonb_array_length(social_links) <= 6),
  add constraint fursonas_featured_achievements_limit
    check (cardinality(featured_achievements) <= 3),
  add constraint fursonas_featured_achievements_known
    check (featured_achievements <@ array['early_paw', 'community_builder', 'event_explorer', 'trusted_pal']::text[]);

grant update (
  social_links,
  show_reputation,
  show_events,
  show_communities,
  featured_achievements
) on core.fursonas to authenticated;

drop function social.get_fursona_profile(uuid, uuid);
drop function social.get_fursona_profile_by_identifier(text, uuid);

create function social.get_fursona_profile(
  p_target_fursona_id uuid,
  p_actor_fursona_id uuid default null
)
returns table (
  id uuid, username text, display_name text, bio text, species text, pronouns text,
  avatar_url text, banner_url text, visibility core.profile_visibility,
  social_links jsonb, show_reputation boolean, show_events boolean,
  show_communities boolean, featured_achievements text[],
  created_at timestamptz, updated_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, core, social
as $$
  select f.id, f.username, f.display_name, f.bio, f.species, f.pronouns,
         f.avatar_url, f.banner_url, f.visibility, f.social_links,
         f.show_reputation, f.show_events, f.show_communities,
         f.featured_achievements, f.created_at, f.updated_at
  from core.fursonas f
  where f.id = p_target_fursona_id
    and (p_actor_fursona_id is null or core.owns_fursona(p_actor_fursona_id))
    and social.can_view_fursona(p_actor_fursona_id, f.id);
$$;

create function social.get_fursona_profile_by_identifier(
  p_identifier text,
  p_actor_fursona_id uuid default null
)
returns table (
  id uuid, username text, display_name text, bio text, species text, pronouns text,
  avatar_url text, banner_url text, visibility core.profile_visibility,
  social_links jsonb, show_reputation boolean, show_events boolean,
  show_communities boolean, featured_achievements text[],
  created_at timestamptz, updated_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, core, social
as $$
  select f.id, f.username, f.display_name, f.bio, f.species, f.pronouns,
         f.avatar_url, f.banner_url, f.visibility, f.social_links,
         f.show_reputation, f.show_events, f.show_communities,
         f.featured_achievements, f.created_at, f.updated_at
  from core.fursonas f
  where (f.id::text = p_identifier or lower(f.username) = lower(p_identifier))
    and (p_actor_fursona_id is null or core.owns_fursona(p_actor_fursona_id))
    and social.can_view_fursona(p_actor_fursona_id, f.id)
  limit 1;
$$;

revoke all on function social.get_fursona_profile(uuid, uuid) from public, anon, authenticated;
revoke all on function social.get_fursona_profile_by_identifier(text, uuid) from public, anon, authenticated;
grant execute on function social.get_fursona_profile(uuid, uuid) to anon, authenticated;
grant execute on function social.get_fursona_profile_by_identifier(text, uuid) to anon, authenticated;
