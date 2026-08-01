# Pawpals Database Migrations

Supabase migrations for the Pawpals application. These migrations set up schemas, tables, policies, functions, and triggers for user accounts, fursonas, social features, and media management.

## Migration Files

### 1. `20260606000001_init_accounts_and_fursonas.sql`

**Core account and fursona management**

**Tables:**

- `core.accounts` - User account profiles linked to Supabase auth
- `core.fursonas` - Fursona profiles with media URLs

**Constraints:**

- Maximum 3 fursonas per account
- Minimum 1 fursona per account (can't delete all)
- Only one current fursona per account
- Only one default fursona per account

**Functions & Triggers:**

- `create_initial_fursona()` - Auto-creates default fursona on account creation
- `ensure_minimum_fursona()` - Prevents deletion of last fursona
- `handle_fursona_update()` - Auto-switches to default if current is deactivated
- `update_account_timestamp()` - Auto-updates account timestamp on changes

**RLS Policies:**

- Users can only view/modify their own accounts
- Users can view/create fursonas for their accounts
- Public can view active fursonas

---

### 2. `20260606000002_init_social_features.sql`

**Social interactions and community features**

**Tables:**

- `social.followers` - Follow relationships between fursonas
- `social.likes` - Likes on fursonas
- `social.posts` - Content/posts by fursonas
- `social.reports` - Moderation reports

**Functions & Triggers:**

- `update_follower_count()` - Automatically updates reputation on follow/unfollow
- `update_post_like_count()` - Tracks likes on posts
- `update_post_timestamp()` - Auto-updates post modification time

**RLS Policies:**

- Public can view published posts and active fursonas
- Users can only manage their own follows, likes, and posts
- Users can report inappropriate content
- Moderation team can review reports (future-proof)

**Constraints:**

- No self-follows or self-likes
- Unique follow/like relationships
- Valid report reasons

---

### 3. `20260606000003_init_media_storage.sql`

**Media file management and Supabase Storage integration**

**Tables:**

- `media.fursona_media` - Track media files (avatar, banner, gallery)
- `media.media_processing_queue` - Async jobs (resize, optimize, convert)

**Features:**

- Default media handling with system defaults
- Primary media per type (avatar/banner)
- Media processing queue with retry logic
- Integration with Supabase Storage

**Functions & Triggers:**

- `set_media_as_primary()` - Ensures only one primary per type
- `update_fursona_media_url()` - Updates fursona URLs when primary changes
- `update_queue_timestamp()` - Auto-timestamps queue updates
- `handle_failed_media_processing()` - Retry logic for failed jobs

**RLS Policies:**

- Users can manage media for their fursonas
- Service role can manage processing queue

---

### 4. `20260606000004_init_storage_policies.sql`

**Supabase Storage bucket configuration and policies**

**Buckets:**

1. `fursona-avatars` (5MB, public)
   - JPEG, PNG, WebP
   - Public read access

2. `fursona-banners` (10MB, public)
   - JPEG, PNG, WebP, GIF
   - Public read access

3. `fursona-gallery` (20MB, private)
   - All images and videos
   - Authenticated read access only
   - Requires signed URLs

**Path Structure:**

```
{bucket}/{account_id}/{fursona_id}/{file_id}.{extension}
```

**Policies:**

- Users can only upload to their own folder
- Public/authenticated read access as appropriate
- Users can update and delete own files

---

### 5. `20260606000005_utility_views_and_functions.sql`

**Helper views and functions for common queries**

**Functions:**

- `get_user_profile()` - Get current user with active fursona
- `get_fursona_profile(username)` - Get detailed fursona profile with stats
- `search_fursonas(search_term)` - Search by username/display name
- `switch_current_fursona(id)` - Switch active fursona
- `get_user_fursonas()` - Get all user's fursonas
- `get_follow_status(id1, id2)` - Check follow relationship
- `delete_user_account()` - Delete account with cascade

**Views:**

- `v_accounts_with_stats` - Active accounts with fursona counts
- `v_fursona_stats` - Fursona profiles with social stats
- `v_top_fursonas` - Top 100 fursonas by reputation

---

## Running Migrations Locally

### Prerequisites

```bash
npm install -g supabase
```

### Initialize Local Supabase

```bash
cd /path/to/pawpals
supabase init
```

### Start Local Supabase

```bash
supabase start
```

### Apply Migrations

Migrations in `supabase/migrations/` are automatically applied when `supabase start` runs.

To manually apply a specific migration:

```bash
supabase migration up
```

### Reset Database

```bash
supabase db reset
```

---

## Key Constraints & Business Rules

### Account Management

- ✅ Account linked to Supabase auth via `user_id`
- ✅ Account must have at least 1 active fursona
- ✅ Default fursona created automatically on signup
- ✅ Default fursona username generated from email

### Fursona Management

- ✅ Maximum 3 fursonas per account
- ✅ Can't delete the last fursona
- ✅ One default fursona (for account recovery)
- ✅ One current fursona (active profile)
- ✅ If current is deactivated, switches to default
- ✅ Auto-updates timestamp on changes

### Media Management

- ✅ Avatar/banner URLs stored in fursona record
- ✅ Default system media on fursona creation
- ✅ Only one primary media per type per fursona
- ✅ Updates fursona URL when primary changes
- ✅ Storage bucket paths: `{account_id}/{fursona_id}/{file_id}`

### Social Features

- ✅ No self-follows or self-likes
- ✅ Reputation updated on follow/unfollow
- ✅ Public posts visible to all
- ✅ Private gallery requires authentication
- ✅ Report system for moderation

### Security

- ✅ Row-level security on all tables
- ✅ Users can only see their own data
- ✅ Storage policies enforce user boundaries
- ✅ Service role for admin operations

---

## Database Architecture

```
Schema: core
├── accounts (user_id from auth.users)
│   └── fursonas (account_id FK, max 3, min 1)
│       └── media.fursona_media (avatar_url, banner_url)
│
Schema: social
├── followers (fursona → fursona)
├── likes (fursona → fursona)
├── posts (fursona → posts)
└── reports (fursona/post → moderation)

Schema: media
├── fursona_media (uploaded media files)
└── media_processing_queue (async jobs)
```

---

## Default Values

### Fursona Creation

```sql
-- Default avatar (DiceBear API with seed = user_id)
avatar_url: '/apps/web/public/Avatar.jpg'

-- Default banner
banner_url: '/apps/web/public/Banner.jpg'

-- Default bio
bio: 'Welcome to Pawpals!'
```

---

## Common Queries

### Get current user's profile

```sql
SELECT * FROM core.get_user_profile();
```

### Get fursona with stats

```sql
SELECT * FROM core.get_fursona_profile('username');
```

### Search fursonas

```sql
SELECT * FROM core.search_fursonas('search_term');
```

### Switch active fursona

```sql
SELECT core.switch_current_fursona('fursona_id'::uuid);
```

### Get user's fursonas

```sql
SELECT * FROM core.get_user_fursonas();
```

### Check follow status

```sql
SELECT * FROM social.get_follow_status(follower_id, following_id);
```

---

## Deploying to Production

1. **Backup production database**

   ```bash
   supabase db push
   ```

2. **Test migrations locally first**

   ```bash
   supabase db reset
   supabase migration up
   ```

3. **Push to Supabase Cloud**

   ```bash
   supabase link --project-ref {project-ref}
   supabase db push
   ```

4. **Verify migrations applied**
   ```bash
   supabase migration list --linked
   ```

---

## Troubleshooting

### Constraint violation on fursona delete

**Issue**: "An account must have at least one active fursona"  
**Solution**: Ensure accounts always have at least one active fursona before deletion

### Max fursonas constraint

**Issue**: "Check constraint violated on fursonas insert"  
**Solution**: Check that account has < 3 active fursonas

### Storage policy issues

**Issue**: "401 Unauthorized" on file upload  
**Solution**: Ensure file path matches user UUID format and check bucket policies

### RLS policy denials

**Issue**: "new row violates row-level security policy"  
**Solution**: Verify `auth.uid()` matches user_id in accounts table

---

## Future Enhancements

- [ ] Message/DM system with encryption
- [ ] Comment system on posts
- [ ] Hashtag search and trending
- [ ] Media CDN optimization
- [ ] Moderation dashboard
- [ ] Admin analytics
- [ ] Batch operations
- [ ] Audit logging
