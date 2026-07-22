-- ============================================================================
-- SCHEMA: media
-- Media management and storage integration
-- ============================================================================
-- CREATE SCHEMA IF NOT EXISTS media;

-- ============================================================================
-- TABLE: fursona_media
-- Track fursona media files with default handling
-- ============================================================================
-- CREATE TABLE media.fursona_media (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,

--   -- Media details
--   file_type TEXT NOT NULL,
--   media_type TEXT NOT NULL,
--   file_size INT NOT NULL,
--   file_path TEXT NOT NULL UNIQUE,
--   storage_bucket TEXT NOT NULL,
  
--   -- Media metadata
--   file_name TEXT NOT NULL,
--   mime_type TEXT NOT NULL,
--   width INT,
--   height INT,
  
--   -- CDN/URL
--   public_url TEXT,
  
--   -- Status
--   is_default BOOLEAN DEFAULT false NOT NULL,
--   is_primary BOOLEAN DEFAULT false NOT NULL,
--   is_active BOOLEAN DEFAULT true NOT NULL,
  
--   -- Metadata
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
--   CONSTRAINT valid_file_type CHECK (file_type IN ('image', 'video', 'gif')),
--   CONSTRAINT valid_media_type CHECK (media_type IN ('avatar', 'banner', 'gallery')),
--   CONSTRAINT valid_mime_type CHECK (
--     mime_type IN (
--       'image/jpeg', 'image/png', 'image/webp', 'image/gif',
--       'video/mp4', 'video/webm'
--     )
--   ),
--   CONSTRAINT positive_file_size CHECK (file_size > 0),
--   CONSTRAINT positive_dimensions CHECK (
--     (width IS NULL OR width > 0) AND (height IS NULL OR height > 0)
--   )
-- );

-- ============================================================================
-- TABLE: social.post_media
-- Tracks media attached to posts
-- ============================================================================
-- CREATE TABLE social.post_media (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   post_id UUID NOT NULL REFERENCES social.posts(id) ON DELETE CASCADE,
--   fursona_id UUID NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,

--   -- Storage
--   file_path TEXT NOT NULL UNIQUE,
--   storage_bucket TEXT NOT NULL DEFAULT 'post-media',
--   public_url TEXT NOT NULL,

--   -- File details
--   file_name TEXT NOT NULL,
--   file_size INT NOT NULL,
--   mime_type TEXT NOT NULL,
--   file_type TEXT NOT NULL,

--   -- Media metadata
--   width INT,
--   height INT,
--   duration_seconds NUMERIC, -- for video

--   -- Ordering within a post
--   position SMALLINT NOT NULL DEFAULT 0,

--   -- Metadata
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

--   CONSTRAINT valid_mime_type CHECK (
--     mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm')
--   ),
--   CONSTRAINT valid_file_type CHECK (file_type IN ('image', 'video', 'gif')),
--   CONSTRAINT positive_file_size CHECK (file_size > 0),
--   CONSTRAINT valid_position CHECK (position >= 0)
-- );

-- ============================================================================
-- TABLE: media_processing_queue
-- Track media processing jobs (resize, optimize, etc)
-- ============================================================================
-- CREATE TABLE media.media_processing_queue (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   media_id UUID NOT NULL REFERENCES media.fursona_media(id) ON DELETE CASCADE,
  
--   -- Processing details
--   processing_type TEXT NOT NULL,
--   status TEXT DEFAULT 'pending' NOT NULL,
  
--   -- Results
--   result_url TEXT,
--   error_message TEXT,
  
--   -- Metadata
--   retries INT DEFAULT 0 NOT NULL,
--   max_retries INT DEFAULT 3 NOT NULL,
  
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
--   CONSTRAINT valid_processing_type CHECK (processing_type IN ('resize', 'optimize', 'convert', 'thumbnail')),
--   CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
--   CONSTRAINT valid_retries CHECK (retries <= max_retries)
-- );


-- ============================================================================
-- INDEXES
-- ============================================================================
-- CREATE INDEX idx_fursona_media_fursona ON media.fursona_media(fursona_id);
-- CREATE INDEX idx_fursona_media_type ON media.fursona_media(fursona_id, media_type);
-- CREATE INDEX idx_fursona_media_primary ON media.fursona_media(fursona_id, is_primary);
-- CREATE INDEX idx_fursona_media_default ON media.fursona_media(fursona_id, is_default);

