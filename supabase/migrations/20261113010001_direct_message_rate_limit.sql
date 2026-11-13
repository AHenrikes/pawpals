-- Enforce one send quota per account, including direct calls to the RPC.
create table private.direct_message_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count between 1 and 30)
);

create or replace function social.send_direct_message(p_actor uuid, p_conversation uuid, p_body text)
returns jsonb language plpgsql security definer
set search_path to 'pg_catalog', 'core', 'social', 'private'
as $$
declare v_peer uuid; v_message social.direct_messages%rowtype; v_now timestamptz := clock_timestamp();
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

  insert into private.direct_message_limits (user_id, window_started_at, request_count)
  values (auth.uid(), v_now, 1)
  on conflict (user_id) do update
    set window_started_at = case
          when private.direct_message_limits.window_started_at <= v_now - interval '1 minute'
            then v_now else private.direct_message_limits.window_started_at end,
        request_count = case
          when private.direct_message_limits.window_started_at <= v_now - interval '1 minute'
            then 1 else private.direct_message_limits.request_count + 1 end
    where private.direct_message_limits.window_started_at <= v_now - interval '1 minute'
       or private.direct_message_limits.request_count < 30;
  if not found then
    raise exception 'message rate limit exceeded' using errcode = 'PT429';
  end if;

  insert into social.direct_messages (conversation_id, sender_fursona_id, body)
  values (p_conversation, p_actor, btrim(p_body)) returning * into v_message;
  update social.conversations set last_message_at = v_message.created_at where id = p_conversation;
  return jsonb_build_object('id', v_message.id, 'sender_fursona_id', p_actor,
    'body', v_message.body, 'created_at', v_message.created_at);
end;
$$;
