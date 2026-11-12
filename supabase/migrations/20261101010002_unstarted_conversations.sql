-- Keep an unstarted conversation private to the fursona that opened it.
-- Existing conversations predate creator tracking; assign a stable participant.
alter table social.conversations add column created_by uuid references core.fursonas(id) on delete cascade;
update social.conversations set created_by = fursona_a where created_by is null;
alter table social.conversations alter column created_by set not null;

create or replace function social.open_conversation(p_actor uuid, p_peer uuid)
returns uuid language plpgsql security definer
set search_path to 'pg_catalog', 'core', 'social', 'extensions'
as $$
declare v_id uuid;
begin
  if not core.owns_fursona(p_actor) or p_actor = p_peer then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not exists (
    select 1 from core.fursonas f join core.accounts a on a.id = f.account_id
    where f.id = p_peer and f.status = 'active' and a.status in ('active', 'at_risk')
  ) or not exists (
    select 1 from social.follows f where f.follower_fursona_id = p_actor
      and f.followed_fursona_id = p_peer and f.status = 'accepted'
  ) or not exists (
    select 1 from social.follows f where f.follower_fursona_id = p_peer
      and f.followed_fursona_id = p_actor and f.status = 'accepted'
  ) then
    raise exception 'mutual follow required' using errcode = '42501';
  end if;
  insert into social.conversations (fursona_a, fursona_b, created_by)
  values (least(p_actor, p_peer), greatest(p_actor, p_peer), p_actor)
  on conflict (fursona_a, fursona_b) do update set fursona_a = excluded.fursona_a
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function social.list_conversations(p_actor uuid)
returns jsonb language plpgsql stable security definer
set search_path to 'pg_catalog', 'core', 'social'
as $$
declare v_result jsonb;
begin
  if not core.owns_fursona(p_actor) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select coalesce(jsonb_agg(to_jsonb(t) order by t.last_message_at desc), '[]'::jsonb)
  into v_result from (
    select c.id, c.last_message_at, peer.id as peer_id, peer.username,
      peer.display_name, peer.avatar_url,
      (select m.body from social.direct_messages m where m.conversation_id = c.id
        order by m.created_at desc, m.id desc limit 1) as last_message,
      (select count(*)::integer from social.direct_messages m
        where m.conversation_id = c.id and m.sender_fursona_id <> p_actor
          and m.created_at > coalesce(r.read_at, '-infinity'::timestamptz)) as unread_count
    from social.conversations c
    join core.fursonas peer on peer.id = case when c.fursona_a = p_actor then c.fursona_b else c.fursona_a end
    left join social.conversation_reads r on r.conversation_id = c.id and r.fursona_id = p_actor
    where (c.fursona_a = p_actor or c.fursona_b = p_actor)
      and (c.created_by = p_actor or exists (
        select 1 from social.direct_messages first_message where first_message.conversation_id = c.id
      ))
    order by c.last_message_at desc limit 100
  ) t;
  return v_result;
end;
$$;