-- CREATE INDEX idx_post_media_post ON social.post_media(post_id);
-- CREATE INDEX idx_post_media_fursona ON social.post_media(fursona_id);

-- CREATE INDEX idx_media_queue_status ON media.media_processing_queue(status);
-- CREATE INDEX idx_media_queue_media ON media.media_processing_queue(media_id);
-- CREATE INDEX idx_media_queue_created ON media.media_processing_queue(created_at DESC);

-- ============================================================================
-- FUNCTION: Set default media for fursona
-- Ensures only one primary media per type
-- ============================================================================
-- CREATE OR REPLACE FUNCTION media.set_media_as_primary()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.is_primary = true THEN
--     -- Remove primary status from other media of same type
--     UPDATE media.fursona_media
--     SET is_primary = false
--     WHERE fursona_id = NEW.fursona_id
--       AND media_type = NEW.media_type
--       AND id != NEW.id
--       AND is_primary = true;
--   END IF;
  
--   NEW.updated_at := now();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Enforce one primary media per type per fursona
-- ============================================================================
-- CREATE TRIGGER trigger_set_media_as_primary
--   BEFORE INSERT OR UPDATE ON media.fursona_media
--   FOR EACH ROW
--   EXECUTE FUNCTION media.set_media_as_primary();

-- ============================================================================
-- FUNCTION: Update fursona media URL when primary changes
-- ============================================================================
-- CREATE OR REPLACE FUNCTION media.update_fursona_media_url()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.is_primary = true AND OLD.is_primary = false THEN
--     -- Update fursona's URL for this media type
--     IF NEW.media_type = 'avatar' THEN
--       UPDATE core.fursonas
--       SET avatar_url = NEW.public_url, updated_at = now()
--       WHERE id = NEW.fursona_id;
--     ELSIF NEW.media_type = 'banner' THEN
--       UPDATE core.fursonas
--       SET banner_url = NEW.public_url, updated_at = now()
--       WHERE id = NEW.fursona_id;
--     END IF;
--   END IF;
  
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Update fursona URLs on primary media change
-- ============================================================================
-- CREATE TRIGGER trigger_update_fursona_media_url
--   AFTER UPDATE ON media.fursona_media
--   FOR EACH ROW
--   EXECUTE FUNCTION media.update_fursona_media_url();

-- ============================================================================
-- FUNCTION: Auto-update processing queue timestamp
-- ============================================================================
-- CREATE OR REPLACE FUNCTION media.update_queue_timestamp()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at := now();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Update processing queue timestamp
-- ============================================================================
-- CREATE TRIGGER trigger_update_queue_timestamp
--   BEFORE UPDATE ON media.media_processing_queue
--   FOR EACH ROW
--   EXECUTE FUNCTION media.update_queue_timestamp();

-- ============================================================================
-- FUNCTION: Handle failed media processing
-- Auto-retry with exponential backoff
-- ============================================================================
-- CREATE OR REPLACE FUNCTION media.handle_failed_media_processing()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.status = 'failed' AND NEW.retries < NEW.max_retries THEN
--     -- Retry will be handled by worker, just track it
--     NEW.retries := NEW.retries + 1;
--   END IF;
  
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Handle failed processing
-- ============================================================================
-- CREATE TRIGGER trigger_handle_failed_processing
--   BEFORE UPDATE ON media.media_processing_queue
--   FOR EACH ROW
--   WHEN (OLD.status != 'failed' AND NEW.status = 'failed')
--   EXECUTE FUNCTION media.handle_failed_media_processing();


-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on media tables
-- ALTER TABLE media.fursona_media ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE media.media_processing_queue ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE media.post_media ENABLE ROW LEVEL SECURITY;

-- ALTER TABLE social.post_media ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FURSONA_MEDIA POLICIES
-- ============================================================================
-- Policy: View media from active fursonas
-- CREATE POLICY fursona_media_select_public
--   ON media.fursona_media FOR SELECT
--   USING (
--     is_active = true AND
--     EXISTS(
--       SELECT 1 FROM core.fursonas 
--       WHERE id = media.fursona_media.fursona_id AND is_active = true
--     )
--   );

