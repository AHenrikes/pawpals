-- ============================================================================
-- SCHEMA: social
-- Social interactions between fursonas
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS social;


-- ============================================================================
-- TABLE: followers
-- Track following relationships
-- ============================================================================
CREATE TABLE social.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  following_fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT no_self_follow CHECK (follower_fursona_id != following_fursona_id),
  UNIQUE(follower_fursona_id, following_fursona_id)
);

-- ============================================================================
-- TABLE: posts
-- Content created by fursonas
-- ============================================================================
CREATE TABLE social.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL,

  -- Content (media lives in social.post_media, not here)
  content TEXT,

  -- Metadata
  views_count INT DEFAULT 0 NOT NULL,
  likes_count INT DEFAULT 0 NOT NULL,
  comments_count INT DEFAULT 0 NOT NULL,
  shares_count INT DEFAULT 0 NOT NULL,
  bookmarks_count INT DEFAULT 0 NOT NULL,

  -- Status. Single value per row, not an array — a post is visible to
  -- exactly one audience at a time.
  visibility TEXT DEFAULT 'public' NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT valid_post_type CHECK (post_type IN ('yap', 'reel', 'gallery')),
  CONSTRAINT valid_visibility CHECK (visibility IN ('public', 'followers', 'mutuals', 'private', 'archived')),
  CONSTRAINT valid_content_length CHECK (content IS NULL OR LENGTH(content) <= 5000),
  -- Media requirements are validated in the app/API transaction layer via
  -- social.create_post_with_media(). A CHECK constraint can't read from
  -- social.post_media because that table is separate, and reels/galleries
  -- need at least one media row inserted after the post row.
  CONSTRAINT non_negative_views CHECK (views_count >= 0),
  CONSTRAINT non_negative_likes CHECK (likes_count >= 0),
  CONSTRAINT non_negative_comments CHECK (comments_count >= 0),
  CONSTRAINT non_negative_shares CHECK (shares_count >= 0),
  CONSTRAINT non_negative_bookmarks CHECK (bookmarks_count >= 0)
);

CREATE TABLE social.post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social.posts(id) ON DELETE CASCADE,

  media_type TEXT NOT NULL,
  url TEXT NOT NULL,
  poster_url TEXT,                -- static frame; required for gif/video, shown until the viewer engages
  duration_seconds NUMERIC(6,2),  -- length of video, or loop length of a gif; null for still images
  width INT,
  height INT,
  file_size_bytes BIGINT,
  order_index INT DEFAULT 0 NOT NULL, -- ordering within a gallery

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT valid_media_type CHECK (media_type IN ('image', 'gif', 'video')),
  CONSTRAINT poster_required_for_motion CHECK (media_type = 'image' OR poster_url IS NOT NULL),
  CONSTRAINT non_negative_order CHECK (order_index >= 0)
);

CREATE TABLE social.reyaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES social.posts(id) ON DELETE CASCADE,

  content TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT valid_reyap_content CHECK (content IS NULL OR LENGTH(content) <= 5000),
  UNIQUE(fursona_id, post_id)
);

CREATE TABLE social.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES social.posts(id) ON DELETE CASCADE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  UNIQUE(liker_fursona_id, post_id)
);

CREATE TABLE social.post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES social.posts(id) ON DELETE CASCADE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  UNIQUE(fursona_id, post_id)
);

CREATE TABLE social.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social.posts(id) ON DELETE CASCADE,
  fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES social.post_comments(id) ON DELETE CASCADE, -- null = top level

  content TEXT NOT NULL,
  likes_count INT DEFAULT 0 NOT NULL,

  is_deleted BOOLEAN DEFAULT false NOT NULL, -- soft delete to preserve thread structure

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT valid_comment CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 2000),
  CONSTRAINT non_negative_likes CHECK (likes_count >= 0)
);

CREATE TABLE social.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES social.post_comments(id) ON DELETE CASCADE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  UNIQUE(liker_fursona_id, comment_id)
);

CREATE TABLE social.post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  reported_fursona_id UUID REFERENCES core.fursonas(id) ON DELETE CASCADE,
  reported_post_id UUID REFERENCES social.posts(id) ON DELETE CASCADE,

  reason TEXT NOT NULL,
  description TEXT,

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

