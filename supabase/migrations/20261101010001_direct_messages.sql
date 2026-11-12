-- Private, one-to-one fursona conversations. All access goes through checked RPCs.
create table social.conversations (
  id uuid primary key default extensions.gen_random_uuid(),
  fursona_a uuid not null references core.fursonas(id) on delete cascade,
  fursona_b uuid not null references core.fursonas(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (fursona_a, fursona_b),
  check (fursona_a < fursona_b)
);

create table social.direct_messages (
  id uuid primary key default extensions.gen_random_uuid(),
  conversation_id uuid not null references social.conversations(id) on delete cascade,
  sender_fursona_id uuid not null references core.fursonas(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index direct_messages_history_idx on social.direct_messages (conversation_id, created_at desc, id desc);
create table social.conversation_reads (
  conversation_id uuid not null references social.conversations(id) on delete cascade,
  fursona_id uuid not null references core.fursonas(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (conversation_id, fursona_id)
);

alter table social.conversations enable row level security;
alter table social.direct_messages enable row level security;
alter table social.conversation_reads enable row level security;
revoke all on social.conversations, social.direct_messages, social.conversation_reads from public, anon, authenticated;

create function social.open_conversation(p_actor uuid, p_peer uuid)
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
  insert into social.conversations (fursona_a, fursona_b)
  values (least(p_actor, p_peer), greatest(p_actor, p_peer))
  on conflict (fursona_a, fursona_b) do update set fursona_a = excluded.fursona_a
  returning id into v_id;
  return v_id;
end;
$$;

create function social.list_conversations(p_actor uuid)
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
    where c.fursona_a = p_actor or c.fursona_b = p_actor
    order by c.last_message_at desc limit 100
  ) t;
  return v_result;
end;
$$;

create function social.list_direct_messages(p_actor uuid, p_conversation uuid)
returns jsonb language plpgsql stable security definer
set search_path to 'pg_catalog', 'core', 'social'
as $$
declare v_result jsonb;
begin
  if not core.owns_fursona(p_actor) or not exists (
    select 1 from social.conversations c where c.id = p_conversation
      and p_actor in (c.fursona_a, c.fursona_b)
  ) then raise exception 'not allowed' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at, t.id), '[]'::jsonb)
  into v_result from (
    select m.id, m.sender_fursona_id, m.body, m.created_at
    from social.direct_messages m where m.conversation_id = p_conversation
    order by m.created_at desc, m.id desc limit 100
  ) t;
  return v_result;
end;
$$;

create function social.send_direct_message(p_actor uuid, p_conversation uuid, p_body text)
returns jsonb language plpgsql security definer
set search_path to 'pg_catalog', 'core', 'social'
as $$
declare v_peer uuid; v_message social.direct_messages%rowtype;
begin
  if not core.owns_fursona(p_actor) then raise exception 'not allowed' using errcode = '42501'; end if;
  select case when c.fursona_a = p_actor then c.fursona_b else c.fursona_a end
  into v_peer from social.conversations c where c.id = p_conversation
    and p_actor in (c.fursona_a, c.fursona_b);
  if v_peer is null then raise exception 'not allowed' using errcode = '42501'; end if;
  if not exists (
    select 1 from core.fursonas f join core.accounts a on a.id = f.account_id
    where f.id = v_peer and f.status = 'active' and a.status in ('active', 'at_risk')
  ) then raise exception 'recipient unavailable' using errcode = '42501'; end if;
  if p_body is null or char_length(btrim(p_body)) not between 1 and 4000 then
    raise exception 'message must be 1 to 4000 characters' using errcode = '22023';
  end if;
  if not exists (select 1 from social.follows where follower_fursona_id = p_actor
    and followed_fursona_id = v_peer and status = 'accepted') or not exists
    (select 1 from social.follows where follower_fursona_id = v_peer
    and followed_fursona_id = p_actor and status = 'accepted') then
    raise exception 'mutual follow required' using errcode = '42501';
  end if;
  insert into social.direct_messages (conversation_id, sender_fursona_id, body)
  values (p_conversation, p_actor, btrim(p_body)) returning * into v_message;
  update social.conversations set last_message_at = v_message.created_at where id = p_conversation;
  return jsonb_build_object('id', v_message.id, 'sender_fursona_id', p_actor,
    'body', v_message.body, 'created_at', v_message.created_at);
end;
$$;

create function social.mark_conversation_read(p_actor uuid, p_conversation uuid)
returns void language plpgsql security definer
set search_path to 'pg_catalog', 'core', 'social'
as $$
begin
  if not core.owns_fursona(p_actor) or not exists (
    select 1 from social.conversations c where c.id = p_conversation
      and p_actor in (c.fursona_a, c.fursona_b)
  ) then raise exception 'not allowed' using errcode = '42501'; end if;
  insert into social.conversation_reads (conversation_id, fursona_id, read_at)
  values (p_conversation, p_actor, now())
  on conflict (conversation_id, fursona_id) do update set read_at = excluded.read_at;
end;
$$;

revoke all on function social.open_conversation(uuid, uuid),
  social.list_conversations(uuid), social.list_direct_messages(uuid, uuid),
  social.send_direct_message(uuid, uuid, text), social.mark_conversation_read(uuid, uuid)
  from public, anon;
grant execute on function social.open_conversation(uuid, uuid),
  social.list_conversations(uuid), social.list_direct_messages(uuid, uuid),
  social.send_direct_message(uuid, uuid, text), social.mark_conversation_read(uuid, uuid)
  to authenticated;
