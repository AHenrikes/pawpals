-- Keep profile fields and username changes in one database transaction.
create or replace function core.save_fursona_profile(
  p_fursona_id uuid, p_account_id uuid, p_updates jsonb, p_new_username text default null
) returns void
language plpgsql security definer
set search_path to 'pg_catalog', 'core'
as $$
declare
  v_links jsonb;
begin
  if p_account_id is distinct from core.current_account_id()
     or not core.account_can_act(p_account_id)
     or not exists (select 1 from core.fursonas where id = p_fursona_id and account_id = p_account_id and status = 'active') then
    raise exception 'profile not owned' using errcode = '42501';
  end if;
  if p_updates is null or jsonb_typeof(p_updates) <> 'object' then
    raise exception 'invalid profile fields' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_object_keys(p_updates) as fields(field)
    where field not in ('display_name', 'bio', 'species', 'pronouns', 'avatar_url', 'banner_url',
      'visibility', 'profile_theme', 'social_links', 'show_reputation', 'show_events',
      'show_communities', 'featured_achievements')
  ) then
    raise exception 'invalid profile fields' using errcode = '22023';
  end if;
  if p_updates ? 'social_links' then
    v_links := p_updates->'social_links';
    if jsonb_typeof(v_links) <> 'array' then
      raise exception 'invalid social links' using errcode = '22023';
    end if;
    if jsonb_array_length(v_links) > 6 or exists (
      select 1 from jsonb_array_elements(v_links) as entries(link)
      where jsonb_typeof(link) <> 'object'
        or link->>'platform' is null
        or link->>'url' is null
        or link->>'platform' not in ('website', 'bluesky', 'discord', 'instagram', 'telegram',
          'tiktok', 'twitch', 'x', 'youtube')
        or length(link->>'url') > 300
        or link->>'url' !~ '^https://[^[:space:]]+$'
    ) then
      raise exception 'invalid social links' using errcode = '22023';
    end if;
  end if;
  if (p_updates ? 'avatar_url' and p_updates->>'avatar_url' is distinct from '/images/profile/avatar.png'
      and p_updates->>'avatar_url' not like '/api/media/fursona-avatars/' || p_fursona_id::text || '/%')
    or (p_updates ? 'banner_url' and p_updates->>'banner_url' is distinct from '/images/profile/banner.png'
      and p_updates->>'banner_url' not like '/api/media/fursona-banners/' || p_fursona_id::text || '/%') then
    raise exception 'invalid profile media' using errcode = '22023';
  end if;

  if p_new_username is not null then
    perform core.change_username(p_fursona_id, p_new_username, p_account_id);
  end if;

  update core.fursonas set
    display_name = case when p_updates ? 'display_name' then p_updates->>'display_name' else display_name end,
    bio = case when p_updates ? 'bio' then p_updates->>'bio' else bio end,
    species = case when p_updates ? 'species' then p_updates->>'species' else species end,
    pronouns = case when p_updates ? 'pronouns' then p_updates->>'pronouns' else pronouns end,
    avatar_url = case when p_updates ? 'avatar_url' then p_updates->>'avatar_url' else avatar_url end,
    banner_url = case when p_updates ? 'banner_url' then p_updates->>'banner_url' else banner_url end,
    visibility = case when p_updates ? 'visibility' then (p_updates->>'visibility')::core.profile_visibility else visibility end,
    profile_theme = case when p_updates ? 'profile_theme' then p_updates->>'profile_theme' else profile_theme end,
    social_links = case when p_updates ? 'social_links' then p_updates->'social_links' else social_links end,
    show_reputation = case when p_updates ? 'show_reputation' then (p_updates->>'show_reputation')::boolean else show_reputation end,
    show_events = case when p_updates ? 'show_events' then (p_updates->>'show_events')::boolean else show_events end,
    show_communities = case when p_updates ? 'show_communities' then (p_updates->>'show_communities')::boolean else show_communities end,
    featured_achievements = case when p_updates ? 'featured_achievements'
      then array(select jsonb_array_elements_text(p_updates->'featured_achievements'))
      else featured_achievements end
  where id = p_fursona_id and account_id = p_account_id;
end;
$$;

revoke all on function core.save_fursona_profile(uuid, uuid, jsonb, text) from public;
revoke all on function core.save_fursona_profile(uuid, uuid, jsonb, text) from anon;
grant execute on function core.save_fursona_profile(uuid, uuid, jsonb, text) to authenticated;

create or replace function public.save_fursona_profile(
  p_fursona_id uuid, p_account_id uuid, p_updates jsonb, p_new_username text default null
) returns void
language sql
set search_path to 'pg_catalog'
as $$ select core.save_fursona_profile(p_fursona_id, p_account_id, p_updates, p_new_username); $$;

revoke all on function public.save_fursona_profile(uuid, uuid, jsonb, text) from public;
revoke all on function public.save_fursona_profile(uuid, uuid, jsonb, text) from anon;
grant execute on function public.save_fursona_profile(uuid, uuid, jsonb, text) to authenticated;
