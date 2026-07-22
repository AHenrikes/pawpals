-- ============================================================================
-- SCHEMA: social
-- Social interactions between fursonas
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS social;


-- ============================================================================
-- TABLE: followers
-- Track follower relationships
-- ============================================================================
CREATE TABLE social.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  following_fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Ensure no duplicate follows and no self-follows
  CONSTRAINT no_self_follow CHECK (follower_fursona_id != following_fursona_id),
  UNIQUE(follower_fursona_id, following_fursona_id)
);

-- ============================================================================
-- TABLE: posts
-- Posts/content created by fursonas
-- ============================================================================
CREATE TABLE social.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT,
  content TEXT,
  
  -- Media attachments
  media_urls TEXT[] DEFAULT '{}',
  
  -- Metadata
  likes_count INT DEFAULT 0 NOT NULL,
  comments_count INT DEFAULT 0 NOT NULL,
  views_count INT DEFAULT 0 NOT NULL,
  bookmarks_count INT DEFAULT 0 NOT NULL,
  shares_count INT DEFAULT 0 NOT NULL,
  
  -- Status
  is_published BOOLEAN DEFAULT true NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT valid_content CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 5000),
  CONSTRAINT non_negative_likes CHECK (likes_count >= 0),
  CONSTRAINT non_negative_comments CHECK (comments_count >= 0),
  CONSTRAINT non_negative_views CHECK (views_count >= 0),
  CONSTRAINT non_negative_bookmarks CHECK (bookmarks_count >= 0),
  CONSTRAINT non_negative_shares CHECK (shares_count >= 0)
);

-- ============================================================================
-- TABLE: comments
-- Threaded comments on posts
-- ============================================================================
CREATE TABLE social.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social.posts(id) ON DELETE CASCADE,
  fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES social.comments(id) ON DELETE CASCADE, -- null = top level
  
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0 NOT NULL,
  
  is_deleted BOOLEAN DEFAULT false NOT NULL, -- soft delete to preserve thread structure
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT valid_comment CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 2000),
  CONSTRAINT non_negative_likes CHECK (likes_count >= 0)
);

-- ============================================================================
-- TABLE: likes
-- Track likes on posts
-- ============================================================================
CREATE TABLE social.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES social.posts(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(liker_fursona_id, post_id)
);

-- ============================================================================
-- TABLE: comment_likes
-- Likes on comments
-- ============================================================================
CREATE TABLE social.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES social.comments(id) ON DELETE CASCADE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  UNIQUE(liker_fursona_id, comment_id)
);

-- ============================================================================
-- TABLE: bookmarks
-- Bookmark on post
-- ============================================================================
CREATE TABLE social.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES social.posts(id) ON DELETE CASCADE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE(fursona_id, post_id)
);

