-- PawPals messaging schema (fursona-scoped, not account-scoped)
--
-- Fursonas share nothing but the owning account — each has its own separate
-- inbox. A conversation belongs to a specific fursona, permanently. Access
-- and sending are both resolved through core.fursonas.is_current: whichever
-- fursona is currently active for the signed-in account is the only one
-- that can see or send in its own conversations.
--
-- Assumes:
--   core.accounts(id uuid pk, user_id uuid references auth.users(id), ...)
--   core.fursonas(id uuid pk, account_id uuid references core.accounts(id),
--                 is_current boolean, username text, display_name text,
--                 avatar_url text, ...)
--
-- Statement order matters: `language sql` functions are parsed against the
-- catalog at CREATE time, so tables must exist before functions that query
-- them.

drop function if exists mark_conversation_read(uuid);
drop function if exists get_or_create_dm(uuid, uuid);
drop function if exists get_or_create_dm(uuid);
drop function if exists get_user_conversations();
drop function if exists get_my_fursona_ids();
drop function if exists core.is_conversation_participant(uuid, uuid);
drop function if exists core.current_account_id();
drop function if exists core.current_fursona_id();
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

-- A fursona is a participant, full stop — no account_id here. Conversations
-- don't move between an account's fursonas; each fursona's threads are its
-- own.
create table conversation_participants (
  conversation_id uuid not null references conversations(id) on delete cascade,
  fursona_id uuid not null references core.fursonas(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, fursona_id)
);

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

-- Resolves the signed-in auth user to whichever of their fursonas is
-- currently active. This is the one identity that matters everywhere below —
-- there's no "any of my fursonas" concept in messaging.
create or replace function core.current_fursona_id()
returns uuid
language sql
stable
security definer
set search_path = core, public
as $$
  select f.id
  from core.fursonas f
  join core.accounts a on a.id = f.account_id
  where a.user_id = auth.uid()
  and f.is_current = true
  limit 1;
$$;

grant execute on function core.current_fursona_id() to authenticated;

-- Used by every policy below instead of a raw subquery on
-- conversation_participants, to avoid the table's SELECT policy trying to
-- evaluate itself (infinite recursion). security definer runs as the table
-- owner, who isn't subject to the table's own RLS.
create or replace function core.is_conversation_participant(p_conversation_id uuid, p_fursona_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, core
as $$
  select exists (
    select 1 from conversation_participants cp
    where cp.conversation_id = p_conversation_id
    and cp.fursona_id = p_fursona_id
  );
$$;

grant execute on function core.is_conversation_participant(uuid, uuid) to authenticated;

alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;

create policy "Participants can view conversation"
on conversations for select
using (
  core.is_conversation_participant(conversations.id, core.current_fursona_id())
);

create policy "Participants can view participant list"
on conversation_participants for select
using (
  core.is_conversation_participant(conversation_participants.conversation_id, core.current_fursona_id())
);

create policy "Participants can view messages"
on messages for select
using (
  core.is_conversation_participant(messages.conversation_id, core.current_fursona_id())
);

-- Sending requires being the current fursona AND a participant of the
-- conversation — no "send as any fursona I own" case, since only one
-- fursona is ever active at a time.
create policy "Participants can send messages"
on messages for insert
with check (
  sender_fursona_id = core.current_fursona_id()
  and core.is_conversation_participant(messages.conversation_id, core.current_fursona_id())
);

-- Returns the current fursona's conversation list in one round trip: the
-- other side's fursona, last message preview, and unread count.
create or replace function get_user_conversations()
returns table (
  id uuid,
  is_group boolean,
  name text,
  last_message_at timestamptz,
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
    f.id as other_fursona_id,
    f.username as other_username,
    f.display_name as other_display_name,
    f.avatar_url as other_avatar_url,
    lm.content as last_message_content,
    (
      select count(*) from messages m
      where m.conversation_id = c.id
      and m.created_at > coalesce(cp.last_read_at, 'epoch'::timestamptz)
      and m.sender_fursona_id != core.current_fursona_id()
    ) as unread_count
  from conversation_participants cp
  join conversations c on c.id = cp.conversation_id
  left join conversation_participants cp_other
    on cp_other.conversation_id = c.id and cp_other.fursona_id != core.current_fursona_id()
  left join core.fursonas f on f.id = cp_other.fursona_id
  left join lateral (
    select content from messages m2
    where m2.conversation_id = c.id
    order by m2.created_at desc
    limit 1
  ) lm on true
  where cp.fursona_id = core.current_fursona_id()
  order by c.last_message_at desc;
$$;

grant execute on function get_user_conversations() to authenticated;

-- Finds the existing 1:1 conversation between the caller's current fursona
-- and other_fursona_id, or creates one. Only one param — "my fursona" is
-- always whichever one is currently active, never chosen by the client.
create or replace function get_or_create_dm(other_fursona_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, core
as $$
declare
  my_fursona_id uuid := core.current_fursona_id();
  conv_id uuid;
begin
  if my_fursona_id is null then
    raise exception 'No active fursona for caller';
  end if;

  if my_fursona_id = other_fursona_id then
    raise exception 'Cannot start a conversation with yourself';
  end if;

  select cp1.conversation_id into conv_id
  from conversation_participants cp1
  join conversation_participants cp2 on cp1.conversation_id = cp2.conversation_id
  join conversations c on c.id = cp1.conversation_id
  where cp1.fursona_id = my_fursona_id
  and cp2.fursona_id = other_fursona_id
  and c.is_group = false
  limit 1;

  if conv_id is null then
    insert into conversations (is_group) values (false) returning id into conv_id;
    insert into conversation_participants (conversation_id, fursona_id)
    values
      (conv_id, my_fursona_id),
      (conv_id, other_fursona_id);
  end if;

  return conv_id;
end;
$$;

grant execute on function get_or_create_dm(uuid) to authenticated;

-- Advances the current fursona's read marker for a conversation. Marks read
-- for the *current fursona specifically* — not the account — since each
-- fursona's unread state is its own.
create or replace function mark_conversation_read(p_conversation_id uuid)
returns void
language sql
security definer
set search_path = public, core
as $$
  update conversation_participants
  set last_read_at = now()
  where conversation_id = p_conversation_id
  and fursona_id = core.current_fursona_id();
$$;

grant execute on function mark_conversation_read(uuid) to authenticated;

-- Skip if already added by a previous attempt.
alter publication supabase_realtime add table messages;

-- RLS only filters rows — authenticated still needs table-level grants for
-- the operations the client performs directly (not through a security
-- definer function). conversation_participants only ever gets written to
-- inside get_or_create_dm / mark_conversation_read, both of which run as
-- their owner, so it only needs SELECT here.
grant select on public.conversation_participants to authenticated;
grant select, insert on public.messages to authenticated;
grant select, update on public.conversations to authenticated;