-- ============================================================================
-- UTILITY VIEWS & FUNCTIONS
-- Helper views and functions for common queries
-- ============================================================================

-- ============================================================================
-- FUNCTION: Create account with fursona
-- ============================================================================
CREATE OR REPLACE FUNCTION core.create_account(
  p_user_id UUID,
  p_firstname TEXT,
  p_lastname TEXT,
  p_email TEXT,
  p_display_name TEXT,
  p_username TEXT,
  p_species TEXT DEFAULT NULL,
  p_pronouns TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_account_id UUID;
  v_fursona_id UUID;
BEGIN
  IF p_display_name IS NULL OR p_display_name = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Display name required');
  END IF;

  IF p_username !~ '^[a-zA-Z0-9_-]{3,50}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid username format');
  END IF;

  IF EXISTS (SELECT 1 FROM core.fursonas WHERE LOWER(username) = LOWER(p_username)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Username already taken');
  END IF;

  INSERT INTO core.accounts (user_id, firstname, lastname, email)
  VALUES (p_user_id, p_firstname, p_lastname, p_email)
  RETURNING id INTO v_account_id;

  INSERT INTO core.fursonas (
    account_id, display_name, username, species, pronouns, bio,
    is_default, is_current
  ) VALUES (
    v_account_id, p_display_name, p_username, p_species, p_pronouns,
    COALESCE(p_bio, 'Welcome to Pawpals!'),
    true, true
  )
  RETURNING id INTO v_fursona_id;

  RETURN jsonb_build_object(
    'success', true,
    'account_id', v_account_id,
    'fursona_id', v_fursona_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = core;

-- ============================================================================
-- FUNCTION: Get users account and current fursona
-- ============================================================================
CREATE OR REPLACE FUNCTION core.get_user_profile()
RETURNS TABLE (
  account_id UUID,
  account_firstname TEXT,
  account_lastname TEXT,
  account_email TEXT,
  account_dob DATE,
  account_created_at TIMESTAMPTZ,
  account_updated_at TIMESTAMPTZ,
  is_active BOOLEAN,
  current_fursona_id UUID,
  current_fursona_username TEXT,
  current_fursona_display_name TEXT,
  current_fursona_avatar_url TEXT,
  current_fursona_banner_url TEXT,
  current_fursona_species TEXT,
  current_fursona_pronouns TEXT,
  current_fursona_bio TEXT,
  current_fursona_reputation INT,
  current_fursona_created_at TIMESTAMPTZ,
  current_fursona_updated_at TIMESTAMPTZ,
  current_fursona_is_default BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.firstname,
    a.lastname,
    a.email,
    a.dob,
    a.created_at,
    a.updated_at,
    a.is_active,
    f.id,
    f.username,
    f.display_name,
    f.avatar_url,
    f.banner_url,
    f.species,
    f.pronouns,
    f.bio,
    f.reputation,
    f.created_at,
    f.updated_at,
    f.is_default
  FROM core.accounts a
  LEFT JOIN core.fursonas f ON f.account_id = a.id AND f.is_current = true
  WHERE a.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Search fursonas
-- ============================================================================
CREATE OR REPLACE FUNCTION core.search_fursonas(search_term TEXT)
RETURNS TABLE (
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  reputation INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.username,
    f.display_name,
    f.avatar_url,
    f.reputation
  FROM core.fursonas f
  WHERE
    f.is_active = true AND (
      f.username ILIKE '%' || search_term || '%' OR
      f.display_name ILIKE '%' || search_term || '%'
    )
  ORDER BY
    CASE WHEN f.username ILIKE search_term THEN 0 ELSE 1 END,
    f.reputation DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = core;

-- ============================================================================
-- FUNCTION: Switch current fursona
-- ============================================================================
CREATE OR REPLACE FUNCTION core.switch_current_fursona(p_fursona_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, core
AS $$
DECLARE
  v_account_id UUID;
  v_fursona_exists BOOLEAN;
BEGIN
  SELECT a.id INTO v_account_id
  FROM core.accounts a
  WHERE a.user_id = auth.uid()
  LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'Account not found for user';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM core.fursonas
    WHERE id = p_fursona_id
    AND account_id = v_account_id
    AND is_active = true
  ) INTO v_fursona_exists;

  IF NOT v_fursona_exists THEN
    RAISE EXCEPTION 'Fursona not found or not active';
  END IF;

  UPDATE core.fursonas SET is_current = false
  WHERE account_id = v_account_id AND is_current = true;

  UPDATE core.fursonas SET is_current = true
  WHERE id = p_fursona_id;

  RETURN true;
END;
$$;

-- TODO
-- ============================================================================
-- FUNCTION: Get follower relationship status
-- ============================================================================
-- CREATE OR REPLACE FUNCTION social.get_follow_status(
--   subject_fursona_id UUID,
--   target_fursona_id UUID
-- )
-- RETURNS TABLE (
--   is_following BOOLEAN,
--   is_followed_by BOOLEAN,
--   is_mutual BOOLEAN
-- ) AS $$
-- DECLARE
--   v_is_following BOOLEAN;
--   v_is_followed_by BOOLEAN;
-- BEGIN
--   SELECT EXISTS(
--     SELECT 1 FROM social.followers
--     WHERE follower_fursona_id = subject_fursona_id
--     AND following_fursona_id = target_fursona_id
--   ) INTO v_is_following;

--   SELECT EXISTS(
--     SELECT 1 FROM social.followers
--     WHERE follower_fursona_id = target_fursona_id
--     AND following_fursona_id = subject_fursona_id
--   ) INTO v_is_followed_by;

--   RETURN QUERY SELECT
--     v_is_following,
--     v_is_followed_by,
--     (v_is_following AND v_is_followed_by);
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Delete account and cascade data
-- ============================================================================
CREATE OR REPLACE FUNCTION core.delete_user_account()
RETURNS BOOLEAN AS $$
DECLARE
  v_account_id UUID;  -- prefixed to avoid column name collision
BEGIN
  SELECT id INTO v_account_id
  FROM core.accounts
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  DELETE FROM core.accounts WHERE id = v_account_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- VIEW: Fursona profiles with social stats
-- ============================================================================
CREATE OR REPLACE VIEW social.v_fursona_stats WITH (security_invoker = on) AS
SELECT
  f.id AS fursona_id,
  f.account_id,
  f.username,
  f.display_name,
  f.reputation,
  (SELECT count(*) FROM social.followers WHERE followers.following_fursona_id = f.id) AS follower_count,
  (SELECT count(*) FROM social.followers WHERE followers.follower_fursona_id = f.id) AS following_count,
  (SELECT count(*) FROM social.posts WHERE posts.fursona_id = f.id) AS post_count,
  (SELECT count(*) FROM social.post_likes pl 
   JOIN social.posts p ON p.id = pl.post_id
   WHERE p.fursona_id = f.id) AS like_count,
  f.created_at
FROM core.fursonas f
WHERE f.is_active = true;

-- ============================================================================
-- VIEW: Top fursonas by reputation
-- ============================================================================
CREATE OR REPLACE VIEW social.v_top_fursonas with (security_invoker = on) AS
SELECT
  id,
  username,
  display_name,
  avatar_url,
  reputation,
  ( SELECT COUNT(*) AS COUNT
    FROM social.followers
    WHERE followers.following_fursona_id = f.id)
    AS follower_count,
  created_at,
  ROW_NUMBER() OVER (ORDER BY reputation DESC) AS rank
FROM core.fursonas f
WHERE is_active = true
LIMIT 100;


-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT SELECT ON social.v_fursona_stats TO authenticated;
GRANT SELECT ON social.v_top_fursonas TO authenticated;

-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================
COMMENT ON FUNCTION core.create_account(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) IS 'Create account and initial fursona during sign-up';
COMMENT ON FUNCTION core.get_user_profile() IS 'Get current authenticated user profile with current fursona';
COMMENT ON FUNCTION core.search_fursonas(TEXT) IS 'Search fursonas by username or display name';
COMMENT ON FUNCTION core.switch_current_fursona(UUID) IS 'Switch authenticated user current fursona';
COMMENT ON FUNCTION core.delete_user_account() IS 'Delete authenticated user account and all associated data';
-- TODO
-- COMMENT ON FUNCTION social.get_follow_status(UUID, UUID) IS 'Get follow relationship between two fursonas';
