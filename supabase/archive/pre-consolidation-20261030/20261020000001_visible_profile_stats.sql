-- Expose profile counts through the same visibility contract as profile reads.
-- The previous security-invoker view inherited the owner-only core.fursonas RLS
-- policy, so it returned zero rows for every profile owned by another account.
create function social.get_fursona_stats(
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
    and account.status = 'active'
    and (
      p_actor_fursona_id is null
      or core.owns_fursona(p_actor_fursona_id)
    )
    and social.can_view_fursona(p_actor_fursona_id, target.id);
$$;

revoke all on function social.get_fursona_stats(uuid, uuid)
from public, anon, authenticated;
grant execute on function social.get_fursona_stats(uuid, uuid)
to authenticated;

