-- Only the profile owner may inspect active subscription entitlements.
create or replace function social.list_profile_subscriptions(
  p_fursona_id uuid, p_direction text, p_sort text, p_limit integer, p_offset integer
) returns table(fursona_id uuid, connected_at timestamptz)
language plpgsql stable security definer
set search_path to 'pg_catalog', 'core', 'social'
as $$
begin
  if not core.owns_fursona(p_fursona_id) then
    raise exception 'profile not owned' using errcode = '42501';
  end if;
  if p_direction not in ('subscribers', 'subscribed') or p_sort not in ('newest', 'oldest')
     or p_limit not between 1 and 20
     or p_offset not between 0 and 10000 then
    raise exception 'invalid list parameters' using errcode = '22023';
  end if;

  if p_direction = 'subscribers' then
    return query
      select subscriber.default_fursona_id, subscription.started_at
      from social.profile_subscriptions subscription
      join core.accounts subscriber on subscriber.id = subscription.subscriber_account_id
      join core.fursonas profile on profile.id = subscriber.default_fursona_id
      where subscription.target_fursona_id = p_fursona_id
        and subscriber.status in ('active', 'at_risk') and profile.status = 'active'
        and subscription.revoked_at is null and subscription.started_at <= now()
        and subscription.expires_at > now()
      order by case when p_sort = 'newest' then subscription.started_at end desc,
        case when p_sort = 'oldest' then subscription.started_at end asc,
        subscriber.default_fursona_id
      limit p_limit offset p_offset;
  else
    return query
      select subscription.target_fursona_id, subscription.started_at
      from social.profile_subscriptions subscription
      join core.fursonas target on target.id = subscription.target_fursona_id
      join core.accounts owner on owner.id = target.account_id
      where subscription.subscriber_account_id = core.current_account_id()
        and target.status = 'active' and owner.status in ('active', 'at_risk')
        and subscription.revoked_at is null and subscription.started_at <= now()
        and subscription.expires_at > now()
      order by case when p_sort = 'newest' then subscription.started_at end desc,
        case when p_sort = 'oldest' then subscription.started_at end asc,
        subscription.target_fursona_id
      limit p_limit offset p_offset;
  end if;
end;
$$;

revoke all on function social.list_profile_subscriptions(uuid, text, text, integer, integer) from public, anon;
grant execute on function social.list_profile_subscriptions(uuid, text, text, integer, integer) to authenticated;

create or replace function social.remove_follower(p_owner_fursona_id uuid, p_follower_fursona_id uuid)
returns void language plpgsql security definer
set search_path to 'pg_catalog', 'core', 'social'
as $$
begin
  if not core.owns_fursona(p_owner_fursona_id) then
    raise exception 'profile not owned' using errcode = '42501';
  end if;
  delete from social.follows
  where followed_fursona_id = p_owner_fursona_id
    and follower_fursona_id = p_follower_fursona_id
    and status = 'accepted';
end;
$$;

revoke all on function social.remove_follower(uuid, uuid) from public, anon;
grant execute on function social.remove_follower(uuid, uuid) to authenticated;
