-- Clean slate if you already ran the earlier (broken) version of this file.
drop function if exists get_or_create_dm(uuid);
drop function if exists get_or_create_dm(uuid, uuid);
drop function if exists get_user_conversations();
drop table if exists messages cascade;
drop table if exists conversation_participants cascade;
drop table if exists conversations cascade;

create extension if not exists pgcrypto;

create table conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  name text,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table conversation_participants (
  conversation_id uuid not null references conversations(id) on delete cascade,
  -- account_id uuid not null references core.fursonas(account_id) on delete cascade,
  account_id uuid not null references core.accounts(id) on delete cascade,
  fursona_id uuid not null references core.fursonas(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, account_id)
);

create index conversation_participants_account_idx on conversation_participants (account_id);
create index conversation_participants_fursona_idx on conversation_participants (fursona_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_fursona_id uuid not null references core.fursonas(id) on delete cascade,
  content text,
  attachment_url text,
  created_at timestamptz not null default now()
);

create index messages_conversation_created_idx on messages (conversation_id, created_at);

alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;

create policy "Participants can view conversation"
on conversations for select
using (
  exists (
    select 1 from conversation_participants cp
    where cp.conversation_id = conversations.id
    and cp.account_id = (
      select a.id
      from core.accounts a
      where a.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Participants can view participant list"
ON public.conversation_participants FOR SELECT
USING (
  account_id = (
    SELECT a.id
    FROM core.accounts a
    WHERE a.user_id = auth.uid()
    LIMIT 1
  )
);

create policy "Participants can view messages"
on messages for select
using (
  exists (
    select 1 from conversation_participants cp
    where cp.conversation_id = messages.conversation_id
    and cp.account_id = (
      select a.id
      from core.accounts a
      where a.user_id = auth.uid()
    )
  )
);

-- Sending requires: the fursona you're sending as belongs to you, AND your
-- account is a participant of the conversation (not necessarily via that
-- exact fursona — lets you send as any of your own fursona in a thread
-- you're part of).
create policy "Participants can send messages"
on messages for insert
with check (
  exists (
    select 1 from core.fursonas f
    where f.id = sender_fursona_id
    and f.account_id = (
      select a.id
      from core.accounts a
      where a.user_id = auth.uid()
    )
  )
  and exists (
    select 1 from conversation_participants cp
    where cp.conversation_id = messages.conversation_id
    and cp.account_id = (
      select a.id
      from core.accounts a
      where a.user_id = auth.uid()
    )
  )
);

-- Returns the signed-in account's conversation list in one round trip:
-- the other side's fursona, last message preview, and unread count.
-- security definer + explicit auth.uid() filtering avoids per-row RLS
-- overhead on the joins.
create or replace function get_user_conversations()
returns table (
  id uuid,
  is_group boolean,
  name text,
  last_message_at timestamptz,
  my_fursona_id uuid,
  other_fursona_id uuid,
  other_username text,
  other_display_name text,
  other_avatar_url text,
  last_message_content text,
  unread_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    c.id,
    c.is_group,
    c.name,
    c.last_message_at,
    cp.fursona_id as my_fursona_id,
    f.id as other_fursona_id,
    f.username as other_username,
    f.display_name as other_display_name,
    f.avatar_url as other_avatar_url,
    lm.content as last_message_content,
    (
      select count(*) from messages m
      where m.conversation_id = c.id
      and m.created_at > coalesce(cp.last_read_at, 'epoch'::timestamptz)
      and m.sender_fursona_id not in (
        select id from core.fursonas where account_id = auth.uid()
      )
    ) as unread_count
  from conversation_participants cp
  join conversations c on c.id = cp.conversation_id
  left join conversation_participants cp_other
    on cp_other.conversation_id = c.id and cp_other.account_id != auth.uid()
  left join core.fursonas f on f.id = cp_other.fursona_id
  left join lateral (
    select content from messages m2
    where m2.conversation_id = c.id
    order by m2.created_at desc
    limit 1
  ) lm on true
  where cp.account_id = auth.uid()
  order by c.last_message_at desc;
$$;

grant execute on function get_user_conversations() to authenticated;

-- Finds the existing 1:1 conversation between the caller's account and the
-- owner of other_fursona_id, or creates one. DMs are unique per pair of
-- accounts, not per pair of fursonas — messaging someone via a different
-- one of your fursonas continues the same thread and just updates which
-- fursona represents you in it going forward.
create or replace function get_or_create_dm(my_fursona_id uuid, other_fursona_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  my_account_id uuid := auth.uid();
  other_account_id uuid;
  conv_id uuid;
begin
  if not exists (
    select 1 from core.fursonas where id = my_fursona_id and account_id = my_account_id
  ) then
    raise exception 'my_fursona_id does not belong to the caller';
  end if;

  select account_id into other_account_id from core.fursonas where id = other_fursona_id;
  if other_account_id is null then
    raise exception 'other_fursona_id not found';
  end if;

  select cp1.conversation_id into conv_id
  from conversation_participants cp1
  join conversation_participants cp2 on cp1.conversation_id = cp2.conversation_id
  join conversations c on c.id = cp1.conversation_id
  where cp1.account_id = my_account_id
  and cp2.account_id = other_account_id
  and c.is_group = false
  limit 1;

  if conv_id is null then
    insert into conversations (is_group) values (false) returning id into conv_id;
    insert into conversation_participants (conversation_id, account_id, fursona_id)
    values
      (conv_id, my_account_id, my_fursona_id),
      (conv_id, other_account_id, other_fursona_id);
  else
    update conversation_participants
    set fursona_id = my_fursona_id
    where conversation_id = conv_id and account_id = my_account_id;
  end if;

  return conv_id;
end;
$$;

grant execute on function get_or_create_dm(uuid, uuid) to authenticated;

-- Skip if already added by a previous attempt at this migration.
alter publication supabase_realtime add table messages;

GRANT SELECT ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT SELECT, UPDATE ON public.conversations TO authenticated;