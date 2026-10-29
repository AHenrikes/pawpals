-- A warning must not remove normal account access.

create or replace function core.create_fursona(
  p_display_name text,
  p_username text,
  p_species text default null,
  p_pronouns text default null,
  p_bio text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, core, extensions
as $$
declare
  v_account core.accounts%rowtype;
  v_id uuid;
begin
  select * into v_account from core.accounts where user_id = auth.uid() for update;
  if not found then raise exception 'account not found' using errcode = 'P0002'; end if;
  if v_account.status not in ('active', 'at_risk') then raise exception 'account cannot act' using errcode = '42501'; end if;
  if (select count(*) from core.fursonas where account_id = v_account.id and status = 'active') >= 4 then
    raise exception 'fursona limit reached' using errcode = 'P0001';
  end if;
  insert into core.fursonas (account_id, display_name, username, species, pronouns, bio)
  values (v_account.id, p_display_name, p_username, p_species, p_pronouns, p_bio)
  returning id into v_id;
  if v_account.default_fursona_id is null then
    update core.accounts set default_fursona_id = v_id where id = v_account.id;
  end if;
  return v_id;
end;
$$;

create or replace function core.set_default_fursona(p_fursona_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, core
as $$
declare v_account_id uuid;
begin
  select id into v_account_id from core.accounts where user_id = auth.uid() and status in ('active', 'at_risk') for update;
  if v_account_id is null or not exists (
    select 1 from core.fursonas where id = p_fursona_id and account_id = v_account_id and status = 'active'
  ) then raise exception 'not allowed' using errcode = '42501'; end if;
  update core.accounts set default_fursona_id = p_fursona_id where id = v_account_id;
end;
$$;

create or replace function social.can_view_fursona(
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
      and account.status in ('active', 'at_risk')
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

create or replace function social.request_follow(
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
  where f.id = p_target_fursona_id and f.status = 'active' and a.status in ('active', 'at_risk');
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

create or replace function core.search_fursonas(search_term text)
returns table (id uuid, username text, display_name text, avatar_url text, species text)
language sql stable security definer
set search_path = pg_catalog, core
as $$
  select f.id, f.username, f.display_name, f.avatar_url, f.species
  from core.fursonas f
  join core.accounts a on a.id = f.account_id
  where a.status in ('active', 'at_risk') and f.status = 'active' and f.visibility = 'public'
    and (f.username ilike '%' || trim(search_term) || '%'
      or f.display_name ilike '%' || trim(search_term) || '%')
  order by case when lower(f.username) = lower(trim(search_term)) then 0 else 1 end, f.username
  limit 25;
$$;

create or replace function core.delete_fursona(p_fursona_id uuid)
returns void language plpgsql security definer
set search_path = pg_catalog, core
as $$
declare
  v_account core.accounts%rowtype;
  v_next_default uuid;
begin
  select a.* into v_account
  from core.accounts a join core.fursonas f on f.account_id = a.id
  where a.user_id = auth.uid() and f.id = p_fursona_id
  for update of a;
  if not found or v_account.status not in ('active', 'at_risk') then raise exception 'fursona not found' using errcode = 'P0002'; end if;
  if (select count(*) from core.fursonas where account_id = v_account.id and status = 'active') <= 1 then
    raise exception 'cannot delete last fursona' using errcode = '23514';
  end if;
  if v_account.default_fursona_id = p_fursona_id then
    select id into v_next_default from core.fursonas
    where account_id = v_account.id and id <> p_fursona_id and status = 'active'
    order by created_at limit 1;
    update core.accounts set default_fursona_id = v_next_default where id = v_account.id;
  end if;
  delete from core.fursonas where id = p_fursona_id and account_id = v_account.id;
end;
$$;

create or replace function social.get_fursona_stats(
  p_target_fursona_id uuid,
  p_actor_fursona_id uuid default null
)
returns table (
  post_count integer,
  follower_count integer,
  following_count integer,
  like_count integer,
  reputation integer
)
language sql
stable
security definer
set search_path = pg_catalog, core, social
as $$
  select
    0::integer as post_count,
    (
      select count(*)::integer
      from social.follows
      where followed_fursona_id = target.id
        and status = 'accepted'
    ) as follower_count,
    (
      select count(*)::integer
      from social.follows
      where follower_fursona_id = target.id
        and status = 'accepted'
    ) as following_count,
    0::integer as like_count,
    0::integer as reputation
  from core.fursonas target
  join core.accounts account on account.id = target.account_id
  where target.id = p_target_fursona_id
    and target.status = 'active'
    and account.status in ('active', 'at_risk')
    and (
      p_actor_fursona_id is null
      or core.owns_fursona(p_actor_fursona_id)
    )
    and social.can_view_fursona(p_actor_fursona_id, target.id);
$$;