-- ============================================================================
-- TABLE: reports
-- Report inappropriate content
-- ============================================================================
CREATE TABLE social.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  reported_fursona_id UUID REFERENCES core.fursonas(id) ON DELETE CASCADE,
  reported_post_id UUID REFERENCES social.posts(id) ON DELETE CASCADE,
  
  -- Report details
  reason TEXT NOT NULL,
  description TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' NOT NULL,
  reviewed_by UUID REFERENCES core.accounts(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT valid_reason CHECK (reason IN ('harassment', 'spam', 'inappropriate', 'stolen_art', 'other')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  CONSTRAINT at_least_one_report_target CHECK (
    (reported_fursona_id IS NOT NULL AND reported_post_id IS NULL) OR
    (reported_fursona_id IS NULL AND reported_post_id IS NOT NULL)
  )
);


-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_followers_follower ON social.followers(follower_fursona_id);
CREATE INDEX idx_followers_following ON social.followers(following_fursona_id);
CREATE INDEX idx_followers_created ON social.followers(created_at DESC);

CREATE INDEX idx_posts_fursona ON social.posts(fursona_id);
CREATE INDEX idx_posts_created ON social.posts(created_at DESC);
CREATE INDEX idx_posts_published ON social.posts(is_published);

CREATE INDEX idx_likes_liker ON social.post_likes(liker_fursona_id);
CREATE INDEX idx_likes_post ON social.post_likes(post_id);
CREATE INDEX idx_likes_created ON social.post_likes(created_at DESC);

CREATE INDEX idx_comments_post ON social.comments(post_id);
CREATE INDEX idx_comments_fursona ON social.comments(fursona_id);
CREATE INDEX idx_comments_parent ON social.comments(parent_id);
CREATE INDEX idx_comments_created ON social.comments(created_at DESC);

CREATE INDEX idx_comment_likes_liker ON social.comment_likes(liker_fursona_id);
CREATE INDEX idx_comment_likes_comment ON social.comment_likes(comment_id);

CREATE INDEX idx_reports_reporter ON social.reports(reporter_fursona_id);
CREATE INDEX idx_reports_reported_fursona ON social.reports(reported_fursona_id);
CREATE INDEX idx_reports_reported_post ON social.reports(reported_post_id);
CREATE INDEX idx_reports_status ON social.reports(status);
CREATE INDEX idx_reports_created ON social.reports(created_at DESC);

-- ============================================================================
-- FUNCTION: Prevent self like on post
-- ============================================================================
CREATE OR REPLACE FUNCTION social.prevent_self_like()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM social.posts
    WHERE id = NEW.post_id
    AND fursona_id = NEW.liker_fursona_id
  ) THEN
    RAISE EXCEPTION 'Cannot like your own post';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: ^
-- ============================================================================
CREATE TRIGGER trigger_prevent_self_like
  BEFORE INSERT ON social.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION social.prevent_self_like();

-- ============================================================================
-- FUNCTION: Prevent self like on comment
-- ============================================================================
CREATE OR REPLACE FUNCTION social.prevent_comment_self_like()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM social.comments
    WHERE id = NEW.comment_id
    AND fursona_id = NEW.liker_fursona_id
  ) THEN
    RAISE EXCEPTION 'Cannot like your own comment';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: ^
-- ============================================================================
CREATE TRIGGER trigger_prevent_comment_self_like
  BEFORE INSERT ON social.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION social.prevent_comment_self_like();


-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on social tables
ALTER TABLE social.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.reports ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- FOLLOWERS POLICIES
-- ============================================================================
-- Policy: Anyone can view public followers
CREATE POLICY followers_select_public
  ON social.followers FOR SELECT
  USING (
    -- Can see if following an active fursona
    EXISTS(
      SELECT 1 FROM core.fursonas 
      WHERE id = social.followers.following_fursona_id AND is_active = true
    )
  );

