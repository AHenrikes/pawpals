-- ============================================================================
-- PAWPALS DATABASE SCHEMA DIAGRAM
-- Visual reference for the complete database structure
-- ============================================================================

/*

SCHEMA OVERVIEW:
================

┌──────────────────────────────────────────────────────────────────────┐
│                         SUPABASE AUTH                                │
│                      (auth.users - external)                         │
└──────────────────────────────────────────────┬───────────────────────┘
                                              │
                                              │ user_id (FK)
                                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│                        CORE SCHEMA                                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ ACCOUNTS                                                    │     │
│  ├─────────────────────────────────────────────────────────────┤     │
│  │ id (PK UUID)                                                │     │
│  │ user_id (FK auth.users, UNIQUE)                             |     |
│  │ firstname text                                              │     │
│  │ lastname text                                               │     │
│  │ dob date                                                    │     │
│  │ account_role                                                │     │
│  │ email (UNIQUE)                                              │     │
│  │ is_active, is_suspended, suspension_reaason                 │     │
│  │ created_at, updated_at (AUTO)                               │     │
│  └────────────────────────┬────────────────────────────────────┘     │
│                           │                                          │
│                           │ account_id (1:N) - MIN 1, MAX 3          │
│                           ↓                                          │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ FURSONAS                                                    │     │
│  ├─────────────────────────────────────────────────────────────┤     │
│  │ id (PK UUID)                                                │     │
│  │ account_id (FK)                                             │     │
│  │ display_name, username (UNIQUE)                             │     │
│  │ bio, species, pronouns                                      │     │
│  │ avatar_url (from media.fursona_media PRIMARY avatar)        │     │  
│  │ banner_url (from media.fursona_media PRIMARY banner)        │     │  
│  │ is_default (UNIQUE per account)                             │     │
│  │ is_current (UNIQUE per account)                             │     │
│  │ is_active, reputation                                       │     │
│  │ created_at, updated_at (AUTO)                               │     │  
│  └────────┬──────────────────────────────┬─────────────────────┘     │
│           │                              │                           │
│           │ fursona_id (1:N)             │ fursona_id (1:N)          │  
│           ↓                              ↓                           │
│      SOCIAL TABLES              MEDIA TABLES                         │
│   (see SOCIAL SCHEMA)           (see MEDIA SCHEMA)                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│                       SOCIAL SCHEMA                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────┐        ┌──────────────────────┐            │
│  │ FOLLOWERS            │        │ LIKES                │            │
│  ├──────────────────────┤        ├──────────────────────┤            │
│  │ id (PK UUID)         │        │ id (PK UUID)         │            │
│  │ follower_fursona_id  │        │ liker_fursona_id     │            │
│  │ following_fursona_id │        │ liked_fursona_id     │            │
│  │ created_at           │        │ created_at           │            │
│  │ (UNIQUE, NO SELF)    │        │ (UNIQUE, NO SELF)    │            │
│  └──────────────────────┘        └──────────────────────┘            │
│           ↓ reputation++                    ↓ likes_count++          │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐      │
│  │ POSTS                                                      │      │
│  ├────────────────────────────────────────────────────────────┤      │
│  │ id (PK UUID)                                               │      │
│  │ fursona_id (FK)                                            │      │
│  │ title, content                                             │      │
│  │ media_urls (TEXT[])                                        │      │
│  │ likes_count (AUTO), comments_count                         │      │
│  │ is_published, created_at, updated_at (AUTO)                │      │
│  └────────────────────────────────────────────────────────────┘      │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐      │
│  │ REPORTS                                                    │      │
│  ├────────────────────────────────────────────────────────────┤      │
│  │ id (PK UUID)                                               │      │
│  │ reporter_fursona_id (FK)                                   │      │
│  │ reported_fursona_id OR reported_post_id (FK)               │      │
│  │ reason, description                                        │      │
│  │ status (pending|reviewing|resolved|dismissed)              │      │
│  │ reviewed_by (FK accounts), reviewed_at                     │      │
│  │ created_at                                                 │      │
│  └────────────────────────────────────────────────────────────┘      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────┐
│                       MEDIA SCHEMA                                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐      │
│  │ FURSONA_MEDIA                                              │      │
│  ├────────────────────────────────────────────────────────────┤      │
│  │ id (PK UUID)                                               │      │
│  │ fursona_id (FK)                                            │      │
│  │ file_type (image|video|gif)                                │      │
│  │ media_type (avatar|banner|gallery)                         │      │
│  │ file_size, file_path (UNIQUE), storage_bucket              │      │
│  │ file_name, mime_type                                       │      │
│  │ width, height (dimensions)                                 │      │
│  │ public_url (CDN/storage URL)                               │      │
│  │ is_default (system default)                                │      │
│  │ is_primary (ONE per media_type per fursona)                │      │
│  │ is_active, created_at, updated_at (AUTO)                   │      │
│  └─────────────────────────┬────────────────────────────────  ┘      │
│                            │                                         │
│                            │ media_id (1:N)                          │
│                            ↓                                         │
│  ┌────────────────────────────────────────────────────────────┐      │
│  │ MEDIA_PROCESSING_QUEUE                                     │      │
│  ├────────────────────────────────────────────────────────────┤      │
│  │ id (PK UUID)                                               │      │
│  │ media_id (FK)                                              │      │
│  │ processing_type (resize|optimize|convert|thumbnail)        │      │
│  │ status (pending|processing|completed|failed)               │      │
│  │ result_url, error_message                                  │      │
│  │ retries, max_retries (auto-retry logic)                    │      │
│  │ created_at, updated_at (AUTO)                              │      │
│  └────────────────────────────────────────────────────────────┘      │
│                                                                      │
│  STORAGE BUCKETS:                                                    │
│  ├── fursona-avatars (5MB, public)                                   │
│  │   ├── Format: {account_id}/{fursona_id}/{file_id}.webp            │
│  │   └── Types: JPEG, PNG, WebP                                      │
│  │                                                                   │
│  ├── fursona-banners (10MB, public)                                  │
│  │   ├── Format: {account_id}/{fursona_id}/{file_id}.webp            │
│  │   └── Types: JPEG, PNG, WebP, GIF                                 │
│  │                                                                   │
│  └── fursona-gallery (20MB, private, signed URLs)                    │
│      ├── Format: {account_id}/{fursona_id}/{file_id}                 │
│      └── Types: JPEG, PNG, WebP, GIF, MP4, WebM                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘


RELATIONSHIPS SUMMARY:
======================

core.accounts (1) ──→ (N) core.fursonas
  - 1 account owns 1-3 fursonas
  - Minimum 1 fursona enforced
  - Can't delete last fursona

core.fursonas (1) ──→ (N) social.followers (as follower_fursona_id)
  - A fursona can follow many others

core.fursonas (1) ──→ (N) social.followers (as following_fursona_id)
  - A fursona can be followed by many others
  - Updates reputation on follow/unfollow

core.fursonas (1) ──→ (N) social.likes
  - A fursona can like many others
  - Can't self-like

core.fursonas (1) ──→ (N) social.posts
  - A fursona can create many posts

core.fursonas (1) ──→ (N) media.fursona_media
  - Avatar media: is_primary determines avatar_url
  - Banner media: is_primary determines banner_url
  - Gallery media: is_primary for featured item

media.fursona_media (1) ──→ (N) media.media_processing_queue
  - Media can have multiple processing jobs


CONSTRAINTS & ENFORCEMENT:
===========================

FURSONA CONSTRAINTS:
  ✓ account_id + is_default UNIQUE (1 default per account)
  ✓ account_id + is_current UNIQUE (1 current per account)
  ✓ username UNIQUE (globally unique)
  ✓ Max 3 fursonas per account (CHECK constraint)
  ✓ Min 1 fursonas per account (TRIGGER enforced)
  ✓ username matches: ^[a-zA-Z0-9_-]{3,50}$
  ✓ display_name: 1-100 chars

SOCIAL CONSTRAINTS:
  ✓ follower_fursona_id ≠ following_fursona_id (no self-follow)
  ✓ liker_fursona_id ≠ liked_fursona_id (no self-like)
  ✓ UNIQUE(follower, following) - can't follow twice
  ✓ UNIQUE(liker, liked) - can't like twice
  ✓ status IN ('pending', 'reviewing', 'resolved', 'dismissed')
  ✓ reason IN ('harassment', 'spam', 'inappropriate', 'stolen_art', 'other')

MEDIA CONSTRAINTS:
  ✓ is_primary UNIQUE per (fursona, media_type)
  ✓ file_size > 0
  ✓ MIME types validated
  ✓ Dimensions > 0 if specified

BUCKET CONSTRAINTS:
  ✓ avatars: 5MB max, JPEG|PNG|WebP
  ✓ banners: 10MB max, JPEG|PNG|WebP|GIF
  ✓ gallery: 20MB max, images + videos
  ✓ File path format enforced by policy: {account_id}/{fursona_id}/{file_id}


AUTOMATIC OPERATIONS:
======================

ON ACCOUNT CREATION:
  1. Account inserted
  2. Trigger: create_initial_fursona()
     - Generates username from email
     - Creates default fursona
     - Sets is_default = true, is_current = true
     - Assigns default avatar/banner from DiceBear API

ON FOLLOW:
  1. Follow inserted
  2. Trigger: update_follower_count()
     - Increments reputation of followed fursona

ON UNFOLLOW:
  1. Follow deleted
  2. Trigger: update_follower_count()
     - Decrements reputation of unfollowed fursona

ON FURSONA UPDATE:
  1. Before update
     - If is_active → false AND was is_current → true:
       - Auto-switch is_current to default fursona
  2. After update
     - updated_at timestamp set

ON MEDIA PRIMARY CHANGE:
  1. Media is_primary changed to true
  2. Trigger: set_media_as_primary()
     - Unsets is_primary on other media of same type
  3. Trigger: update_fursona_media_url()
     - If avatar: update fursona.avatar_url
     - If banner: update fursona.banner_url

ON FURSONA DELETE:
  1. Before delete
     - Check: is this the last active fursona? REJECT
     - If was is_current: switch to is_default
  2. After delete (CASCADE)
     - Deletes all social data
     - Deletes all media files
     - Resets reputation


ROW LEVEL SECURITY (RLS):
==========================

core.accounts:
  SELECT: auth.uid() = user_id
  UPDATE: auth.uid() = user_id
  INSERT: auth.uid() = user_id
  DELETE: Not allowed at RLS level (handled via function)

core.fursonas:
  SELECT (own): account_id owned by user
  SELECT (public): is_active = true
  INSERT (own): account_id owned by user
  UPDATE (own): account_id owned by user
  DELETE (own): account_id owned by user

social tables (public):
  SELECT: Active fursonas only
  INSERT/UPDATE/DELETE: Own content only

media tables:
  SELECT (own): fursona owned by user
  SELECT (public): is_active = true (for public media)
  INSERT/UPDATE/DELETE: Own media only
  (service_role for queue management)

storage buckets:
  Upload: To own folder {auth.uid()}/{fursona_id}/...
  Read: Public buckets, authenticated for gallery
  Delete: Own files only

*/
