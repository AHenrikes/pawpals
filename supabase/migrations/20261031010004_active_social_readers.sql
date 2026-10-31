-- Direct Data API reads must honor the same account-status gate as web routes.
drop policy if exists follows_visible on social.follows;
create policy follows_visible on social.follows for select to authenticated
using (
  (select core.can_read_member_data())
  and (
    core.owns_fursona(follower_fursona_id, false)
    or core.owns_fursona(followed_fursona_id, false)
    or status = 'accepted'
  )
);

create or replace function social.get_fursona_stats(
  p_target_fursona_id uuid, p_actor_fursona_id uuid default null::uuid
) returns table(post_count integer, follower_count integer, following_count integer,
  like_count integer, reputation integer)
language sql stable security definer
set search_path to 'pg_catalog', 'core', 'social'
as $$
  select 0::integer,
    (select count(*)::integer from social.follows
      where followed_fursona_id = target.id and status = 'accepted'),
    (select count(*)::integer from social.follows
      where follower_fursona_id = target.id and status = 'accepted'),
    0::integer, 0::integer
  from core.fursonas target
  join core.accounts account on account.id = target.account_id
  where target.id = p_target_fursona_id and target.status = 'active'
    and account.status in ('active', 'at_risk')
    and core.can_read_member_data()
    and (p_actor_fursona_id is null or core.owns_fursona(p_actor_fursona_id));
$$;

create or replace view social.v_fursona_stats with (security_invoker='on') as
  select f.id as fursona_id,
    0 as reputation,
    0 as post_count,
    (select count(*)::integer from social.follows
      where followed_fursona_id = f.id and status = 'accepted') as follower_count,
    (select count(*)::integer from social.follows
      where follower_fursona_id = f.id and status = 'accepted') as following_count,
    0 as like_count
  from core.fursonas f
  join core.accounts a on a.id = f.account_id
  where f.status = 'active' and a.status in ('active', 'at_risk')
    and (select core.can_read_member_data());
