-- ============================================================================
-- Expose core schema functions in public schema for RPC calls
-- Supabase RPC only exposes public schema functions, so we create wrappers
-- ============================================================================

-- PUBLIC WRAPPER: Create a social post and its media atomically
-- Keep this invoker-security so social RLS policies apply to the caller.
CREATE OR REPLACE FUNCTION public.create_post_with_media(
  p_fursona_id UUID,
  p_post_type TEXT,
  p_content TEXT,
  p_visibility TEXT DEFAULT 'everyone',
  p_media JSONB DEFAULT '[]'::JSONB
)
RETURNS social.posts
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, social
AS $$
BEGIN
  RETURN social.create_post_with_media(
    p_fursona_id,
    p_post_type,
    p_content,
    p_visibility,
    p_media
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_post_with_media(UUID, TEXT, TEXT, TEXT, JSONB)
  TO authenticated;

-- ============================================================================
-- PUBLIC WRAPPER: Create account
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_account(
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
BEGIN
  RETURN core.create_account(
    p_user_id, p_firstname, p_lastname, p_email, p_display_name,
    p_username, p_species, p_pronouns, p_bio
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, core;

GRANT EXECUTE ON FUNCTION public.create_account(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- PUBLIC WRAPPER: Check username availability
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_username_availability(p_username TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, core
AS $$
BEGIN
  -- RETURN core.check_username_availability(p_username);
  RETURN NOT EXISTS (
    SELECT 1
    FROM core.fursonas
    WHERE lower(username) = lower(p_username)
    AND is_active = true  -- add this
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_username_availability(TEXT) TO anon, authenticated;

-- ============================================================================
-- PUBLIC WRAPPER: Fetch user account & current fursona
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_profile()
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
  SELECT * FROM core.get_user_profile();
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- PUBLIC WRAPPER: switch current fursona
-- ============================================================================
CREATE OR REPLACE FUNCTION public.switch_current_fursona(p_fursona_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, core
AS $$
BEGIN
  RETURN core.switch_current_fursona(p_fursona_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.switch_current_fursona(uuid) TO authenticated;

-- PUBLIC WRAPPER: Delete the authenticated user's account
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, core
AS $$
BEGIN
  RETURN core.delete_user_account();
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- ============================================================================
-- PUBLIC WRAPPER: search fursonas
-- ============================================================================
-- CREATE OR REPLACE FUNCTION public.search_fursonas(search_term TEXT)
-- RETURNS TABLE (
--   id UUID,
--   username TEXT,
--   display_name TEXT,
--   avatar_url TEXT,
--   reputation INT,
--   is_match_on_display_name BOOLEAN
-- ) AS $$
--   SELECT * FROM core.search_fursonas(search_term);
-- $$ LANGUAGE sql SECURITY DEFINER
-- SET search_path = core, public;

-- GRANT EXECUTE ON FUNCTION public.search_fursonas(TEXT) TO authenticated;
