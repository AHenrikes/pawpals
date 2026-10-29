-- SOCIAL baseline. New projects only; see README.md before replacing applied history.

CREATE SCHEMA IF NOT EXISTS social;

CREATE TYPE social.follow_status AS ENUM (
    'pending',
    'accepted',
    'rejected'
);

CREATE TABLE IF NOT EXISTS social.follows (
    follower_fursona_id uuid NOT NULL,
    followed_fursona_id uuid NOT NULL,
    status social.follow_status DEFAULT 'pending'::social.follow_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    responded_at timestamp with time zone,
    CONSTRAINT follow_not_self CHECK ((follower_fursona_id <> followed_fursona_id))
);

CREATE OR REPLACE FUNCTION social.can_view_fursona(p_viewer_fursona_id uuid, p_target_fursona_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core', 'social'
    AS $$
  select exists (
    select 1 from core.fursonas target
    join core.accounts account on account.id = target.account_id
    where target.id = p_target_fursona_id and target.status = 'active'
      and account.status in ('active', 'at_risk')
      and (core.owns_fursona(target.id, false) or target.visibility = 'public'
        or exists (select 1 from social.follows
          where follower_fursona_id = p_viewer_fursona_id
            and followed_fursona_id = target.id and status = 'accepted'))
  );
$$;

CREATE OR REPLACE FUNCTION social.get_fursona_profile(p_target_fursona_id uuid, p_actor_fursona_id uuid DEFAULT NULL::uuid) RETURNS TABLE(id uuid, username text, display_name text, bio text, species text, pronouns text, avatar_url text, banner_url text, visibility core.profile_visibility, social_links jsonb, show_reputation boolean, show_events boolean, show_communities boolean, featured_achievements text[], created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core', 'social'
    AS $$
  select f.id, f.username, f.display_name, f.bio, f.species, f.pronouns,
         f.avatar_url, f.banner_url, f.visibility, f.social_links,
         f.show_reputation, f.show_events, f.show_communities,
         f.featured_achievements, f.created_at, f.updated_at
  from core.fursonas f
  where f.id = p_target_fursona_id
    and (p_actor_fursona_id is null or core.owns_fursona(p_actor_fursona_id))
    and social.can_view_fursona(p_actor_fursona_id, f.id);
$$;

CREATE OR REPLACE FUNCTION social.get_fursona_profile_by_identifier(p_identifier text, p_actor_fursona_id uuid DEFAULT NULL::uuid) RETURNS TABLE(id uuid, username text, display_name text, bio text, species text, pronouns text, avatar_url text, banner_url text, visibility core.profile_visibility, social_links jsonb, show_reputation boolean, show_events boolean, show_communities boolean, featured_achievements text[], created_at timestamp with time zone, updated_at timestamp with time zone, can_view_content boolean, profile_theme text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core', 'social'
    AS $$
  select f.id, f.username, f.display_name,
    case when access.allowed then f.bio end,
    case when access.allowed then f.species end,
    case when access.allowed then f.pronouns end,
    case when access.allowed then f.avatar_url end,
    case when access.allowed then f.banner_url end,
    f.visibility,
    case when access.allowed then f.social_links else '[]'::jsonb end,
    true,
    case when access.allowed then f.show_events else false end,
    case when access.allowed then f.show_communities else false end,
    case when access.allowed then f.featured_achievements else '{}'::text[] end,
    f.created_at, f.updated_at, access.allowed, f.profile_theme
  from core.fursonas f
  join core.accounts a on a.id = f.account_id
  cross join lateral (select social.can_view_fursona(p_actor_fursona_id, f.id) as allowed) access
  where (f.id::text = p_identifier or lower(f.username) = lower(p_identifier))
    and f.status = 'active' and a.status in ('active', 'at_risk')
    and (p_actor_fursona_id is null or core.owns_fursona(p_actor_fursona_id))
  limit 1;
$$;

CREATE OR REPLACE FUNCTION social.get_fursona_stats(p_target_fursona_id uuid, p_actor_fursona_id uuid DEFAULT NULL::uuid) RETURNS TABLE(post_count integer, follower_count integer, following_count integer, like_count integer, reputation integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core', 'social'
    AS $$
  select 0::integer,
    (select count(*)::integer from social.follows where followed_fursona_id = target.id and status = 'accepted'),
    (select count(*)::integer from social.follows where follower_fursona_id = target.id and status = 'accepted'),
    0::integer, 0::integer
  from core.fursonas target join core.accounts account on account.id = target.account_id
  where target.id = p_target_fursona_id and target.status = 'active'
    and account.status in ('active', 'at_risk')
    and (p_actor_fursona_id is null or core.owns_fursona(p_actor_fursona_id));
$$;

CREATE OR REPLACE FUNCTION social.pending_follows(p_actor_fursona_id uuid) RETURNS TABLE(follower_fursona_id uuid, username text, display_name text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core', 'social'
    AS $$
begin
  if not core.owns_fursona(p_actor_fursona_id) then
    raise exception 'acting fursona not owned' using errcode = '42501';
  end if;
  return query select f.follower_fursona_id, viewer.username, viewer.display_name
  from social.follows f join core.fursonas viewer on viewer.id = f.follower_fursona_id
  where f.followed_fursona_id = p_actor_fursona_id and f.status = 'pending'
  order by f.created_at;
end;
$$;

CREATE OR REPLACE FUNCTION social.request_follow(p_actor_fursona_id uuid, p_target_fursona_id uuid) RETURNS social.follow_status
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core', 'social'
    AS $$
declare v_status social.follow_status;
begin
  if not core.owns_fursona(p_actor_fursona_id) then
    raise exception 'acting fursona not owned' using errcode = '42501';
  end if;
  if p_actor_fursona_id = p_target_fursona_id then
    raise exception 'cannot follow yourself' using errcode = '23514';
  end if;
  select case
    when f.visibility = 'public' then 'accepted'::social.follow_status
    else 'pending'::social.follow_status
  end into v_status
  from core.fursonas f
  join core.accounts a on a.id = f.account_id
  where f.id = p_target_fursona_id and f.status = 'active' and a.status in ('active', 'at_risk');
  if v_status is null then raise exception 'target not found' using errcode = 'P0002'; end if;

  insert into social.follows (follower_fursona_id, followed_fursona_id, status, responded_at)
  values (
    p_actor_fursona_id,
    p_target_fursona_id,
    v_status,
    case when v_status = 'accepted' then now() end
  )
  on conflict (follower_fursona_id, followed_fursona_id)
  do update set status = excluded.status, responded_at = excluded.responded_at;
  return v_status;
end;
$$;

CREATE OR REPLACE FUNCTION social.respond_follow(p_actor_fursona_id uuid, p_follower_fursona_id uuid, p_accept boolean) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core', 'social'
    AS $$
begin
  if not core.owns_fursona(p_actor_fursona_id) then
    raise exception 'acting fursona not owned' using errcode = '42501';
  end if;
  update social.follows set status = case when p_accept then 'accepted'::social.follow_status else 'rejected'::social.follow_status end,
    responded_at = now()
  where followed_fursona_id = p_actor_fursona_id
    and follower_fursona_id = p_follower_fursona_id and status = 'pending';
  if not found then raise exception 'request not found' using errcode = 'P0002'; end if;
end;
$$;

CREATE OR REPLACE VIEW social.v_fursona_stats WITH (security_invoker='on') AS
 SELECT f.id AS fursona_id,
    0 AS reputation,
    0 AS post_count,
    (( SELECT count(*) AS count
           FROM social.follows
          WHERE ((follows.followed_fursona_id = f.id) AND (follows.status = 'accepted'::social.follow_status))))::integer AS follower_count,
    (( SELECT count(*) AS count
           FROM social.follows
          WHERE ((follows.follower_fursona_id = f.id) AND (follows.status = 'accepted'::social.follow_status))))::integer AS following_count,
    0 AS like_count
   FROM (core.fursonas f
     JOIN core.accounts a ON ((a.id = f.account_id)))
  WHERE ((f.status = 'active'::core.fursona_status) AND (a.status = 'active'::core.account_status));

ALTER TABLE ONLY social.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (follower_fursona_id, followed_fursona_id);

CREATE INDEX follows_followed_status_idx ON social.follows USING btree (followed_fursona_id, status, created_at DESC);

ALTER TABLE ONLY social.follows
    ADD CONSTRAINT follows_followed_fursona_id_fkey FOREIGN KEY (followed_fursona_id) REFERENCES core.fursonas(id) ON DELETE CASCADE;

ALTER TABLE ONLY social.follows
    ADD CONSTRAINT follows_follower_fursona_id_fkey FOREIGN KEY (follower_fursona_id) REFERENCES core.fursonas(id) ON DELETE CASCADE;

ALTER TABLE social.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY follows_delete_actor ON social.follows FOR DELETE TO authenticated USING (core.owns_fursona(follower_fursona_id));

CREATE POLICY follows_visible ON social.follows FOR SELECT TO authenticated USING ((core.owns_fursona(follower_fursona_id, false) OR core.owns_fursona(followed_fursona_id, false) OR (status = 'accepted'::social.follow_status)));

GRANT USAGE ON SCHEMA social TO authenticated;

REVOKE ALL ON FUNCTION social.can_view_fursona(p_viewer_fursona_id uuid, p_target_fursona_id uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION social.can_view_fursona(p_viewer_fursona_id uuid, p_target_fursona_id uuid) TO authenticated;

REVOKE ALL ON FUNCTION social.get_fursona_profile(p_target_fursona_id uuid, p_actor_fursona_id uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION social.get_fursona_profile(p_target_fursona_id uuid, p_actor_fursona_id uuid) TO authenticated;

REVOKE ALL ON FUNCTION social.get_fursona_profile_by_identifier(p_identifier text, p_actor_fursona_id uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION social.get_fursona_profile_by_identifier(p_identifier text, p_actor_fursona_id uuid) TO authenticated;

REVOKE ALL ON FUNCTION social.get_fursona_stats(p_target_fursona_id uuid, p_actor_fursona_id uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION social.get_fursona_stats(p_target_fursona_id uuid, p_actor_fursona_id uuid) TO authenticated;

REVOKE ALL ON FUNCTION social.pending_follows(p_actor_fursona_id uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION social.pending_follows(p_actor_fursona_id uuid) TO authenticated;

REVOKE ALL ON FUNCTION social.request_follow(p_actor_fursona_id uuid, p_target_fursona_id uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION social.request_follow(p_actor_fursona_id uuid, p_target_fursona_id uuid) TO authenticated;

REVOKE ALL ON FUNCTION social.respond_follow(p_actor_fursona_id uuid, p_follower_fursona_id uuid, p_accept boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION social.respond_follow(p_actor_fursona_id uuid, p_follower_fursona_id uuid, p_accept boolean) TO authenticated;

GRANT SELECT,DELETE ON TABLE social.follows TO authenticated;

GRANT SELECT ON TABLE social.v_fursona_stats TO authenticated;
