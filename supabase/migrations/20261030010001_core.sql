-- CORE baseline. New projects only; see README.md before replacing applied history.
SET check_function_bodies = false;

CREATE SCHEMA IF NOT EXISTS core;

CREATE SCHEMA IF NOT EXISTS private;

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TYPE core.account_status AS ENUM (
    'active',
    'suspended',
    'closed',
    'at_risk'
);

CREATE TYPE core.fursona_status AS ENUM (
    'active',
    'deactivated'
);

CREATE TYPE core.platform_role AS ENUM (
    'user',
    'admin'
);

CREATE TYPE core.profile_visibility AS ENUM (
    'public',
    'followers_only',
    'private'
);

CREATE OR REPLACE FUNCTION core.account_can_act(p_account_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core'
    AS $$
  select exists (select 1 from core.accounts
    where id = p_account_id and user_id = auth.uid() and status in ('active', 'at_risk'));
$$;

CREATE OR REPLACE FUNCTION core.change_username(p_fursona_id uuid, p_new_username text, p_account_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core'
    AS $_$
declare
  v_fursona core.fursonas%rowtype;
  v_username text := lower(trim(p_new_username));
  v_changed_at timestamptz := now();
begin
  if p_account_id is distinct from core.current_account_id() or not core.account_can_act(p_account_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into v_fursona from core.fursonas
  where id = p_fursona_id and account_id = p_account_id and status = 'active'
  for update;
  if not found then raise exception 'fursona not found' using errcode = 'P0002'; end if;
  if v_username !~ '^[a-z0-9_-]{3,50}$' then raise exception 'invalid username' using errcode = '23514'; end if;
  if lower(v_fursona.username) = v_username then raise exception 'username is unchanged' using errcode = '23514'; end if;
  if v_fursona.last_username_change_at is not null
     and v_fursona.last_username_change_at + interval '30 days' > v_changed_at then
    raise exception 'username change is on cooldown' using errcode = 'P0001';
  end if;
  update core.fursonas set username = v_username, last_username_change_at = v_changed_at
  where id = p_fursona_id;
  insert into core.username_history (fursona_id, old_username, new_username, changed_at)
  values (p_fursona_id, v_fursona.username, v_username, v_changed_at);
  return jsonb_build_object(
    'success', true,
    'old_username', v_fursona.username,
    'new_username', v_username,
    'changed_at', v_changed_at,
    'cooldown_until', v_changed_at + interval '30 days'
  );
exception when unique_violation then
  raise exception 'username is already taken' using errcode = '23505';
end;
$_$;

CREATE OR REPLACE FUNCTION core.check_username_availability(p_username text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core'
    AS $_$
  select p_username ~ '^[A-Za-z0-9_-]{3,50}$'
    and not exists (select 1 from core.fursonas where lower(username) = lower(p_username));
$_$;

CREATE OR REPLACE FUNCTION core.check_username_cooldown(p_fursona_id uuid) RETURNS timestamp with time zone
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core'
    AS $$
  select case
    when last_username_change_at + interval '30 days' > now()
      then last_username_change_at + interval '30 days'
    else null
  end
  from core.fursonas
  where id = p_fursona_id and core.owns_fursona(id, false);
$$;

CREATE OR REPLACE FUNCTION core.create_account(p_email text, p_display_name text, p_username text, p_first_name text DEFAULT NULL::text, p_last_name text DEFAULT NULL::text, p_date_of_birth date DEFAULT NULL::date, p_species text DEFAULT NULL::text, p_pronouns text DEFAULT NULL::text, p_bio text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core', 'private', 'extensions'
    AS $$
declare
  v_user_id uuid := auth.uid();
  v_auth_email text;
  v_account_id uuid;
  v_fursona_id uuid;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select email into v_auth_email from auth.users where id = v_user_id;
  if v_auth_email is null or lower(v_auth_email) <> lower(trim(p_email)) then
    raise exception 'email does not match authenticated user' using errcode = '42501';
  end if;
  select id, default_fursona_id into v_account_id, v_fursona_id
  from core.accounts where user_id = v_user_id;
  if v_account_id is not null then
    return jsonb_build_object('account_id', v_account_id, 'fursona_id', v_fursona_id);
  end if;

  insert into core.accounts (user_id) values (v_user_id) returning id into v_account_id;
  insert into private.account_details (account_id, email, first_name, last_name, date_of_birth)
  values (v_account_id, v_auth_email, p_first_name, p_last_name, p_date_of_birth);
  insert into core.fursonas (account_id, display_name, username, species, pronouns, bio)
  values (v_account_id, p_display_name, p_username, p_species, p_pronouns, p_bio)
  returning id into v_fursona_id;
  update core.accounts set default_fursona_id = v_fursona_id where id = v_account_id;

  return jsonb_build_object('account_id', v_account_id, 'fursona_id', v_fursona_id);
end;
$$;

CREATE OR REPLACE FUNCTION core.create_fursona(p_display_name text, p_username text, p_species text DEFAULT NULL::text, p_pronouns text DEFAULT NULL::text, p_bio text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core', 'extensions'
    AS $$
declare
  v_account core.accounts%rowtype;
  v_id uuid;
begin
  select * into v_account from core.accounts where user_id = auth.uid() for update;
  if not found then raise exception 'account not found' using errcode = 'P0002'; end if;
  if v_account.status not in ('active', 'at_risk') then raise exception 'account cannot act' using errcode = '42501'; end if;
  if (select count(*) from core.fursonas where account_id = v_account.id and status = 'active') >= 4 then
    raise exception 'fursona limit reached' using errcode = 'P0001';
  end if;
  insert into core.fursonas (account_id, display_name, username, species, pronouns, bio)
  values (v_account.id, p_display_name, p_username, p_species, p_pronouns, p_bio)
  returning id into v_id;
  if v_account.default_fursona_id is null then
    update core.accounts set default_fursona_id = v_id where id = v_account.id;
  end if;
  return v_id;
end;
$$;

CREATE OR REPLACE FUNCTION core.current_account_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core'
    AS $$
  select id from core.accounts where user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION core.delete_fursona(p_fursona_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core'
    AS $$
declare
  v_account core.accounts%rowtype;
  v_next_default uuid;
begin
  select a.* into v_account
  from core.accounts a join core.fursonas f on f.account_id = a.id
  where a.user_id = auth.uid() and f.id = p_fursona_id
  for update of a;
  if not found or v_account.status not in ('active', 'at_risk') then raise exception 'fursona not found' using errcode = 'P0002'; end if;
  if (select count(*) from core.fursonas where account_id = v_account.id and status = 'active') <= 1 then
    raise exception 'cannot delete last fursona' using errcode = '23514';
  end if;
  if v_account.default_fursona_id = p_fursona_id then
    select id into v_next_default from core.fursonas
    where account_id = v_account.id and id <> p_fursona_id and status = 'active'
    order by created_at limit 1;
    update core.accounts set default_fursona_id = v_next_default where id = v_account.id;
  end if;
  delete from core.fursonas where id = p_fursona_id and account_id = v_account.id;
end;
$$;

CREATE OR REPLACE FUNCTION core.owns_fursona(p_fursona_id uuid, p_require_active boolean DEFAULT true) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core'
    AS $$
  select exists (
    select 1 from core.fursonas f join core.accounts a on a.id = f.account_id
    where f.id = p_fursona_id and a.user_id = auth.uid()
      and a.status in ('active', 'at_risk')
      and (not p_require_active or f.status = 'active'));
$$;

CREATE OR REPLACE FUNCTION core.search_fursonas(search_term text) RETURNS TABLE(id uuid, username text, display_name text, avatar_url text, species text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core', 'private'
    AS $$
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

CREATE OR REPLACE FUNCTION core.set_account_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog'
    AS $$
begin
  if (new.user_id, new.status, new.platform_role, new.default_fursona_id)
     is distinct from (old.user_id, old.status, old.platform_role, old.default_fursona_id) then
    if old.default_fursona_id is null and old.updated_at is null
       and new.default_fursona_id is not null
       and new.status = old.status and new.platform_role = old.platform_role then
      new.updated_at := null;
    else
      new.updated_at := now();
    end if;
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION core.set_default_fursona(p_fursona_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core'
    AS $$
declare v_account_id uuid;
begin
  select id into v_account_id from core.accounts where user_id = auth.uid() and status in ('active', 'at_risk') for update;
  if v_account_id is null or not exists (
    select 1 from core.fursonas where id = p_fursona_id and account_id = v_account_id and status = 'active'
  ) then raise exception 'not allowed' using errcode = '42501'; end if;
  update core.accounts set default_fursona_id = p_fursona_id where id = v_account_id;
end;
$$;

CREATE OR REPLACE FUNCTION core.set_fursona_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog'
    AS $$
begin
  if (to_jsonb(new) - 'updated_at') is distinct from (to_jsonb(old) - 'updated_at') then
    new.updated_at := now();
  else
    new.updated_at := old.updated_at;
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION core.validate_default_fursona() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog', 'core'
    AS $$
begin
  if new.default_fursona_id is not null and not exists (
    select 1 from core.fursonas
    where id = new.default_fursona_id and account_id = new.id and status = 'active'
  ) then
    raise exception 'default fursona must be an active fursona owned by the account' using errcode = '23514';
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION private.check_unique_pending_phone() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'auth'
    AS $$
begin
  if new.phone_change is null or new.phone_change = '' then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.phone_change, 0));
  if exists (select 1 from auth.users
             where phone_change = new.phone_change and id <> new.id) then
    raise exception 'phone number already has a pending verification'
      using errcode = '23505';
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION private.guard_account_details() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core', 'private'
    AS $$
begin
  if old.age_verified_at is not null and
     (new.first_name, new.last_name, new.date_of_birth)
       is distinct from (old.first_name, old.last_name, old.date_of_birth) then
    raise exception 'verified legal details cannot be changed' using errcode = '23514';
  end if;
  if (new.email, new.phone_number, new.first_name, new.last_name,
      new.date_of_birth, new.age_verified_at)
     is distinct from (old.email, old.phone_number, old.first_name,
                       old.last_name, old.date_of_birth, old.age_verified_at) then
    new.updated_at := now();
    update core.accounts set updated_at = now() where id = new.account_id;
  else
    new.updated_at := old.updated_at;
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION private.sync_verified_contacts() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'core', 'private'
    AS $$
begin
  update private.account_details details
  set email = new.email,
      phone_number = case when new.phone_confirmed_at is not null
        then nullif(new.phone, '') else null end
  from core.accounts account
  where account.id = details.account_id
    and account.user_id = new.id
    and (details.email, details.phone_number) is distinct from
        (new.email, case when new.phone_confirmed_at is not null
          then nullif(new.phone, '') else null end);
  return new;
end;
$$;

CREATE TABLE IF NOT EXISTS private.account_details (
    account_id uuid NOT NULL,
    email text NOT NULL,
    first_name text,
    last_name text,
    date_of_birth date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    age_verified_at timestamp with time zone,
    phone_number text,
    CONSTRAINT account_details_email_valid CHECK ((email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'::text))
);

CREATE TABLE IF NOT EXISTS core.accounts (
    id uuid DEFAULT extensions.gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status core.account_status DEFAULT 'active'::core.account_status NOT NULL,
    platform_role core.platform_role DEFAULT 'user'::core.platform_role NOT NULL,
    default_fursona_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS core.fursonas (
    id uuid DEFAULT extensions.gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    username text NOT NULL,
    display_name text NOT NULL,
    bio text,
    species text,
    pronouns text,
    avatar_url text DEFAULT '/images/profile/avatar.png'::text NOT NULL,
    banner_url text DEFAULT '/images/profile/banner.png'::text NOT NULL,
    visibility core.profile_visibility DEFAULT 'public'::core.profile_visibility NOT NULL,
    status core.fursona_status DEFAULT 'active'::core.fursona_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    last_username_change_at timestamp with time zone,
    social_links jsonb DEFAULT '[]'::jsonb NOT NULL,
    show_reputation boolean DEFAULT true NOT NULL,
    show_events boolean DEFAULT true NOT NULL,
    show_communities boolean DEFAULT true NOT NULL,
    featured_achievements text[] DEFAULT '{}'::text[] NOT NULL,
    profile_theme text DEFAULT 'dark'::text NOT NULL,
    CONSTRAINT fursona_bio_length CHECK (((bio IS NULL) OR (char_length(bio) <= 2000))),
    CONSTRAINT fursona_display_name_length CHECK (((char_length(display_name) >= 1) AND (char_length(display_name) <= 100))),
    CONSTRAINT fursona_username_format CHECK ((username ~ '^[A-Za-z0-9_-]{3,50}$'::text)),
    CONSTRAINT fursonas_featured_achievements_known CHECK ((featured_achievements <@ ARRAY['early_paw'::text, 'community_builder'::text, 'event_explorer'::text, 'trusted_pal'::text])),
    CONSTRAINT fursonas_featured_achievements_limit CHECK ((cardinality(featured_achievements) <= 3)),
    CONSTRAINT fursonas_profile_theme_check CHECK ((profile_theme = ANY (ARRAY['light'::text, 'dark'::text]))),
    CONSTRAINT fursonas_reputation_visible CHECK (show_reputation),
    CONSTRAINT fursonas_social_links_array CHECK (((jsonb_typeof(social_links) = 'array'::text) AND (jsonb_array_length(social_links) <= 6)))
);

CREATE TABLE IF NOT EXISTS core.username_history (
    id uuid DEFAULT extensions.gen_random_uuid() NOT NULL,
    fursona_id uuid NOT NULL,
    old_username text NOT NULL,
    new_username text NOT NULL,
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    reason text DEFAULT 'user_change'::text NOT NULL
);

CREATE TABLE IF NOT EXISTS private.profile_search_limits (
    user_id uuid NOT NULL,
    window_started_at timestamp with time zone NOT NULL,
    request_count integer NOT NULL,
    CONSTRAINT profile_search_limits_request_count_check CHECK (((request_count >= 1) AND (request_count <= 20)))
);

CREATE OR REPLACE VIEW core.account_private_details WITH (security_invoker='true') AS
 SELECT account_id,
    first_name AS firstname,
    last_name AS lastname,
    date_of_birth AS dob,
    email,
    created_at,
    updated_at,
    age_verified_at,
    phone_number
   FROM private.account_details;

COMMENT ON COLUMN core.accounts.default_fursona_id IS 'Account fallback only; active acting fursona belongs in per-device/session state.';

COMMENT ON TABLE core.fursonas IS 'Fursona identity; account ownership is exposed only to the owner.';

COMMENT ON COLUMN core.fursonas.avatar_url IS 'Public profile image URL.';

COMMENT ON COLUMN core.fursonas.banner_url IS 'Public profile banner URL.';

ALTER TABLE ONLY core.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY core.accounts
    ADD CONSTRAINT accounts_user_id_key UNIQUE (user_id);

ALTER TABLE ONLY core.fursonas
    ADD CONSTRAINT fursonas_pkey PRIMARY KEY (id);

ALTER TABLE ONLY core.username_history
    ADD CONSTRAINT username_history_pkey PRIMARY KEY (id);

ALTER TABLE ONLY private.account_details
    ADD CONSTRAINT account_details_pkey PRIMARY KEY (account_id);

ALTER TABLE ONLY private.profile_search_limits
    ADD CONSTRAINT profile_search_limits_pkey PRIMARY KEY (user_id);

CREATE INDEX fursonas_account_id_idx ON core.fursonas USING btree (account_id);

CREATE INDEX fursonas_discovery_idx ON core.fursonas USING btree (status, visibility, created_at DESC);

CREATE INDEX fursonas_display_name_trgm_idx ON core.fursonas USING gin (display_name extensions.gin_trgm_ops);

CREATE UNIQUE INDEX fursonas_username_ci_key ON core.fursonas USING btree (lower(username));

CREATE INDEX fursonas_username_trgm_idx ON core.fursonas USING gin (username extensions.gin_trgm_ops);

CREATE INDEX username_history_fursona_changed_idx ON core.username_history USING btree (fursona_id, changed_at DESC);

ALTER TABLE ONLY core.accounts
    ADD CONSTRAINT accounts_default_fursona_fk FOREIGN KEY (default_fursona_id) REFERENCES core.fursonas(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ONLY core.accounts
    ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY core.fursonas
    ADD CONSTRAINT fursonas_account_id_fkey FOREIGN KEY (account_id) REFERENCES core.accounts(id) ON DELETE CASCADE;

ALTER TABLE ONLY core.username_history
    ADD CONSTRAINT username_history_fursona_id_fkey FOREIGN KEY (fursona_id) REFERENCES core.fursonas(id) ON DELETE CASCADE;

ALTER TABLE ONLY private.account_details
    ADD CONSTRAINT account_details_account_id_fkey FOREIGN KEY (account_id) REFERENCES core.accounts(id) ON DELETE CASCADE;

ALTER TABLE ONLY private.profile_search_limits
    ADD CONSTRAINT profile_search_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE OR REPLACE TRIGGER accounts_set_updated_at BEFORE UPDATE ON core.accounts FOR EACH ROW EXECUTE FUNCTION core.set_account_updated_at();

CREATE CONSTRAINT TRIGGER accounts_validate_default_fursona AFTER INSERT OR UPDATE OF default_fursona_id ON core.accounts DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION core.validate_default_fursona();

CREATE OR REPLACE TRIGGER fursonas_set_updated_at BEFORE UPDATE ON core.fursonas FOR EACH ROW EXECUTE FUNCTION core.set_fursona_updated_at();

CREATE OR REPLACE TRIGGER account_details_guard BEFORE UPDATE ON private.account_details FOR EACH ROW EXECUTE FUNCTION private.guard_account_details();

CREATE OR REPLACE TRIGGER auth_user_pending_phone_unique BEFORE INSERT OR UPDATE OF phone_change ON auth.users FOR EACH ROW EXECUTE FUNCTION private.check_unique_pending_phone();

CREATE OR REPLACE TRIGGER auth_user_verified_contacts AFTER UPDATE OF email, phone, phone_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION private.sync_verified_contacts();

ALTER TABLE core.accounts ENABLE ROW LEVEL SECURITY;

ALTER TABLE core.fursonas ENABLE ROW LEVEL SECURITY;

ALTER TABLE core.username_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE private.account_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY accounts_select_own ON core.accounts FOR SELECT TO authenticated USING ((user_id = auth.uid()));

CREATE POLICY fursonas_select_own ON core.fursonas FOR SELECT TO authenticated USING ((account_id = core.current_account_id()));

CREATE POLICY fursonas_update_own ON core.fursonas FOR UPDATE TO authenticated USING (((account_id = core.current_account_id()) AND core.account_can_act(account_id))) WITH CHECK (((account_id = core.current_account_id()) AND core.account_can_act(account_id)));

CREATE POLICY username_history_owner_read ON core.username_history FOR SELECT TO authenticated USING (core.owns_fursona(fursona_id, false));

CREATE POLICY account_details_select_own ON private.account_details FOR SELECT TO authenticated USING ((account_id = core.current_account_id()));

CREATE POLICY account_details_update_own ON private.account_details FOR UPDATE TO authenticated USING ((account_id = core.current_account_id())) WITH CHECK ((account_id = core.current_account_id()));

GRANT USAGE ON SCHEMA core TO anon;

GRANT USAGE ON SCHEMA core TO authenticated;

GRANT USAGE ON SCHEMA private TO authenticated;

REVOKE ALL ON FUNCTION core.account_can_act(p_account_id uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION core.account_can_act(p_account_id uuid) TO authenticated;

REVOKE ALL ON FUNCTION core.change_username(p_fursona_id uuid, p_new_username text, p_account_id uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION core.change_username(p_fursona_id uuid, p_new_username text, p_account_id uuid) TO authenticated;

REVOKE ALL ON FUNCTION core.check_username_availability(p_username text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION core.check_username_availability(p_username text) TO anon;

GRANT EXECUTE ON FUNCTION core.check_username_availability(p_username text) TO authenticated;

REVOKE ALL ON FUNCTION core.check_username_cooldown(p_fursona_id uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION core.check_username_cooldown(p_fursona_id uuid) TO authenticated;

REVOKE ALL ON FUNCTION core.create_account(p_email text, p_display_name text, p_username text, p_first_name text, p_last_name text, p_date_of_birth date, p_species text, p_pronouns text, p_bio text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION core.create_account(p_email text, p_display_name text, p_username text, p_first_name text, p_last_name text, p_date_of_birth date, p_species text, p_pronouns text, p_bio text) TO authenticated;

REVOKE ALL ON FUNCTION core.create_fursona(p_display_name text, p_username text, p_species text, p_pronouns text, p_bio text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION core.create_fursona(p_display_name text, p_username text, p_species text, p_pronouns text, p_bio text) TO authenticated;

REVOKE ALL ON FUNCTION core.current_account_id() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION core.current_account_id() TO authenticated;

REVOKE ALL ON FUNCTION core.delete_fursona(p_fursona_id uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION core.delete_fursona(p_fursona_id uuid) TO authenticated;

REVOKE ALL ON FUNCTION core.owns_fursona(p_fursona_id uuid, p_require_active boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION core.owns_fursona(p_fursona_id uuid, p_require_active boolean) TO authenticated;

REVOKE ALL ON FUNCTION core.search_fursonas(search_term text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION core.search_fursonas(search_term text) TO authenticated;

REVOKE ALL ON FUNCTION core.set_default_fursona(p_fursona_id uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION core.set_default_fursona(p_fursona_id uuid) TO authenticated;

REVOKE ALL ON FUNCTION core.validate_default_fursona() FROM PUBLIC;

GRANT SELECT ON TABLE private.account_details TO authenticated;

GRANT UPDATE(first_name) ON TABLE private.account_details TO authenticated;

GRANT UPDATE(last_name) ON TABLE private.account_details TO authenticated;

GRANT UPDATE(date_of_birth) ON TABLE private.account_details TO authenticated;

GRANT SELECT ON TABLE core.account_private_details TO authenticated;

GRANT UPDATE(firstname) ON TABLE core.account_private_details TO authenticated;

GRANT UPDATE(lastname) ON TABLE core.account_private_details TO authenticated;

GRANT UPDATE(dob) ON TABLE core.account_private_details TO authenticated;

GRANT SELECT ON TABLE core.accounts TO authenticated;

GRANT SELECT ON TABLE core.fursonas TO authenticated;

GRANT UPDATE(display_name) ON TABLE core.fursonas TO authenticated;

GRANT UPDATE(bio) ON TABLE core.fursonas TO authenticated;

GRANT UPDATE(species) ON TABLE core.fursonas TO authenticated;

GRANT UPDATE(pronouns) ON TABLE core.fursonas TO authenticated;

GRANT UPDATE(avatar_url) ON TABLE core.fursonas TO authenticated;

GRANT UPDATE(banner_url) ON TABLE core.fursonas TO authenticated;

GRANT UPDATE(visibility) ON TABLE core.fursonas TO authenticated;

GRANT UPDATE(social_links) ON TABLE core.fursonas TO authenticated;

GRANT UPDATE(show_reputation) ON TABLE core.fursonas TO authenticated;

GRANT UPDATE(show_events) ON TABLE core.fursonas TO authenticated;

GRANT UPDATE(show_communities) ON TABLE core.fursonas TO authenticated;

GRANT UPDATE(featured_achievements) ON TABLE core.fursonas TO authenticated;

GRANT UPDATE(profile_theme) ON TABLE core.fursonas TO authenticated;

GRANT SELECT ON TABLE core.username_history TO authenticated;

RESET check_function_bodies;
