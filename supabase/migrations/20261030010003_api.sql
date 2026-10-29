-- API baseline. New projects only; see README.md before replacing applied history.

CREATE OR REPLACE FUNCTION public.change_username(p_fursona_id uuid, p_new_username text, p_account_id uuid) RETURNS jsonb
    LANGUAGE sql
    SET search_path TO 'pg_catalog'
    AS $$ select core.change_username(p_fursona_id, p_new_username, p_account_id); $$;

CREATE OR REPLACE FUNCTION public.check_username_availability(p_username text) RETURNS boolean
    LANGUAGE sql STABLE
    SET search_path TO 'pg_catalog'
    AS $$ select core.check_username_availability(p_username); $$;

CREATE OR REPLACE FUNCTION public.check_username_cooldown(p_fursona_id uuid) RETURNS timestamp with time zone
    LANGUAGE sql STABLE
    SET search_path TO 'pg_catalog'
    AS $$ select core.check_username_cooldown(p_fursona_id); $$;

CREATE OR REPLACE FUNCTION public.create_account(p_email text, p_display_name text, p_username text, p_first_name text DEFAULT NULL::text, p_last_name text DEFAULT NULL::text, p_date_of_birth date DEFAULT NULL::date, p_species text DEFAULT NULL::text, p_pronouns text DEFAULT NULL::text, p_bio text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE sql
    SET search_path TO 'pg_catalog'
    AS $$
  select core.create_account(p_email, p_display_name, p_username, p_first_name, p_last_name, p_date_of_birth, p_species, p_pronouns, p_bio);
$$;

CREATE OR REPLACE FUNCTION public.create_fursona(p_display_name text, p_username text, p_species text DEFAULT NULL::text, p_pronouns text DEFAULT NULL::text, p_bio text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE sql
    SET search_path TO 'pg_catalog'
    AS $$ select core.create_fursona(p_display_name, p_username, p_species, p_pronouns, p_bio); $$;

CREATE OR REPLACE FUNCTION public.delete_fursona(p_fursona_id uuid) RETURNS void
    LANGUAGE sql
    SET search_path TO 'pg_catalog'
    AS $$ select core.delete_fursona(p_fursona_id); $$;

CREATE OR REPLACE FUNCTION public.pending_follows(p_actor_fursona_id uuid) RETURNS TABLE(follower_fursona_id uuid, username text, display_name text)
    LANGUAGE sql
    SET search_path TO 'pg_catalog'
    AS $$
  select * from social.pending_follows(p_actor_fursona_id);
$$;

CREATE OR REPLACE FUNCTION public.request_follow(p_actor_fursona_id uuid, p_target_fursona_id uuid) RETURNS social.follow_status
    LANGUAGE sql
    SET search_path TO 'pg_catalog'
    AS $$ select social.request_follow(p_actor_fursona_id, p_target_fursona_id); $$;

CREATE OR REPLACE FUNCTION public.respond_follow(p_actor_fursona_id uuid, p_follower_fursona_id uuid, p_accept boolean) RETURNS void
    LANGUAGE sql
    SET search_path TO 'pg_catalog'
    AS $$
  select social.respond_follow(p_actor_fursona_id, p_follower_fursona_id, p_accept);
$$;

CREATE OR REPLACE FUNCTION public.set_default_fursona(p_fursona_id uuid) RETURNS void
    LANGUAGE sql
    SET search_path TO 'pg_catalog'
    AS $$ select core.set_default_fursona(p_fursona_id); $$;

REVOKE ALL ON FUNCTION public.change_username(p_fursona_id uuid, p_new_username text, p_account_id uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.change_username(p_fursona_id uuid, p_new_username text, p_account_id uuid) TO service_role;

GRANT EXECUTE ON FUNCTION public.change_username(p_fursona_id uuid, p_new_username text, p_account_id uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.check_username_availability(p_username text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.check_username_availability(p_username text) TO service_role;

GRANT EXECUTE ON FUNCTION public.check_username_availability(p_username text) TO anon;

GRANT EXECUTE ON FUNCTION public.check_username_availability(p_username text) TO authenticated;

REVOKE ALL ON FUNCTION public.check_username_cooldown(p_fursona_id uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.check_username_cooldown(p_fursona_id uuid) TO service_role;

GRANT EXECUTE ON FUNCTION public.check_username_cooldown(p_fursona_id uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.create_account(p_email text, p_display_name text, p_username text, p_first_name text, p_last_name text, p_date_of_birth date, p_species text, p_pronouns text, p_bio text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_account(p_email text, p_display_name text, p_username text, p_first_name text, p_last_name text, p_date_of_birth date, p_species text, p_pronouns text, p_bio text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_account(p_email text, p_display_name text, p_username text, p_first_name text, p_last_name text, p_date_of_birth date, p_species text, p_pronouns text, p_bio text) TO service_role;

REVOKE ALL ON FUNCTION public.create_fursona(p_display_name text, p_username text, p_species text, p_pronouns text, p_bio text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_fursona(p_display_name text, p_username text, p_species text, p_pronouns text, p_bio text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_fursona(p_display_name text, p_username text, p_species text, p_pronouns text, p_bio text) TO service_role;

REVOKE ALL ON FUNCTION public.delete_fursona(p_fursona_id uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.delete_fursona(p_fursona_id uuid) TO service_role;

GRANT EXECUTE ON FUNCTION public.delete_fursona(p_fursona_id uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.pending_follows(p_actor_fursona_id uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.pending_follows(p_actor_fursona_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.pending_follows(p_actor_fursona_id uuid) TO service_role;

REVOKE ALL ON FUNCTION public.request_follow(p_actor_fursona_id uuid, p_target_fursona_id uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.request_follow(p_actor_fursona_id uuid, p_target_fursona_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.request_follow(p_actor_fursona_id uuid, p_target_fursona_id uuid) TO service_role;

REVOKE ALL ON FUNCTION public.respond_follow(p_actor_fursona_id uuid, p_follower_fursona_id uuid, p_accept boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.respond_follow(p_actor_fursona_id uuid, p_follower_fursona_id uuid, p_accept boolean) TO authenticated;

GRANT EXECUTE ON FUNCTION public.respond_follow(p_actor_fursona_id uuid, p_follower_fursona_id uuid, p_accept boolean) TO service_role;

REVOKE ALL ON FUNCTION public.set_default_fursona(p_fursona_id uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.set_default_fursona(p_fursona_id uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.set_default_fursona(p_fursona_id uuid) TO service_role;

-- The public schema is exposed by Supabase. Keep app RPCs off the anon role.
REVOKE EXECUTE ON FUNCTION public.change_username(uuid, text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_username_cooldown(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_account(text, text, text, text, text, date, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_fursona(text, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_fursona(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.pending_follows(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.request_follow(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.respond_follow(uuid, uuid, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_default_fursona(uuid) FROM anon;
