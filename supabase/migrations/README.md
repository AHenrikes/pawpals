# Pawpals database baseline

This directory is the active, from-scratch database baseline for a new Supabase project.
The previous 18 migration files and a redundant profile-theme SQL snippet are
retained under `../archive/pre-consolidation-20261030/` for reference. They are
not applied by the Supabase CLI. The baseline represents the final schema after
those migrations,
including authentication, accounts, profiles, discovery, follows, and media.

## Migration order

1. `20261030010001_core.sql` defines account and profile data, private details,
   ownership helpers, search limits, triggers, and core access rules.
2. `20261030010002_social.sql` defines follow data, profile visibility, and social RPCs.
3. `20261030010003_api.sql` exposes the intentionally available public RPC wrappers.
4. `20261030010004_media.sql` creates private media buckets and Storage policies.
5. `20261030010006_atomic_profile_save.sql` saves profile fields and username changes in one database transaction.

Add future schema changes as new, dated migrations. Do not edit these baseline
files after a project has applied them. A database that already applied the old
18-file history cannot accept these four files through `db push` as an additive
upgrade. Back up that database and make a separate migration-history cutover plan.
This includes the existing local database: do not reset it without preserving any
data you need.

Only `core`, `social`, and `public` are exposed through the Data API. Sensitive
account details remain in the unexposed `private` schema.
Profile RPCs, search, and media require an authenticated user. Anonymous access
is limited to Auth flows and username availability during sign-up. Future public
pages should use explicit routes and separate, intentionally public data.
The web proxy keeps an explicit public URL allowlist; placing a page in a
Next.js `(public)` route group alone does not bypass the app's auth guard.

`private.account_details` is the stored record. `core.account_private_details` is
its API view, with the same owner-only RLS and the UI's `firstname`, `lastname`,
and `dob` names. Authenticated users may update only those three view columns.
`age_verified_at` records a completed verification; a database trigger then locks
the legal name and date of birth. A future verification service must compare
submitted identity details with the account before setting this timestamp.
Account `updated_at` is null until a real change, including a change to private
details. A real edit on the creation day can legitimately have that same date.
`at_risk` is a warning status and retains ordinary account access.

Email and phone edits go through Supabase Auth. Pending values stay out of the
account record; an Auth database trigger copies the contact method only after
confirmation. The email flow uses secure email change, which is already enabled
in `config.toml`. Phone changes require a configured SMS provider in local and
hosted Supabase Auth. Keep the phone provider disabled until delivery credentials
are available, then enable it and test an OTP end to end. Phone numbers must be
entered in international format. A database trigger rejects a phone number that
is already pending verification on another user.

Subscription state is intentionally deferred until plans and billing behavior are
defined; the initial release has no subscription feature.

## Profile search

Profile search requires an active or at-risk account. Terms are trimmed and must
contain 3–50 characters. `%` and `_` are literal characters. The database limits
each account to 20 searches in a one-minute window, including direct RPC
calls, and the web route returns HTTP 429 with `Retry-After: 60` when the limit is
reached. Trigram GIN indexes support substring matching on usernames and display
names. The rate-limit table keeps one counter per account and is private.

## Acting fursona

`core.accounts.default_fursona_id` is only a fallback. The acting identity is
device/session state, not a global database flag. Requests that act as a fursona
must send its UUID explicitly to an RPC. Reads using RLS for follower-only data may
send `x-acting-fursona-id`; ownership is still verified by the database.

## Media paths

- Avatar/banner object names: `{fursona_id}/{file_name}`
- Avatar and banner buckets are private. Rows store application media paths such as
  `/api/media/fursona-avatars/{fursona_id}/{file_name}`. The media route reads
  through the request's Supabase session, so Storage policies enforce profile
  visibility for each request.

## Applying to a new project

```bash
supabase db reset --local
supabase test db --local
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
