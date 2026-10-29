-- Profiles remain discoverable. Only profile content and uploaded media are gated.
alter table core.fursonas alter column updated_at drop not null;
alter table core.fursonas alter column updated_at drop default;
alter table core.fursonas add column profile_theme text not null default 'dark'
  check (profile_theme in ('light', 'dark'));
alter table core.fursonas disable trigger fursonas_set_updated_at;
update core.fursonas set updated_at = null where updated_at = created_at;
create or replace function core.set_fursona_updated_at()
returns trigger language plpgsql set search_path = pg_catalog as $$
begin
  if (to_jsonb(new) - 'updated_at') is distinct from (to_jsonb(old) - 'updated_at') then
    new.updated_at := now();
  else
    new.updated_at := old.updated_at;
  end if;
  return new;
end;
$$;
drop trigger fursonas_set_updated_at on core.fursonas;

create or replace function core.search_fursonas(search_term text)
returns table (id uuid, username text, display_name text, avatar_url text, species text)
language sql stable security definer set search_path = pg_catalog, core as $$
  select f.id, f.username, f.display_name,
    case when f.visibility = 'public' then f.avatar_url else null end, f.species
  from core.fursonas f join core.accounts a on a.id = f.account_id
  where a.status in ('active', 'at_risk') and f.status = 'active'
    and (f.username ilike '%' || trim(search_term) || '%'
      or f.display_name ilike '%' || trim(search_term) || '%')
  order by case when lower(f.username) = lower(trim(search_term)) then 0 else 1 end, f.username
  limit 25;
$$;

