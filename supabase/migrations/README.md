# Pawpals database baseline

This directory is the active, from-scratch database history for a new Supabase project.
Only the current milestone is represented here: authentication, accounts, fursona
profiles, profile discovery, and follows.

## Migration order

1. `20261008000001_core.sql` creates accounts, private account details,
   fursonas, ownership helpers, transactional fursona RPCs, and core RLS.
2. `20261008000002_social.sql` creates profile visibility helpers and fursona-scoped follows.
3. `20261008000004_api_and_storage.sql` creates public RPC wrappers and avatar/banner Storage policies.
4. `20261008000005_profile_contract.sql` adds username lifecycle, search, counts, and atomic profile deletion.

Only `core`, `social`, and `public` are exposed through the Data API. Sensitive
account details remain in the unexposed `private` schema.

## Acting fursona

`core.accounts.default_fursona_id` is only a fallback. The acting identity is
device/session state, not a global database flag. Requests that act as a fursona
must send its UUID explicitly to an RPC. Reads using RLS for follower-only data may
send `x-acting-fursona-id`; ownership is still verified by the database.

## Media paths

- Avatar/banner object names: `{fursona_id}/{file_name}`
  The avatar and banner buckets are public product assets. Rows store their public URLs.

## Applying to a new project

```bash
supabase db reset --local
supabase db push
```

`db push` applies migrations; it is not a backup command. For an existing project,
create a backup and cutover plan instead of treating this baseline as additive.

## Required tests before production

- concurrent fifth-fursona creation
- suspended-account writes through direct Data API calls
- acting with another account's fursona ID
- public, follower-only, and private profile reads
- follow request and unfollow behavior
- username uniqueness and cooldown enforcement
