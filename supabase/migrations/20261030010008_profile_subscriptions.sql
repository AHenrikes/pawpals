-- Preserve existing restricted profiles as follower-only when upgrading.
update core.fursonas set visibility = 'private' where visibility = 'followers_only';
alter table core.fursonas add constraint fursonas_visibility_current
  check (visibility <> 'followers_only');

-- Billing may grant and revoke these entitlements. Browser clients cannot write them.
create table social.profile_subscriptions (
  subscriber_account_id uuid not null references core.accounts(id) on delete cascade,
  target_fursona_id uuid not null references core.fursonas(id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  primary key (subscriber_account_id, target_fursona_id),
  constraint profile_subscriptions_valid_period check (expires_at > started_at)
);

create index profile_subscriptions_target_idx on social.profile_subscriptions (target_fursona_id);
alter table social.profile_subscriptions enable row level security;
revoke all on social.profile_subscriptions from public, anon, authenticated;
grant usage on schema social to service_role;
grant select, insert, update, delete on social.profile_subscriptions to service_role;

create or replace function social.can_view_fursona(p_viewer_fursona_id uuid, p_target_fursona_id uuid)
returns boolean language sql stable security definer
set search_path to 'pg_catalog', 'core', 'social'
as $$
  select exists (
    select 1 from core.fursonas target
    join core.accounts owner on owner.id = target.account_id
    where target.id = p_target_fursona_id and target.status = 'active'
      and owner.status in ('active', 'at_risk')
      and (
        core.owns_fursona(target.id, false)
        or target.visibility = 'public'
        or (target.visibility = 'subscribers_only' and exists (
          select 1 from social.profile_subscriptions subscription
          join core.accounts subscriber on subscriber.id = subscription.subscriber_account_id
          where subscription.target_fursona_id = target.id
            and subscriber.user_id = auth.uid()
            and subscriber.status in ('active', 'at_risk')
            and subscription.revoked_at is null
            and subscription.started_at <= now()
            and subscription.expires_at > now()
        ))
        or (target.visibility in ('private', 'followers_only')
          and core.owns_fursona(p_viewer_fursona_id)
          and exists (
            select 1 from social.follows
            where follower_fursona_id = p_viewer_fursona_id
              and followed_fursona_id = target.id and status = 'accepted'
          ))
      )
  );
$$;

create or replace function social.request_follow(p_actor_fursona_id uuid, p_target_fursona_id uuid)
returns social.follow_status language plpgsql security definer
set search_path to 'pg_catalog', 'core', 'social'
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
    when f.visibility in ('public', 'subscribers_only') then 'accepted'::social.follow_status
    else 'pending'::social.follow_status
  end into v_status
  from core.fursonas f join core.accounts a on a.id = f.account_id
  where f.id = p_target_fursona_id and f.status = 'active' and a.status in ('active', 'at_risk');
  if v_status is null then raise exception 'target not found' using errcode = 'P0002'; end if;

  insert into social.follows (follower_fursona_id, followed_fursona_id, status, responded_at)
  values (p_actor_fursona_id, p_target_fursona_id, v_status,
    case when v_status = 'accepted' then now() end)
  on conflict (follower_fursona_id, followed_fursona_id)
  do update set status = excluded.status, responded_at = excluded.responded_at;
  return v_status;
end;
$$;