-- -- Policy: Users can view media from their own fursonas
-- CREATE POLICY fursona_media_select_own
--   ON media.fursona_media FOR SELECT
--   USING (
--     fursona_id IN (
--       SELECT id FROM core.fursonas 
--       WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
--     )
--   );

-- -- Policy: Users can insert media for their fursonas
-- CREATE POLICY fursona_media_insert_own
--   ON media.fursona_media FOR INSERT
--   WITH CHECK (
--     fursona_id IN (
--       SELECT id FROM core.fursonas 
--       WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
--     )
--   );

-- Policy: Users can update their own media
-- CREATE POLICY fursona_media_update_own
--   ON media.fursona_media FOR UPDATE
--   USING (
--     fursona_id IN (
--       SELECT id FROM core.fursonas 
--       WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
--     )
--   )
--   WITH CHECK (
--     fursona_id IN (
--       SELECT id FROM core.fursonas 
--       WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
--     )
--   );

-- -- Policy: Users can delete their own media
-- CREATE POLICY fursona_media_delete_own
--   ON media.fursona_media FOR DELETE
--   USING (
--     fursona_id IN (
--       SELECT id FROM core.fursonas 
--       WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
--     )
--   );

-- ============================================================================
-- POST_MEDIA POLICIES
-- ============================================================================
-- Policy view published media
-- CREATE POLICY post_media_select_public
--   ON social.post_media FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM social.posts
--       WHERE id = social.post_media.post_id AND is_published = true
--     )
--   );

-- -- Policy: Users can post their own media
-- CREATE POLICY post_media_insert_own
--   ON social.post_media FOR INSERT
--   WITH CHECK (
--     fursona_id IN (
--       SELECT id FROM core.fursonas
--       WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
--     )
--   );

-- -- Policy: Users can delete their own post media
-- CREATE POLICY post_media_delete_own
--   ON social.post_media FOR DELETE
--   USING (
--     fursona_id IN (
--       SELECT id FROM core.fursonas
--       WHERE account_id = (SELECT id FROM core.accounts WHERE user_id = auth.uid())
--     )
--   );

-- ============================================================================
-- MEDIA_PROCESSING_QUEUE POLICIES
-- ============================================================================
-- Policy: Service role only for queue management
-- CREATE POLICY media_queue_all_service_role
--   ON media.media_processing_queue
--   USING (auth.role() = 'service_role');

-- ============================================================================
-- STORAGE INTEGRATION (Bucket creation in separate script)
-- ============================================================================
-- NOTE: Create storage buckets using Supabase CLI or dashboard:
-- 
-- 1. fursona-avatars:
--    - Max file size: 5MB
--    - Allowed MIME types: image/jpeg, image/png, image/webp
--    - Public access for reading
--
-- 2. fursona-banners:
--    - Max file size: 10MB
--    - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
--    - Public access for reading
--
-- 3. fursona-gallery:
--    - Max file size: 20MB
--    - Allowed MIME types: image/*, video/mp4, video/webm
--    - Private (authenticated only)
--
-- Bucket policies should enforce:
-- - Users can only upload to their own fursona folder
-- - File paths: fursona-{media_type}/{account_id}/{fursona_id}/{file_id}

-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

-- COMMENT ON TABLE media.fursona_media IS 'Tracks fursona media files stored in Supabase Storage';
-- COMMENT ON TABLE media.media_processing_queue IS 'Queue for async media processing tasks (resize, optimize)';

-- COMMENT ON COLUMN media.fursona_media.media_type IS 'Type of media: avatar, banner, or gallery';
-- COMMENT ON COLUMN media.fursona_media.is_primary IS 'Primary media for this type (shown in profile)';
-- COMMENT ON COLUMN media.fursona_media.is_default IS 'Default system media (not user-uploaded)';
-- COMMENT ON COLUMN media.fursona_media.storage_bucket IS 'Supabase Storage bucket name';
-- COMMENT ON COLUMN media.fursona_media.file_path IS 'Path within the storage bucket';
-- COMMENT ON COLUMN media.fursona_media.public_url IS 'Public URL for accessing the media';

-- COMMENT ON COLUMN media.media_processing_queue.processing_type IS 'Type of processing: resize, optimize, convert, thumbnail';
-- COMMENT ON COLUMN media.media_processing_queue.status IS 'Current status of processing job';
