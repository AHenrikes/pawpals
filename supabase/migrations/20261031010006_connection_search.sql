-- Search the full relationship, not just the page currently loaded in the browser.
create or replace function social.search_profile_connections(
  p_fursona_id uuid, p_direction text, p_query text, p_sort text,
  p_limit integer, p_offset integer
) returns table(fursona_id uuid, connected_at timestamptz)
language plpgsql stable security definer
set search_path to 'pg_catalog', 'core', 'social'
as $$
begin
  if not core.can_read_member_data() then
    raise exception 'member access required' using errcode = '42501';
  end if;
  if p_direction not in ('followers', 'following', 'requests', 'subscribers', 'subscribed')
     or p_sort not in ('newest', 'oldest')
     or p_query is null or length(btrim(p_query)) not between 1 and 50
     or p_limit not between 1 and 20 or p_offset not between 0 and 10000 then
    raise exception 'invalid list parameters' using errcode = '22023';
  end if;
  if p_direction in ('requests', 'subscribers', 'subscribed')
     and not core.owns_fursona(p_fursona_id) then
    raise exception 'profile not owned' using errcode = '42501';
  end if;

  return query
    with connections as (
      select case when p_direction = 'following'
          then follow.followed_fursona_id else follow.follower_fursona_id end as id,
        follow.created_at as since
      from social.follows follow
      where p_direction in ('followers', 'following', 'requests')
        and (case when p_direction = 'following'
          then follow.follower_fursona_id else follow.followed_fursona_id end) = p_fursona_id
        and follow.status = case when p_direction = 'requests'
          then 'pending'::social.follow_status else 'accepted'::social.follow_status end
      union all
      select subscriber.default_fursona_id, subscription.started_at
      from social.profile_subscriptions subscription
      join core.accounts subscriber on subscriber.id = subscription.subscriber_account_id
      where p_direction = 'subscribers' and subscription.target_fursona_id = p_fursona_id
        and subscriber.status in ('active', 'at_risk')
        and subscription.revoked_at is null and subscription.started_at <= now()
        and subscription.expires_at > now()
      union all
      select subscription.target_fursona_id, subscription.started_at
      from social.profile_subscriptions subscription
      where p_direction = 'subscribed'
        and subscription.subscriber_account_id = core.current_account_id()
        and subscription.revoked_at is null and subscription.started_at <= now()
        and subscription.expires_at > now()
    )
    select connections.id, connections.since
    from connections
    join core.fursonas profile on profile.id = connections.id
    join core.accounts account on account.id = profile.account_id
    where profile.status = 'active' and account.status in ('active', 'at_risk')
      and (strpos(lower(profile.username), lower(btrim(p_query))) > 0
        or strpos(lower(profile.display_name), lower(btrim(p_query))) > 0)
    order by case when p_sort = 'newest' then connections.since end desc,
      case when p_sort = 'oldest' then connections.since end asc, connections.id
    limit p_limit offset p_offset;
end;
$$;

revoke all on function social.search_profile_connections(uuid, text, text, text, integer, integer) from public, anon;
grant execute on function social.search_profile_connections(uuid, text, text, text, integer, integer) to authenticated;
