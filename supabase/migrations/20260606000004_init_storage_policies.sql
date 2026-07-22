-- ============================================================================
-- STORAGE BUCKET & POLICIES
-- Applied to Supabase Storage buckets for media
-- ============================================================================

-- ============================================================================
-- STORAGE: FURSONA-AVATARS BUCKET
-- ============================================================================
-- Policy: Authenticated users can read all avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fursona-avatars',
  'fursona-avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STORAGE: FURSONA-BANNERS BUCKET
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fursona-banners',
  'fursona-banners',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STORAGE: POST_MEDIA BUCKET
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true,
  20971520, -- 20MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
) ON CONFLICT DO NOTHING;


-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- ============================================================================
-- FURSONA-AVATARS
-- ============================================================================
-- Users can upload to their own fursona avatar folder
CREATE POLICY "Users upload avatars for own fursonas"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fursona-avatars' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM core.accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own avatar uploads"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'fursona-avatars' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM core.accounts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'fursona-avatars' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM core.accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete own avatar uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'fursona-avatars' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM core.accounts WHERE user_id = auth.uid()
    )
  );

-- Public read access to avatars
CREATE POLICY "Public read avatar access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fursona-avatars');

-- ============================================================================
-- FURSONA-BANNERS
-- ============================================================================
-- Users can upload to their own fursona banner folder
CREATE POLICY "Users upload banners for own fursonas"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fursona-banners' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM core.accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own banner uploads"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'fursona-banners' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM core.accounts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'fursona-banners' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM core.accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete own banner uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'fursona-banners' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM core.accounts WHERE user_id = auth.uid()
    )
  );

-- Public read access to banners
CREATE POLICY "Public read banner access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fursona-banners');

-- ============================================================================
-- POST_MEDIA
-- ============================================================================
CREATE POLICY "Users upload post media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-media' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM core.accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete own post media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-media' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM core.accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public read post media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-media');

-- ============================================================================
-- FURSONA-GALLERY BUCKET POLICIES
-- ============================================================================
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'fursona-gallery',
--   'fursona-gallery',
--   false,
--   20971520, -- 20MB
--   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
-- )
-- ON CONFLICT DO NOTHING;

-- -- Users can upload to their own gallery folder
-- CREATE POLICY "Users upload gallery media"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'fursona-gallery' AND
--     auth.uid()::text = (storage.foldername(name))[2]
--   );

-- -- Users can update own gallery uploads
-- CREATE POLICY "Users update own gallery uploads"
--   ON storage.objects FOR UPDATE
--   USING (
--     bucket_id = 'fursona-gallery' AND
--     auth.uid()::text = (storage.foldername(name))[2]
--   )
--   WITH CHECK (
--     bucket_id = 'fursona-gallery' AND
--     auth.uid()::text = (storage.foldername(name))[2]
--   );

-- Users can delete own gallery uploads
-- CREATE POLICY "Users delete own gallery uploads"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'fursona-gallery' AND
--     auth.uid()::text = (storage.foldername(name))[2]
--   );

-- -- Users can read from gallery (authenticated only)
-- CREATE POLICY "Users read gallery media"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'fursona-gallery' AND
--     auth.role() = 'authenticated'
--   );

-- ============================================================================
-- STORAGE BUCKET DOCUMENTATION
-- ============================================================================

/*
STORAGE BUCKET STRUCTURE:

Each bucket follows this folder structure:
  {account_id}/{fursona_id}/{file_id}.{extension}

Examples:
  fursona-avatars/550e8400-e29b-41d4-a716-446655440000/123e4567-e89b-12d3-a456-426614174000/avatar.webp
  fursona-banners/550e8400-e29b-41d4-a716-446655440000/123e4567-e89b-12d3-a456-426614174000/banner.png
  fursona-gallery/550e8400-e29b-41d4-a716-446655440000/123e4567-e89b-12d3-a456-426614174000/image1.jpg

FILE NAMING CONVENTIONS:
- Use UUID for file_id to ensure uniqueness
- Preserve file extension for MIME type detection
- Never store sensitive info in file paths

PUBLIC URLS:
- Avatars: https://{PROJECT_ID}.supabase.co/storage/v1/object/public/fursona-avatars/{account_id}/{fursona_id}/{file_id}
- Banners: https://{PROJECT_ID}.supabase.co/storage/v1/object/public/fursona-banners/{account_id}/{fursona_id}/{file_id}
- Gallery: Requires signed URL (not public)

SIGNED URLS (for private gallery):
- Use Supabase client: supabase.storage.from('fursona-gallery').createSignedUrl(path, 3600)
- 3600 seconds = 1 hour validity
*/
