-- Profile discovery and fursona-scoped follow relationships.
create schema social;

create type social.follow_status as enum ('pending', 'accepted', 'rejected');

create table social.follows (
  follower_fursona_id uuid not null references core.fursonas(id) on delete cascade,
  followed_fursona_id uuid not null references core.fursonas(id) on delete cascade,
  status social.follow_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (follower_fursona_id, followed_fursona_id),
  constraint follow_not_self check (follower_fursona_id <> followed_fursona_id)
);
create index follows_followed_status_idx
  on social.follows (followed_fursona_id, status, created_at desc);

create function social.can_view_fursona(
  p_viewer_fursona_id uuid,
  p_target_fursona_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, core, social
as $$
  select exists (
    select 1
    from core.fursonas target
    join core.accounts account on account.id = target.account_id
    where target.id = p_target_fursona_id
      and target.status = 'active'
      and account.status = 'active'
      and (
        core.owns_fursona(target.id, false)
        or target.visibility = 'public'
        or (
          target.visibility = 'followers_only'
          and exists (
            select 1 from social.follows
            where follower_fursona_id = p_viewer_fursona_id
              and followed_fursona_id = target.id
              and status = 'accepted'
          )
        )
      )
  );
$$;

create function social.request_follow(
  p_actor_fursona_id uuid,
  p_target_fursona_id uuid
)
returns social.follow_status
language plpgsql
security definer
set search_path = pg_catalog, core, social
as $$
declare v_status social.follow_status;
begin
  if not core.owns_fursona(p_actor_fursona_id) then
    raise exception 'acting fursona not owned' using errcode = '42501';
  end if;
  if p_actor_fursona_id = p_target_fursona_id then
    raise exception 'cannot follow yourself' using errcode = '23514';
  end if;
  select case
    when f.visibility = 'public' then 'accepted'::social.follow_status
    else 'pending'::social.follow_status
  end into v_status
  from core.fursonas f
  join core.accounts a on a.id = f.account_id
  where f.id = p_target_fursona_id and f.status = 'active' and a.status = 'active';
  if v_status is null then raise exception 'target not found' using errcode = 'P0002'; end if;

  insert into social.follows (follower_fursona_id, followed_fursona_id, status, responded_at)
  values (
    p_actor_fursona_id,
    p_target_fursona_id,
    v_status,
    case when v_status = 'accepted' then now() end
  )
  on conflict (follower_fursona_id, followed_fursona_id)
  do update set status = excluded.status, responded_at = excluded.responded_at;
  return v_status;
end;
$$;

create function social.get_fursona_profile(
  p_target_fursona_id uuid,
  p_actor_fursona_id uuid default null
)
returns table (
  id uuid, username text, display_name text, bio text, species text, pronouns text,
  avatar_url text, banner_url text, visibility core.profile_visibility,
  created_at timestamptz, updated_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, core, social
as $$
  select f.id, f.username, f.display_name, f.bio, f.species, f.pronouns,
         f.avatar_url, f.banner_url, f.visibility, f.created_at, f.updated_at
  from core.fursonas f
  where f.id = p_target_fursona_id
    and (p_actor_fursona_id is null or core.owns_fursona(p_actor_fursona_id))
    and social.can_view_fursona(p_actor_fursona_id, f.id);
$$;

create function social.get_fursona_profile_by_identifier(
  p_identifier text,
  p_actor_fursona_id uuid default null
)
returns table (
  id uuid, username text, display_name text, bio text, species text, pronouns text,
  avatar_url text, banner_url text, visibility core.profile_visibility,
  created_at timestamptz, updated_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, core, social
as $$
  select f.id, f.username, f.display_name, f.bio, f.species, f.pronouns,
         f.avatar_url, f.banner_url, f.visibility, f.created_at, f.updated_at
  from core.fursonas f
  where (f.id::text = p_identifier or lower(f.username) = lower(p_identifier))
    and (p_actor_fursona_id is null or core.owns_fursona(p_actor_fursona_id))
    and social.can_view_fursona(p_actor_fursona_id, f.id)
  limit 1;
$$;

alter table social.follows enable row level security;
create policy follows_visible on social.follows for select to authenticated
using (
  core.owns_fursona(follower_fursona_id, false)
  or core.owns_fursona(followed_fursona_id, false)
  or status = 'accepted'
);
create policy follows_delete_actor on social.follows for delete to authenticated
using (core.owns_fursona(follower_fursona_id));

revoke all on schema social from public, anon, authenticated;
grant usage on schema social to anon, authenticated;
grant select, delete on social.follows to authenticated;
revoke all on all functions in schema social from public, anon, authenticated;
grant execute on function social.can_view_fursona(uuid, uuid) to anon, authenticated;
grant execute on function social.get_fursona_profile(uuid, uuid) to anon, authenticated;
grant execute on function social.get_fursona_profile_by_identifier(text, uuid) to anon, authenticated;
grant execute on function social.request_follow(uuid, uuid) to authenticated;