-- One row per *viewing session*, not per second watched: the client opens
-- a session (insert) when a post enters the viewport and upserts on
-- (post_id, view_session_id) as watch_duration_ms grows, stopping once the
-- viewer scrolls away or the video ends. Partitioned by month since this
-- table grows far faster than any other — see PARTITIONING below.
CREATE TABLE social.post_views (
  id UUID DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social.posts(id) ON DELETE CASCADE,
  viewer_fursona_id UUID REFERENCES core.fursonas(id) ON DELETE SET NULL, -- null = anonymous/logged-out viewer
  view_session_id UUID NOT NULL DEFAULT gen_random_uuid(),

  watch_duration_ms INT DEFAULT 0 NOT NULL,   -- how long they actually looked at / played it
  media_duration_ms INT,                      -- total length of the video/gif at view time; null for yaps/images
  watched_percentage NUMERIC(5,2),            -- watch_duration_ms / media_duration_ms, capped at 100
  completed BOOLEAN DEFAULT false NOT NULL,   -- watched to the end at least once

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, -- session start; never updated (partition key)
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, -- bumped as duration is upserted

  CONSTRAINT non_negative_watch_duration CHECK (watch_duration_ms >= 0),
  CONSTRAINT valid_watched_percentage CHECK (watched_percentage IS NULL OR (watched_percentage >= 0 AND watched_percentage <= 100)),
  -- Partitioned unique constraints must include the partition key column.
  -- created_at is set once at session start and never modified, so this
  -- behaves like a normal (post_id, view_session_id) uniqueness rule.
  UNIQUE (post_id, view_session_id, created_at)
) PARTITION BY RANGE (created_at);


-- Internal watermark for the batched views_count sync — not exposed to
-- clients (no RLS policy, no grant to authenticated).
CREATE TABLE social.view_sync_state (
  id INT PRIMARY KEY DEFAULT 1,
  last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '2020-01-01'::timestamptz,
  CONSTRAINT singleton_row CHECK (id = 1)
);
INSERT INTO social.view_sync_state (id) VALUES (1) ON CONFLICT DO NOTHING;


-- ============================================================================
-- PARTITIONING: social.post_views
-- ============================================================================
CREATE OR REPLACE FUNCTION social.create_post_views_partition(target_month DATE)
RETURNS void AS $$
DECLARE
  partition_name TEXT := 'post_views_' || to_char(target_month, 'YYYY_MM');
  start_date DATE := date_trunc('month', target_month);
  end_date DATE := start_date + INTERVAL '1 month';
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS social.%I PARTITION OF social.post_views FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date
  );
END;
$$ LANGUAGE plpgsql;

-- Seed partitions for this month plus the next two, so writes never fail
-- for lack of a target partition.
SELECT social.create_post_views_partition(date_trunc('month', now())::date);
SELECT social.create_post_views_partition((date_trunc('month', now()) + INTERVAL '1 month')::date);
SELECT social.create_post_views_partition((date_trunc('month', now()) + INTERVAL '2 months')::date);

-- Keep creating partitions 2 months ahead, forever. Requires pg_cron
-- (enable it under Database > Extensions in the Supabase dashboard first).
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule(
  'create-post-views-partition',
  '0 0 1 * *', -- midnight on the 1st of each month
  $$SELECT social.create_post_views_partition((date_trunc('month', now()) + INTERVAL '2 months')::date)$$
);


-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_followers_follower ON social.followers(follower_fursona_id);
CREATE INDEX idx_followers_following ON social.followers(following_fursona_id);
CREATE INDEX idx_followers_created ON social.followers(created_at DESC);

CREATE INDEX idx_posts_fursona ON social.posts(fursona_id);
CREATE INDEX idx_posts_type ON social.posts(post_type);
CREATE INDEX idx_posts_visibility ON social.posts(visibility);
CREATE INDEX idx_posts_created ON social.posts(created_at DESC);

CREATE INDEX idx_post_media_post ON social.post_media(post_id, order_index);

CREATE INDEX idx_reyaps_fursona ON social.reyaps(fursona_id);
CREATE INDEX idx_reyaps_post ON social.reyaps(post_id);

CREATE INDEX idx_post_likes_liker ON social.post_likes(liker_fursona_id);
CREATE INDEX idx_post_likes_post ON social.post_likes(post_id);

CREATE INDEX idx_post_bookmarks_fursona ON social.post_bookmarks(fursona_id);
CREATE INDEX idx_post_bookmarks_post ON social.post_bookmarks(post_id);

