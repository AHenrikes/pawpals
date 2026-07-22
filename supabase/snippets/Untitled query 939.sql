-- PawPals messaging schema
--
-- Assumes:
--   core.accounts(id uuid pk, user_id uuid references auth.users(id), ...)
--   core.fursonas(id uuid pk, account_id uuid references core.accounts(id),
--                 username text, display_name text, avatar_url text, ...)
--
-- auth.uid() gives the auth.users id. core.accounts.id is a different id.
-- Every policy/function below goes through core.current_account_id() to
-- resolve one to the other — never compare account_id to auth.uid() directly.

drop function if exists get_or_create_dm(uuid, uuid);
drop function if exists get_user_conversations();
drop function if exists get_my_fursona_ids();
drop function if exists core.current_account_id();
drop table if exists messages cascade;
drop table if exists conversation_participants cascade;
drop table if exists conversations cascade;

create extension if not exists pgcrypto;

-- Resolves the signed-in auth user to their core.accounts row. Centralizing
-- this means every place below stays correct even if the accounts table
-- changes shape later — fix the mapping once, not in five policies.
create or replace function core.current_account_id()
returns uuid
language sql
stable
security definer
set search_path = core, public
as $$
  select a.id from core.accounts a where a.user_id = auth.uid();
$$;

grant execute on function core.current_account_id() to authenticated;

create table conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  name text,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

-- One row per (conversation, account) — an account is "in" a conversation
-- once, represented by whichever fursona it's currently chatting as.
-- Switching which fursona you use in a thread is an UPDATE to fursona_id;
-- past messages keep whichever fursona actually sent them.
create table conversation_participants (
  conversation_id uuid not null references conversations(id) on delete cascade,
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
    and cp.account_id = core.current_account_id()
  )
);

create policy "Participants can view participant list"
on conversation_participants for select
using (
  exists (
    select 1 from conversation_participants cp2
    where cp2.conversation_id = conversation_participants.conversation_id
    and cp2.account_id = core.current_account_id()
  )
);

create policy "Participants can view messages"
on messages for select
using (
  exists (
    select 1 from conversation_participants cp
    where cp.conversation_id = messages.conversation_id
    and cp.account_id = core.current_account_id()
  )
);

-- Sending requires: the fursona you're sending as belongs to you, AND your
-- account is a participant of the conversation (not necessarily via that
-- exact fursona — lets you send as any of your own fursonas in a thread
-- you're part of).
create policy "Participants can send messages"
on messages for insert
with check (
  exists (
    select 1 from core.fursonas f
    where f.id = sender_fursona_id
    and f.account_id = core.current_account_id()
  )
  and exists (
    select 1 from conversation_participants cp
    where cp.conversation_id = messages.conversation_id
    and cp.account_id = core.current_account_id()
  )
);

-- Returns the signed-in account's conversation list in one round trip:
-- the other side's fursona, last message preview, and unread count.
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
set search_path = public, core
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
        select sf.id from core.fursonas sf where sf.account_id = core.current_account_id()
      )
    ) as unread_count
  from conversation_participants cp
  join conversations c on c.id = cp.conversation_id
  left join conversation_participants cp_other
    on cp_other.conversation_id = c.id and cp_other.account_id != core.current_account_id()
  left join core.fursonas f on f.id = cp_other.fursona_id
  left join lateral (
    select content from messages m2
    where m2.conversation_id = c.id
    order by m2.created_at desc
    limit 1
  ) lm on true
  where cp.account_id = core.current_account_id()
  order by c.last_message_at desc;
$$;

grant execute on function get_user_conversations() to authenticated;

-- Finds the existing 1:1 conversation between the caller's account and the
-- owner of other_fursona_id, or creates one. DMs are unique per pair of
-- accounts, not per pair of fursonas.
create or replace function get_or_create_dm(my_fursona_id uuid, other_fursona_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, core
as $$
declare
  my_account_id uuid := core.current_account_id();
  other_account_id uuid;
  conv_id uuid;
begin
  if my_account_id is null then
    raise exception 'Caller account not found';
  end if;

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

-- Lets the client fetch which fursona IDs belong to it, without needing
-- direct PostgREST access to the core schema.
create or replace function get_my_fursona_ids()
returns uuid[]
language sql
security definer
set search_path = public, core
as $$
  select coalesce(array_agg(id), '{}')
  from core.fursonas
  where account_id = core.current_account_id();
$$;

grant execute on function get_my_fursona_ids() to authenticated;

-- Skip if already added by a previous attempt.
alter publication supabase_realtime add table messages;

-- RLS only filters rows — the authenticated role still needs table-level
-- grants for the operations the client performs directly (not through a
-- security definer function). conversation_participants only ever gets
-- written to inside get_or_create_dm, which runs as its owner, so it only
-- needs SELECT here.
grant select on public.conversation_participants to authenticated;
grant select, insert on public.messages to authenticated;
grant select, update on public.conversations to authenticated;