create or replace function social.can_view_fursona(p_viewer_fursona_id uuid, p_target_fursona_id uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, core, social as $$
  select exists (
    select 1 from core.fursonas target
    join core.accounts account on account.id = target.account_id
    where target.id = p_target_fursona_id and target.status = 'active'
      and account.status in ('active', 'at_risk')
      and (core.owns_fursona(target.id, false) or target.visibility = 'public'
        or exists (select 1 from social.follows
          where follower_fursona_id = p_viewer_fursona_id
            and followed_fursona_id = target.id and status = 'accepted'))
  );
$$;

drop function social.get_fursona_profile_by_identifier(text, uuid);
create function social.get_fursona_profile_by_identifier(
  p_identifier text, p_actor_fursona_id uuid default null
)
returns table (
  id uuid, username text, display_name text, bio text, species text, pronouns text,
  avatar_url text, banner_url text, visibility core.profile_visibility,
  social_links jsonb, show_reputation boolean, show_events boolean,
  show_communities boolean, featured_achievements text[],
  created_at timestamptz, updated_at timestamptz, can_view_content boolean,
  profile_theme text
)
language sql stable security definer set search_path = pg_catalog, core, social as $$
  select f.id, f.username, f.display_name,
    case when access.allowed then f.bio end,
    case when access.allowed then f.species end,
    case when access.allowed then f.pronouns end,
    case when access.allowed then f.avatar_url end,
    case when access.allowed then f.banner_url end,
    f.visibility,
    case when access.allowed then f.social_links else '[]'::jsonb end,
    true,
    case when access.allowed then f.show_events else false end,
    case when access.allowed then f.show_communities else false end,
    case when access.allowed then f.featured_achievements else '{}'::text[] end,
    f.created_at, f.updated_at, access.allowed, f.profile_theme
  from core.fursonas f
  join core.accounts a on a.id = f.account_id
  cross join lateral (select social.can_view_fursona(p_actor_fursona_id, f.id) as allowed) access
  where (f.id::text = p_identifier or lower(f.username) = lower(p_identifier))
    and f.status = 'active' and a.status in ('active', 'at_risk')
    and (p_actor_fursona_id is null or core.owns_fursona(p_actor_fursona_id))
  limit 1;
$$;
revoke all on function social.get_fursona_profile_by_identifier(text, uuid) from public, anon, authenticated;
grant execute on function social.get_fursona_profile_by_identifier(text, uuid) to authenticated;

-- Reputation is always available on discoverable profiles.
create or replace function social.get_fursona_stats(p_target_fursona_id uuid, p_actor_fursona_id uuid default null)
returns table (post_count integer, follower_count integer, following_count integer, like_count integer, reputation integer)
language sql stable security definer set search_path = pg_catalog, core, social as $$
  select 0::integer,
    (select count(*)::integer from social.follows where followed_fursona_id = target.id and status = 'accepted'),
    (select count(*)::integer from social.follows where follower_fursona_id = target.id and status = 'accepted'),
    0::integer, 0::integer
  from core.fursonas target join core.accounts account on account.id = target.account_id
  where target.id = p_target_fursona_id and target.status = 'active'
    and account.status in ('active', 'at_risk')
    and (p_actor_fursona_id is null or core.owns_fursona(p_actor_fursona_id));
$$;

-- Existing absolute public URLs become origin-independent application URLs.
update core.fursonas set
  avatar_url = regexp_replace(avatar_url, '^https?://[^/]+/storage/v1/object/public/fursona-avatars/', '/api/media/fursona-avatars/'),
  banner_url = regexp_replace(banner_url, '^https?://[^/]+/storage/v1/object/public/fursona-banners/', '/api/media/fursona-banners/')
where avatar_url ~ '^https?://[^/]+/storage/v1/object/public/fursona-avatars/'
   or banner_url ~ '^https?://[^/]+/storage/v1/object/public/fursona-banners/';
update core.fursonas set updated_at = null where updated_at = created_at;
create trigger fursonas_set_updated_at before update on core.fursonas
for each row execute function core.set_fursona_updated_at();
update storage.buckets set public = false where id in ('fursona-avatars', 'fursona-banners');
create policy profile_media_read on storage.objects for select to authenticated
using (
  bucket_id in ('fursona-avatars', 'fursona-banners')
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  and (
    social.can_view_fursona(null, ((storage.foldername(name))[1])::uuid)
    or exists (
      select 1 from social.follows follow
      join core.fursonas viewer on viewer.id = follow.follower_fursona_id
      where viewer.account_id = core.current_account_id()
        and follow.followed_fursona_id = ((storage.foldername(name))[1])::uuid
        and follow.status = 'accepted'
    )
  )
);

-- Owner-reviewed requests. Rejected requests may be sent again later.
create function social.respond_follow(p_actor_fursona_id uuid, p_follower_fursona_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = pg_catalog, core, social as $$
begin
  if not core.owns_fursona(p_actor_fursona_id) then
    raise exception 'acting fursona not owned' using errcode = '42501';
  end if;
  update social.follows set status = case when p_accept then 'accepted'::social.follow_status else 'rejected'::social.follow_status end,
    responded_at = now()
  where followed_fursona_id = p_actor_fursona_id
    and follower_fursona_id = p_follower_fursona_id and status = 'pending';
  if not found then raise exception 'request not found' using errcode = 'P0002'; end if;
end;
$$;
revoke all on function social.respond_follow(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function social.respond_follow(uuid, uuid, boolean) to authenticated;
create function public.respond_follow(p_actor_fursona_id uuid, p_follower_fursona_id uuid, p_accept boolean)
returns void language sql security invoker set search_path = pg_catalog as $$
  select social.respond_follow(p_actor_fursona_id, p_follower_fursona_id, p_accept);
$$;
revoke all on function public.respond_follow(uuid, uuid, boolean) from public, anon;
grant execute on function public.respond_follow(uuid, uuid, boolean) to authenticated;

create function social.pending_follows(p_actor_fursona_id uuid)
returns table (follower_fursona_id uuid, username text, display_name text)
language plpgsql stable security definer set search_path = pg_catalog, core, social as $$
begin
  if not core.owns_fursona(p_actor_fursona_id) then
    raise exception 'acting fursona not owned' using errcode = '42501';
  end if;
  return query select f.follower_fursona_id, viewer.username, viewer.display_name
  from social.follows f join core.fursonas viewer on viewer.id = f.follower_fursona_id
  where f.followed_fursona_id = p_actor_fursona_id and f.status = 'pending'
  order by f.created_at;
end;
$$;
revoke all on function social.pending_follows(uuid) from public, anon, authenticated;
grant execute on function social.pending_follows(uuid) to authenticated;
create function public.pending_follows(p_actor_fursona_id uuid)
returns table (follower_fursona_id uuid, username text, display_name text)
language sql security invoker set search_path = pg_catalog as $$
  select * from social.pending_follows(p_actor_fursona_id);
$$;
revoke all on function public.pending_follows(uuid) from public, anon;
grant execute on function public.pending_follows(uuid) to authenticated;