CREATE INDEX idx_post_comments_post ON social.post_comments(post_id);
CREATE INDEX idx_post_comments_fursona ON social.post_comments(fursona_id);
CREATE INDEX idx_post_comments_parent ON social.post_comments(parent_id);
CREATE INDEX idx_post_comments_created ON social.post_comments(created_at DESC);

CREATE INDEX idx_comment_likes_liker ON social.comment_likes(liker_fursona_id);
CREATE INDEX idx_comment_likes_comment ON social.comment_likes(comment_id);

CREATE INDEX idx_reports_reporter ON social.post_reports(reporter_fursona_id);
CREATE INDEX idx_reports_reported_fursona ON social.post_reports(reported_fursona_id);
CREATE INDEX idx_reports_reported_post ON social.post_reports(reported_post_id);
CREATE INDEX idx_reports_status ON social.post_reports(status);
CREATE INDEX idx_reports_created ON social.post_reports(created_at DESC);

CREATE INDEX idx_post_views_post ON social.post_views(post_id, created_at DESC);
CREATE INDEX idx_post_views_viewer ON social.post_views(viewer_fursona_id, created_at DESC);


-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================
-- Create a post with media in a single database transaction so the app can
-- enforce the post-type rules without leaving the DB in an invalid state.
-- This is the correct Supabase-safe way to support:
--   - yap: text OR media
--   - reel: media required
--   - gallery: media required
CREATE OR REPLACE FUNCTION social.create_post_with_media(
  p_fursona_id UUID,
  p_post_type TEXT,
  p_content TEXT,
  p_visibility TEXT DEFAULT 'public',
  p_media JSONB DEFAULT '[]'::JSONB
)
RETURNS social.posts AS $$
DECLARE
  new_post social.posts;
  media_item JSONB;
BEGIN
  IF p_post_type = 'yap' AND NULLIF(BTRIM(p_content), '') IS NULL AND (p_media IS NULL OR jsonb_array_length(p_media) = 0) THEN
    RAISE EXCEPTION 'Yap posts must include text or media';
  END IF;

  IF p_post_type IN ('reel', 'gallery') AND (p_media IS NULL OR jsonb_array_length(p_media) = 0) THEN
    RAISE EXCEPTION '% posts require at least one media item', p_post_type;
  END IF;

  INSERT INTO social.posts (
    fursona_id,
    post_type,
    content,
    visibility
  )
  VALUES (
    p_fursona_id,
    p_post_type,
    p_content,
    p_visibility
  )
  RETURNING * INTO new_post;

  IF p_media IS NOT NULL AND jsonb_array_length(p_media) > 0 THEN
    FOR media_item IN SELECT jsonb_array_elements(p_media)
    LOOP
      INSERT INTO social.post_media (
        post_id,
        media_type,
        url,
        poster_url,
        duration_seconds,
        width,
        height,
        file_size_bytes,
        order_index
      )
      VALUES (
        new_post.id,
        media_item->>'media_type',
        media_item->>'url',
        media_item->>'poster_url',
        NULLIF(media_item->>'duration_seconds', '')::NUMERIC,
        NULLIF(media_item->>'width', '')::INT,
        NULLIF(media_item->>'height', '')::INT,
        NULLIF(media_item->>'file_size_bytes', '')::BIGINT,
        COALESCE((media_item->>'order_index')::INT, 0)
      );
    END LOOP;
  END IF;

  RETURN new_post;
END;
$$ LANGUAGE plpgsql;
-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION social.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_posts_updated_at
  BEFORE UPDATE ON social.posts
  FOR EACH ROW
  EXECUTE FUNCTION social.set_updated_at();

CREATE TRIGGER trigger_post_comments_updated_at
  BEFORE UPDATE ON social.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION social.set_updated_at();

-- Prevent self-like on a post
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

CREATE TRIGGER trigger_prevent_self_like
  BEFORE INSERT ON social.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION social.prevent_self_like();

-- Prevent self-like on a comment
CREATE OR REPLACE FUNCTION social.prevent_comment_self_like()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM social.post_comments
    WHERE id = NEW.comment_id
    AND fursona_id = NEW.liker_fursona_id
  ) THEN
    RAISE EXCEPTION 'Cannot like your own comment';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_comment_self_like
  BEFORE INSERT ON social.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION social.prevent_comment_self_like();

