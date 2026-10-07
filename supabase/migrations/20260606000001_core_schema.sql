-- ============================================================================
-- SCHEMA: core
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS core;


-- ============================================================================
-- TABLE: accounts
-- Links Supabase auth users to application accounts
-- ============================================================================
CREATE TABLE core.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core account data
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  dob DATE,
  email TEXT NOT NULL,
  account_role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  
  -- Account status
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_suspended BOOLEAN DEFAULT false NOT NULL,
  suspension_reason TEXT,
  
  CONSTRAINT valid_account_role CHECK (account_role IN ('user', 'moderator')),
  CONSTRAINT valid_email CHECK (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$')
);

-- ============================================================================
-- TABLE: fursonas
-- Link account.id to fursona table
-- ============================================================================
CREATE TABLE core.fursonas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES core.accounts(id) ON DELETE CASCADE,

  -- Core fursona data
  display_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  bio TEXT,
  species TEXT,
  pronouns TEXT,

  -- Media
  avatar_url TEXT NOT NULL DEFAULT '/images/profile/avatar.png',
  banner_url TEXT NOT NULL DEFAULT '/images/profile/banner.png',

  -- Fursona status
  is_visible TEXT DEFAULT 'public' NOT NULL,
  is_default BOOLEAN DEFAULT false NOT NULL,
  is_current BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  reputation INT DEFAULT 0 NOT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_display_name CHECK (display_name ~ '^.{1,100}$'),
  CONSTRAINT valid_username CHECK (username ~ '^[a-zA-Z0-9_-]{3,50}$'),
  CONSTRAINT valid_is_visibility CHECK (is_visible IN ('public', 'private')),
  CONSTRAINT non_negative_reputation CHECK (reputation >= 0)
);


-- ============================================================================
-- VIEW: Active user accounts with fursona counts
-- ============================================================================
CREATE OR REPLACE VIEW core.v_accounts_with_stats WITH (security_invoker = ON) AS
SELECT
  a.id,
  a.email,
  COUNT(f.id) AS total_fursonas,
  a.is_active,
  a.created_at
FROM core.accounts a
LEFT JOIN core.fursonas f ON f.account_id = a.id
-- WHERE a.is_active = true
GROUP BY a.id, a.email, a.is_active, a.created_at;


-- ============================================================================
-- INDEXES & PARTIAL UNIQUE CONSTRAINTS
-- ============================================================================
CREATE INDEX idx_fursonas_account_id ON core.fursonas(account_id);
CREATE UNIQUE INDEX idx_fursonas_username ON core.fursonas(username);
CREATE UNIQUE INDEX idx_fursonas_is_current ON core.fursonas(account_id, is_current) WHERE is_current = true;
CREATE UNIQUE INDEX idx_fursonas_is_default ON core.fursonas(account_id, is_default) WHERE is_default = true;
CREATE UNIQUE INDEX fursonas_username_lower_idx ON core.fursonas(lower(username));
CREATE INDEX idx_fursonas_is_active ON core.fursonas(is_active);
CREATE INDEX idx_accounts_user_id ON core.accounts(user_id);
CREATE INDEX idx_accounts_email ON core.accounts(email);


-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on accounts table
ALTER TABLE core.accounts ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------

-- Policy: Users can only view their own account
CREATE POLICY accounts_select_own
  ON core.accounts FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only update their own account
CREATE POLICY accounts_update_own
  ON core.accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable RLS on fursonas table
ALTER TABLE core.fursonas ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own fursonas
CREATE POLICY fursonas_select_own
  ON core.fursonas FOR SELECT
  USING (
    account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
  );

-- Policy: Users can insert fursonas for their own account
CREATE POLICY fursonas_insert_own
  ON core.fursonas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    account_id = (
      SELECT id FROM core.accounts
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own fursonas.
-- Reputation and system-managed fields are intentionally not mutable here.
CREATE POLICY fursonas_update_own
  ON core.fursonas FOR UPDATE
  USING (
    account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
  )
  WITH CHECK (
    account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
  );

-- Policy: Users can delete their own fursonas
CREATE POLICY fursonas_delete_own
  ON core.fursonas FOR DELETE
  USING (
    account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
  );


-- ============================================================================
-- GRANT USAGE & SELECT to core auth sers
-- ============================================================================
GRANT USAGE ON SCHEMA core TO authenticated;
GRANT SELECT ON core.accounts TO authenticated;
GRANT SELECT, INSERT, DELETE ON core.fursonas TO authenticated;
GRANT UPDATE (
  display_name,
  username,
  bio,
  species,
  pronouns,
  avatar_url,
  banner_url,
  is_visible,
  is_default,
  is_current,
  updated_at
) ON core.fursonas TO authenticated;
GRANT SELECT ON core.v_accounts_with_stats TO authenticated;


-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE core.accounts IS 'User account profiles linked to Supabase authentication';

COMMENT ON TABLE core.fursonas IS 'Fursona profiles owned by accounts';

COMMENT ON COLUMN core.accounts.user_id IS 'Reference to Supabase auth.users(id)';

COMMENT ON COLUMN core.fursonas.account_id IS 'Foreign key to the owning account';
COMMENT ON COLUMN core.fursonas.is_default IS 'Default fursona for account recovery';
COMMENT ON COLUMN core.fursonas.is_current IS 'Currently active fursona';