-- Policy: Users can manage their own follows
CREATE POLICY followers_insert_own
  ON social.followers FOR INSERT
  WITH CHECK (
    follower_fursona_id IN (
      SELECT id FROM core.fursonas 
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

CREATE POLICY followers_delete_own
  ON social.followers FOR DELETE
  USING (
    follower_fursona_id IN (
      SELECT id FROM core.fursonas 
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

-- ============================================================================
-- POSTS POLICIES
-- ============================================================================
-- Policy: View published posts from active fursonas
CREATE POLICY posts_select_public
  ON social.posts FOR SELECT
  USING (
    is_published = true AND
    EXISTS(
      SELECT 1 FROM core.fursonas 
      WHERE id = social.posts.fursona_id AND is_active = true
    )
  );

-- Policy: Users can view own posts
CREATE POLICY posts_select_own
  ON social.posts FOR SELECT
  USING (
    fursona_id IN (
      SELECT id FROM core.fursonas 
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

-- Policy: Users can create posts for their fursonas
CREATE POLICY posts_insert_own
  ON social.posts FOR INSERT
  WITH CHECK (
    fursona_id IN (
      SELECT id FROM core.fursonas 
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

-- Policy: Users can update their own posts
CREATE POLICY posts_update_own
  ON social.posts FOR UPDATE
  USING (
    fursona_id IN (
      SELECT id FROM core.fursonas 
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    fursona_id IN (
      SELECT id FROM core.fursonas 
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

-- Policy: Users can delete their own posts
CREATE POLICY posts_delete_own
  ON social.posts FOR DELETE
  USING (
    fursona_id IN (
      SELECT id FROM core.fursonas 
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

-- ============================================================================
-- LIKES POLICIES
-- ============================================================================
-- Anyone can view likes on published posts
CREATE POLICY likes_select_public
  ON social.post_likes FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM social.posts
      WHERE id = social.post_likes.post_id AND is_published = true
    )
  );

-- Users can like posts
CREATE POLICY likes_insert_own
  ON social.post_likes FOR INSERT
  WITH CHECK (
    liker_fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

-- Users can unlike posts
CREATE POLICY likes_delete_own
  ON social.post_likes FOR DELETE
  USING (
    liker_fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

-- ============================================================================
-- COMMENT POLICIES
-- ============================================================================
-- Comments: anyone can view non-deleted comments on published posts
CREATE POLICY comments_select_public
  ON social.comments FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM social.posts
      WHERE id = social.comments.post_id AND is_published = true
    )
  );

-- Comments: users can post comments
CREATE POLICY comments_insert_own
  ON social.comments FOR INSERT
  WITH CHECK (
    fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

-- Comments: users can update own comments
CREATE POLICY comments_update_own
  ON social.comments FOR UPDATE
  USING (
    fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

-- Comments: users can delete own comments
CREATE POLICY comments_delete_own
  ON social.comments FOR DELETE
  USING (
    fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

-- Comment likes: anyone can view
CREATE POLICY comment_likes_select_public
  ON social.comment_likes FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM social.comments
      WHERE id = social.comment_likes.comment_id AND is_deleted = false
    )
  );

-- Comment likes: users can like
CREATE POLICY comment_likes_insert_own
  ON social.comment_likes FOR INSERT
  WITH CHECK (
    liker_fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

-- Comment likes: users can unlike
CREATE POLICY comment_likes_delete_own
  ON social.comment_likes FOR DELETE
  USING (
    liker_fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

-- ============================================================================
-- REPORTS POLICIES
-- ============================================================================
-- Policy: Users can create reports
CREATE POLICY reports_insert_own
  ON social.reports FOR INSERT
  WITH CHECK (
    reporter_fursona_id IN (
      SELECT id FROM core.fursonas 
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

-- Policy: Users can view their own reports
CREATE POLICY reports_select_own
  ON social.reports FOR SELECT
  USING (
    reporter_fursona_id IN (
      SELECT id FROM core.fursonas 
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );


-- ============================================================================
-- GRANT USAGE & SELECT to social schema & tables
-- ============================================================================
GRANT USAGE ON SCHEMA social TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON social.followers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON social.posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON social.post_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON social.comments TO authenticated;
GRANT SELECT, INSERT, DELETE ON social.comment_likes TO authenticated;


-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE social.followers IS 'Track follower relationships between fursonas';
COMMENT ON TABLE social.posts IS 'Posts/content created by fursonas';
COMMENT ON TABLE social.post_likes IS 'Track likes that fursonas received from posts';
COMMENT ON TABLE social.comments IS 'Threaded comments on posts';
COMMENT ON TABLE social.comment_likes IS 'Likes on comments';
COMMENT ON TABLE social.reports IS 'Reports for inappropriate content or conduct';

COMMENT ON COLUMN social.followers.follower_fursona_id IS 'Fursona doing the following';
COMMENT ON COLUMN social.followers.following_fursona_id IS 'Fursona being followed';
COMMENT ON COLUMN social.post_likes.liker_fursona_id IS 'Fursona giving the like';
COMMENT ON COLUMN social.post_likes.post_id IS 'Post receiving the like';
COMMENT ON COLUMN social.comments.parent_id IS 'NULL = top level comment, set = reply to another comment';
COMMENT ON COLUMN social.comments.is_deleted IS 'Soft delete to preserve thread structure — content cleared but record kept';