-- Keep the denormalized counters on posts/comments in sync so the app
-- never has to run a manual COUNT(*) or an extra UPDATE. Fine as
-- per-row triggers because likes/comments/bookmarks/reyaps are
-- low-frequency compared to views (see the batched sync below for why
-- views_count is handled differently).
CREATE OR REPLACE FUNCTION social.adjust_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_likes_count
  AFTER INSERT OR DELETE ON social.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION social.adjust_post_likes_count();

CREATE OR REPLACE FUNCTION social.adjust_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_comments_count
  AFTER INSERT OR DELETE ON social.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION social.adjust_post_comments_count();

CREATE OR REPLACE FUNCTION social.adjust_post_bookmarks_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social.posts SET bookmarks_count = bookmarks_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social.posts SET bookmarks_count = bookmarks_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_bookmarks_count
  AFTER INSERT OR DELETE ON social.post_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION social.adjust_post_bookmarks_count();

CREATE OR REPLACE FUNCTION social.adjust_post_shares_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social.posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social.posts SET shares_count = shares_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_shares_count
  AFTER INSERT OR DELETE ON social.reyaps
  FOR EACH ROW
  EXECUTE FUNCTION social.adjust_post_shares_count();

CREATE OR REPLACE FUNCTION social.adjust_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social.post_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social.post_comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_likes_count
  AFTER INSERT OR DELETE ON social.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION social.adjust_comment_likes_count();

-- Batched sync of post_views -> posts.views_count. Deliberately NOT a
-- trigger-per-row like the counters above: view volume can be thousands
-- per second on a popular post, and a trigger there would serialize
-- writes on a single posts row. Instead, new sessions are counted in
-- batches on a schedule, using a watermark so each session is only
-- counted once (at insert time — later duration upserts don't recount it).
CREATE OR REPLACE FUNCTION social.sync_post_view_counts()
RETURNS void AS $$
DECLARE
  sync_started_at TIMESTAMP WITH TIME ZONE := now();
  last_sync TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT last_synced_at INTO last_sync FROM social.view_sync_state WHERE id = 1;

  UPDATE social.posts p
  SET views_count = p.views_count + v.new_sessions
  FROM (
    SELECT post_id, COUNT(*) AS new_sessions
    FROM social.post_views
    WHERE created_at > last_sync AND created_at <= sync_started_at
    GROUP BY post_id
  ) v
  WHERE p.id = v.post_id;

  UPDATE social.view_sync_state SET last_synced_at = sync_started_at WHERE id = 1;
END;
$$ LANGUAGE plpgsql;

-- Run every minute. Also requires pg_cron.
SELECT cron.schedule(
  'sync-post-view-counts',
  '* * * * *',
  $$SELECT social.sync_post_view_counts()$$
);


-- ============================================================================
-- MATERIALIZED VIEW: creator watch-time analytics
-- Daily rollup, not queried on every page load — refreshed on a schedule
-- and read by an analytics dashboard through a backend/service-role path
-- (materialized views can't have RLS, so this isn't granted to
-- `authenticated` directly).
-- ============================================================================
CREATE MATERIALIZED VIEW social.post_engagement_daily AS
SELECT
  post_id,
  date_trunc('day', created_at) AS day,
  COUNT(*) AS view_sessions,
  COUNT(DISTINCT viewer_fursona_id) AS unique_viewers,
  AVG(watch_duration_ms)::INT AS avg_watch_duration_ms,
  AVG(watched_percentage) AS avg_watched_percentage,
  SUM(CASE WHEN completed THEN 1 ELSE 0 END) AS completions
FROM social.post_views
GROUP BY post_id, date_trunc('day', created_at);

CREATE UNIQUE INDEX ON social.post_engagement_daily (post_id, day);

-- Nightly refresh. Also requires pg_cron.
SELECT cron.schedule(
  'refresh-post-engagement-daily',
  '30 2 * * *', -- 2:30am
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY social.post_engagement_daily$$
);


-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on tables
ALTER TABLE social.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.reyaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE social.post_reports ENABLE ROW LEVEL SECURITY;
-- social.view_sync_state intentionally has no RLS/grants: internal only.

--------------------------------------------------------------------------------

-- Policy: followers (read, follow/unfollow)
CREATE POLICY followers_select_public
  ON social.followers FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM core.fursonas
      WHERE id = social.followers.following_fursona_id AND is_active = true
    )
  );

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

-- Policy: posts
CREATE POLICY posts_select_public
  ON social.posts FOR SELECT
  USING (
    visibility = 'public' AND
    EXISTS(
      SELECT 1 FROM core.fursonas
      WHERE id = social.posts.fursona_id AND is_active = true
    )
  );

CREATE POLICY posts_select_followers
  ON social.posts FOR SELECT
  USING (
    visibility = 'followers' AND
    EXISTS (
      SELECT 1 FROM social.followers f
      JOIN core.fursonas viewer ON viewer.id = f.follower_fursona_id
      WHERE f.following_fursona_id = social.posts.fursona_id
      AND viewer.account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

CREATE POLICY posts_select_mutuals
  ON social.posts FOR SELECT
  USING (
    visibility = 'mutuals' AND
    EXISTS (
      SELECT 1 FROM social.followers f1
      JOIN social.followers f2
        ON f2.follower_fursona_id = f1.following_fursona_id
       AND f2.following_fursona_id = f1.follower_fursona_id
      JOIN core.fursonas viewer ON viewer.id = f1.follower_fursona_id
      WHERE f1.following_fursona_id = social.posts.fursona_id
      AND viewer.account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

CREATE POLICY posts_select_own
  ON social.posts FOR SELECT
  USING (
    fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

CREATE POLICY posts_insert_own
  ON social.posts FOR INSERT
  WITH CHECK (
    fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

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

CREATE POLICY posts_delete_own
  ON social.posts FOR DELETE
  USING (
    fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

-- Policy: post_media
CREATE POLICY post_media_select_public
  ON social.post_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM social.posts
      WHERE id = social.post_media.post_id AND visibility = 'public'
    )
  );

CREATE POLICY post_media_select_followers
  ON social.post_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM social.posts
      WHERE id = social.post_media.post_id AND visibility = 'followers'
    )
  );

CREATE POLICY post_media_select_mutuals
  ON social.post_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM social.posts
      WHERE id = social.post_media.post_id AND visibility = 'mutuals'
    )
  );

CREATE POLICY post_media_select_own
  ON social.post_media FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM social.posts WHERE fursona_id IN (
        SELECT id FROM core.fursonas
        WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY post_media_insert_own
  ON social.post_media FOR INSERT
  WITH CHECK (
    post_id IN (
      SELECT id FROM social.posts WHERE fursona_id IN (
        SELECT id FROM core.fursonas
        WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY post_media_delete_own
  ON social.post_media FOR DELETE
  USING (
    post_id IN (
      SELECT id FROM social.posts WHERE fursona_id IN (
        SELECT id FROM core.fursonas
        WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
      )
    )
  );

-- Policy: reyaps
CREATE POLICY reyaps_select_public
  ON social.reyaps FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM social.posts
      WHERE id = social.reyaps.post_id AND visibility = 'public'
    )
  );

CREATE POLICY reyaps_select_followers
  ON social.reyaps FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM social.posts
      WHERE id = social.reyaps.post_id AND visibility = 'followers'
    )
  );

CREATE POLICY reyaps_select_mutuals
  ON social.reyaps FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM social.posts
      WHERE id = social.reyaps.post_id AND visibility = 'mutuals'
    )
  );

CREATE POLICY reyaps_insert_own
  ON social.reyaps FOR INSERT
  WITH CHECK (
    fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

CREATE POLICY reyaps_delete_own
  ON social.reyaps FOR DELETE
  USING (
    fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

------ Policy: views -------------------------------------------------------------
CREATE POLICY post_views_insert_own
  ON social.post_views FOR INSERT
  WITH CHECK (
    viewer_fursona_id IS NULL
    OR viewer_fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

CREATE POLICY post_views_update_own
  ON social.post_views FOR UPDATE
  USING (
    viewer_fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

-- view data exposed to the post's author
CREATE POLICY post_views_select_own_post_analytics
  ON social.post_views FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM social.posts WHERE fursona_id IN (
        SELECT id FROM core.fursonas
        WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
      )
    )
  );

------ Policy: post_likes ---------------------------------------------
CREATE POLICY post_likes_select_public
  ON social.post_likes FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM social.posts
      WHERE id = social.post_likes.post_id AND visibility = 'public'
    )
  );

CREATE POLICY post_likes_select_followers
  ON social.post_likes FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM social.posts
      WHERE id = social.post_likes.post_id AND visibility = 'followers'
    )
  );

CREATE POLICY post_likes_select_mutuals
  ON social.post_likes FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM social.posts
      WHERE id = social.post_likes.post_id AND visibility = 'mutuals'
    )
  );

CREATE POLICY post_likes_insert_own
  ON social.post_likes FOR INSERT
  WITH CHECK (
    liker_fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

CREATE POLICY post_likes_delete_own
  ON social.post_likes FOR DELETE
  USING (
    liker_fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

------ Policy: bookmarks (private to the bookmarking fursona) -----------------------
CREATE POLICY post_bookmarks_select_own
  ON social.post_bookmarks FOR SELECT
  USING (
    fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

CREATE POLICY post_bookmarks_insert_own
  ON social.post_bookmarks FOR INSERT
  WITH CHECK (
    fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

CREATE POLICY post_bookmarks_delete_own
  ON social.post_bookmarks FOR DELETE
  USING (
    fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

------ Policy: post_comments / comment_likes -----------------------------------------
CREATE POLICY post_comments_select_public
  ON social.post_comments FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM social.posts
      WHERE id = social.post_comments.post_id AND visibility = 'public'
    )
  );

CREATE POLICY post_comments_insert_own
  ON social.post_comments FOR INSERT
  WITH CHECK (
    fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

CREATE POLICY post_comments_update_own
  ON social.post_comments FOR UPDATE
  USING (
    fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

CREATE POLICY post_comments_delete_own
  ON social.post_comments FOR DELETE
  USING (
    fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

CREATE POLICY comment_likes_select_public
  ON social.comment_likes FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM social.post_comments
      WHERE id = social.comment_likes.comment_id AND is_deleted = false
    )
  );

CREATE POLICY comment_likes_insert_own
  ON social.comment_likes FOR INSERT
  WITH CHECK (
    liker_fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

CREATE POLICY comment_likes_delete_own
  ON social.comment_likes FOR DELETE
  USING (
    liker_fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

------ Policy: reports -------------------------------------------------------------
CREATE POLICY reports_insert_own
  ON social.post_reports FOR INSERT
  WITH CHECK (
    reporter_fursona_id IN (
      SELECT id FROM core.fursonas
      WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
    )
  );

CREATE POLICY reports_select_own
  ON social.post_reports FOR SELECT
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
GRANT SELECT, INSERT, DELETE ON social.post_media TO authenticated;
GRANT SELECT, INSERT, DELETE ON social.reyaps TO authenticated;
GRANT SELECT, INSERT, UPDATE ON social.post_views TO authenticated;
GRANT SELECT, INSERT, DELETE ON social.post_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON social.post_comments TO authenticated;
GRANT SELECT, INSERT, DELETE ON social.comment_likes TO authenticated;
GRANT SELECT, INSERT, DELETE ON social.post_bookmarks TO authenticated;
GRANT SELECT, INSERT ON social.post_reports TO authenticated;


-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE social.followers IS 'Track follower relationships between fursonas';

COMMENT ON TABLE social.posts IS 'Unified content table: yaps (tweets), reels (videos) and galleries (texts/images), split by post_type';

COMMENT ON TABLE social.post_media IS 'One row per media asset attached to a post; galleries have several, yaps have zero or several, and reels have one';

COMMENT ON TABLE social.reyaps IS 'Repost of a yap posts, with optional added commentary';

COMMENT ON TABLE social.post_views IS 'Per-session view/watch-time log, partitioned monthly. Raw rows are only readable by the post owner (analytics); posts.views_count is the public';

COMMENT ON TABLE social.post_likes IS 'Likes on posts';

COMMENT ON TABLE social.post_comments IS 'Comments on posts';

COMMENT ON TABLE social.comment_likes IS 'Likes on comments';

COMMENT ON TABLE social.post_bookmarks IS 'Bookmarked posts, private to the bookmarking fursona';

COMMENT ON TABLE social.post_reports IS 'Reports for inappropriate content or conduct';


COMMENT ON COLUMN social.followers.follower_fursona_id IS 'Fursona doing the following';
COMMENT ON COLUMN social.followers.following_fursona_id IS 'Fursona being followed';

COMMENT ON COLUMN social.posts.post_type IS 'yap = twitter, reel = tiktok, gallery = instagram';
COMMENT ON COLUMN social.posts.visibility IS 'public | followers | mutuals | private | archived';

COMMENT ON COLUMN social.post_comments.parent_id IS 'NULL = top level comment, set = reply to another comment';
COMMENT ON COLUMN social.post_comments.is_deleted IS 'Soft delete to preserve thread structure — content cleared but record kept';
