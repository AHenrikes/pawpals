-- -- ============================================================================
-- -- EXTENSIONS
-- -- ============================================================================
-- CREATE extension IF NOT EXISTS pgcrypto;


-- -- ============================================================================
-- -- TABLE: conversations
-- -- Created conversasions
-- -- ============================================================================
-- CREATE TABLE conversations (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   is_group BOOLEAN NOT NULL DEFAULT false,
--   name TEXT,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- -- ============================================================================
-- -- TABLE: conversation_participants
-- -- Users linked to conversations
-- -- ============================================================================
-- CREATE TABLE conversation_participants (
--   conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
--   fursona_id uuid NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
--   joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   last_read_at TIMESTAMPTZ,
--   PRIMARY KEY (conversation_id, fursona_id)
-- );

-- CREATE TABLE messages (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
--   sender_fursona_id uuid NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
--   content TEXT,
--   attachment_url TEXT,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- -- ============================================================================
-- -- INDEXES & PARTIAL UNIQUE CONSTRAINTS
-- -- ============================================================================
-- CREATE INDEX conversation_participants_fursona_idx ON conversation_participants (fursona_id);
-- CREATE INDEX messages_conversation_created_idx ON messages (conversation_id, created_at);
-- GRANT EXECUTE ON FUNCTION core.is_conversation_participant(uuid, uuid) to authenticated;
-- GRANT EXECUTE ON FUNCTION core.current_fursona_id() to authenticated;
-- GRANT EXECUTE ON FUNCTION get_user_conversations() to authenticated;
-- GRANT EXECUTE ON FUNCTION get_or_create_dm(uuid) to authenticated;


-- -- ============================================================================
-- -- FUNCTION: GET IS_CURRENT FURSONA
-- -- ============================================================================
-- CREATE FUNCTION core.current_fursona_id()
-- RETURNS uuid
-- LANGUAGE SQL
-- stable
-- SECURITY definer
-- SET search_path = core, public
-- AS $$
--   SELECT f.id
--   FROM core.fursonas f
--   JOIN core.accounts a on a.id = f.account_id
--   WHERE a.user_id = auth.uid()
--   AND f.is_current = true
--   LIMIT 1;
-- $$;

-- -- ============================================================================
-- -- FUNCTION: GET PARTICIPANT IN CONVERSATION
-- -- ============================================================================
-- CREATE FUNCTION core.is_conversation_participant(p_conversation_id uuid, p_fursona_id uuid)
-- RETURNS boolean
-- LANGUAGE SQL
-- STABLE
-- SECURITY definer
-- SET search_path = public, core
-- AS $$
--   SELECT exists (
--     SELECT 1 FROM conversation_participants cp
--     WHERE cp.conversation_id = p_conversation_id
--     AND cp.fursona_id = p_fursona_id
--   );
-- $$;

-- -- ============================================================================
-- -- ROW LEVEL SECURITY (RLS)
-- -- ============================================================================
-- alter TABLE conversations ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Participants can view conversation"
-- ON conversations FOR SELECT
-- USING (
--   core.is_conversation_participant(conversations.id, core.current_fursona_id())
-- );

-- alter TABLE conversation_participants ENABLE ROW LEVEL SECURITY;


-- CREATE POLICY "Participants can view participant list"
-- ON conversation_participants for SELECT
-- USING (
--   core.is_conversation_participant(conversation_participants.conversation_id, core.current_fursona_id())
-- );

-- alter TABLE messages ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Participants can view messages"
-- ON messages FOR SELECT
-- USING (
--   core.is_conversation_participant(messages.conversation_id, core.current_fursona_id())
-- );

-- -- Sending requires being the current fursona AND a participant of the
-- -- conversation — no "send as any fursona I own" case, since only one
-- -- fursona is ever active at a time.
-- CREATE POLICY "Participants can send messages"
-- ON messages FOR INSERT
-- WITH CHECK (
--   sender_fursona_id = core.current_fursona_id()
--   AND core.is_conversation_participant(messages.conversation_id, core.current_fursona_id())
-- );


-- -- ============================================================================
-- -- FUNCTION: GET CONVERSATION LIST WITH MESSAGE PREVIEW / UNREAD COUNT
-- -- ============================================================================
-- CREATE FUNCTION get_user_conversations()
-- RETURN TABLE (
--   id uuid,
--   is_group BOOLEAN,
--   name TEXT,
--   last_message_at TIMESTAMPTZ,
--   other_fursona_id uuid,
--   other_username TEXT,
--   other_display_name TEXT,
--   other_avatar_url TEXT,
--   last_message_content TEXT,
--   unread_count BIGINT
-- )
-- LANGUAGE SQL
-- SECURITY definer
-- SET search_path = public, core
-- AS $$
--   SELECT
--     c.id,
--     c.is_group,
--     c.name,
--     c.last_message_at,
--     f.id AS other_fursona_id,
--     f.username AS other_username,
--     f.display_name AS other_display_name,
--     f.avatar_url AS other_avatar_url,
--     lm.content AS last_message_content,
--     (
--       SELECT count(*) FROM messages m
--       WHERE m.conversation_id = c.id
--       AND m.created_at > coalesce(cp.last_read_at, 'epoch'::TIMESTAMPTZ)
--       AND m.sender_fursona_id != core.current_fursona_id()
--     ) AS unread_count
--   FROM conversation_participants cp
--   JOIN conversations c on c.id = cp.conversation_id
--   LEFT JOIN conversation_participants cp_other
--     on cp_other.conversation_id = c.id AND cp_other.fursona_id != core.current_fursona_id()
--   LEFT JOIN core.fursonas f on f.id = cp_other.fursona_id
--   LEFT JOIN lateral (
--     SELECT content FROM messages m2
--     WHERE m2.conversation_id = c.id
--     ORDER BY m2.created_at DESC
--     LIMIT 1
--   ) lm on true
--   WHERE cp.fursona_id = core.current_fursona_id()
--   ORDER BY c.last_message_at DESC;
-- $$;

-- -- ============================================================================
-- -- FUNCTION: GET CONVERSATION LIST BY LAST MESSAGE ORDER
-- -- ============================================================================
-- CREATE FUNCTION messages_update_last_message_at()
-- returns trigger
-- language plpgsql
-- SECURITY definer
-- SET search_path = public
-- AS $$
-- BEGIN
--   UPDATE conversations
--   SET last_message_at = new.CREATEd_at
--   WHERE id = new.conversation_id;

--   RETURN new;
-- END;
-- $$;

-- -- ============================================================================
-- -- TRIGGER: ^
-- -- ============================================================================
-- CREATE trigger messages_update_last_message_at()_trigger
-- AFTER INSERT ON messages
-- FOR each ROW
-- EXECUTE FUNCTION messages_update_last_message_at()();

-- -- ============================================================================
-- -- FUNCTION: GET CONVERSATION BETWEEN FURSONAS
-- -- ============================================================================
-- CREATE FUNCTION get_or_create_dm(other_fursona_id uuid)
-- RETURNS uuid
-- LANGUAGE plpgsql
-- SECURITY definer
-- SET search_path = public, core
-- AS $$
-- DECLARE
--   my_fursona_id uuid := core.current_fursona_id();
--   conv_id uuid;
-- BEGIN
--   IF my_fursona_id IS NULL THEN
--     raise exception 'No active fursona for caller';
--   END IF;

--   IF my_fursona_id = other_fursona_id THEN
--     raise exception 'Cannot start a conversation with yourself';
--   END IF;

--   SELECT cp1.conversation_id INTO conv_id
--   FROM conversation_participants cp1
--   JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
--   JOIN conversations c ON c.id = cp1.conversation_id
--   WHERE cp1.fursona_id = my_fursona_id
--   AND cp2.fursona_id = other_fursona_id
--   AND c.is_group = false
--   LIMIT 1;

--   IF conv_id IS NULL THEN
--     INSERT INTO conversations (is_group) VALUES (false) returning id INTO conv_id;
--     INSERT INTO conversation_participants (conversation_id, fursona_id)
--     VALUES
--       (conv_id, my_fursona_id),
--       (conv_id, other_fursona_id);
--   END IF;

--   RETURNS conv_id;
-- END;
-- $$;

-- -- Advances the current fursona's read marker for a conversation. Marks read
-- -- for the *current fursona specifically* — not the account — since each
-- -- fursona's unread state is its own.
-- CREATE FUNCTION mark_conversation_read(p_conversation_id uuid)
-- returns void
-- LANGUAGE SQL
-- SECURITY definer
-- SET search_path = public, core
-- AS $$
--   UPDATE conversation_participants
--   SET last_read_at = now()
--   WHERE conversation_id = p_conversation_id
--   AND fursona_id = core.current_fursona_id();
-- $$;

-- GRANT EXECUTE ON FUNCTION mark_conversation_read(uuid) TO authenticated;

-- -- Skip if already added by a previous attempt.
-- ALTER publication supabase_realtime ADD TABLE messages;

-- -- RLS only filters rows — authenticated still needs table-level grants for
-- -- the operations the client performs directly (not through a security
-- -- definer function). conversation_participants only ever gets written to
-- -- inside get_or_create_dm / mark_conversation_read, both of which run as
-- -- their owner, so it only needs SELECT here.
-- GRANT SELECT ON public.conversation_participants TO authenticated;
-- GRANT SELECT, INSERT ON public.messages TO authenticated;
-- GRANT SELECT, UPDATE ON public.conversations TO authenticated;

-- -- ============================================================================
-- -- Broadcast Changes — pushes new messages over Realtime Broadcast instead
-- -- of Postgres Changes. Broadcast's RLS check happens once per client at
-- -- connection/subscribe time (cached for the connection); Postgres Changes
-- -- re-checks RLS on every single row for every subscriber. Same underlying
-- -- data, cheaper delivery.
-- --
-- -- Dashboard step required alongside this: in Realtime Settings, disable
-- -- "Allow public access" so private channels are actually enforced.
-- -- ============================================================================

-- drop trigger if exists broadcast_messages_trigger ON public.messages;
-- drop FUNCTION if exists public.broadcast_message_changes();
-- drop POLICY if exists "Fursonas can receive message broadcasts for their conversations" on "realtime"."messages";

-- -- Fires on every insert/update/delete to messages and pushes the row to
-- -- topic "conversation:<conversation_id>". security definer so it can write
-- -- to realtime.messages regardless of the caller's own grants — clients
-- -- never broadcast directly, only this trigger does.
-- CREATE or replace FUNCTION public.broadcast_message_changes()
-- returns trigger
-- language plpgsql
-- SECURITY definer
-- SET search_path = public
-- AS $$
-- begin
--   perform realtime.broadcast_changes(
--     'conversation:' || coalesce(new.conversation_id, old.conversation_id)::TEXT, -- topic
--     tg_op,           -- event
--     tg_op,           -- operation
--     tg_table_name,   -- table
--     tg_table_schema, -- schema
--     new,
--     old
--   );
--   return null;
-- end;
-- $$;

-- CREATE trigger broadcast_messages_trigger
-- after INSERT or update or delete on public.messages
-- for each row execute FUNCTION public.broadcast_message_changes();

-- -- A fursona can receive broadcasts on a conversation's topic only if it's
-- -- actually a participant of that conversation. No matching INSERT policy
-- -- is needed on realtime.messages — rows only get in there via the security
-- -- definer trigger above, never a direct client broadcast.
-- CREATE POLICY "Fursonas can receive message broadcasts for their conversations"
-- on "realtime"."messages"
-- for SELECT
-- to authenticated
-- USING (
--   realtime.messages.extension in ('broadcast')
--   AND core.is_conversation_participant(
--     (split_part(realtime.topic(), ':', 2))::uuid,
--     core.current_fursona_id()
--   )
-- );

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group BOOLEAN NOT NULL DEFAULT false,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE conversation_participants (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  fursona_id uuid NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, fursona_id)
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_fursona_id uuid NOT NULL REFERENCES core.fursonas(id) ON DELETE CASCADE,
  content TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX conversation_participants_fursona_idx ON conversation_participants (fursona_id);
CREATE INDEX messages_conversation_created_idx ON messages (conversation_id, created_at);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE FUNCTION core.current_fursona_id()
RETURNS uuid
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = core, public
AS $$
  SELECT f.id
  FROM core.fursonas f
  JOIN core.accounts a ON a.id = f.account_id
  WHERE a.user_id = auth.uid()
  AND f.is_current = true
  LIMIT 1;
$$;

CREATE FUNCTION core.is_conversation_participant(p_conversation_id uuid, p_fursona_id uuid)
RETURNS boolean
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, core
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id
    AND cp.fursona_id = p_fursona_id
  );
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversation"
ON conversations FOR SELECT
USING (
  core.is_conversation_participant(conversations.id, core.current_fursona_id())
);

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view participant list"
ON conversation_participants FOR SELECT
USING (
  core.is_conversation_participant(conversation_participants.conversation_id, core.current_fursona_id())
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
ON messages FOR SELECT
USING (
  core.is_conversation_participant(messages.conversation_id, core.current_fursona_id())
);

-- Sending requires being the current fursona AND a participant of the
-- conversation — no "send as any fursona I own" case, since only one
-- fursona is ever active at a time.
CREATE POLICY "Participants can send messages"
ON messages FOR INSERT
WITH CHECK (
  sender_fursona_id = core.current_fursona_id()
  AND core.is_conversation_participant(messages.conversation_id, core.current_fursona_id())
);

-- ============================================================================
-- FUNCTION: get_user_conversations
-- Conversation list with last-message preview and unread count
-- ============================================================================
CREATE FUNCTION get_user_conversations()
RETURNS TABLE (
  id uuid,
  is_group BOOLEAN,
  name TEXT,
  last_message_at TIMESTAMPTZ,
  other_fursona_id uuid,
  other_username TEXT,
  other_display_name TEXT,
  other_avatar_url TEXT,
  last_message_content TEXT,
  unread_count BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, core
AS $$
  SELECT
    c.id,
    c.is_group,
    c.name,
    c.last_message_at,
    f.id AS other_fursona_id,
    f.username AS other_username,
    f.display_name AS other_display_name,
    f.avatar_url AS other_avatar_url,
    lm.content AS last_message_content,
    (
      SELECT count(*) FROM messages m
      WHERE m.conversation_id = c.id
      AND m.created_at > coalesce(cp.last_read_at, 'epoch'::TIMESTAMPTZ)
      AND m.sender_fursona_id != core.current_fursona_id()
    ) AS unread_count
  FROM conversation_participants cp
  JOIN conversations c ON c.id = cp.conversation_id
  LEFT JOIN conversation_participants cp_other
    ON cp_other.conversation_id = c.id AND cp_other.fursona_id != core.current_fursona_id()
  LEFT JOIN core.fursonas f ON f.id = cp_other.fursona_id
  LEFT JOIN LATERAL (
    SELECT content FROM messages m2
    WHERE m2.conversation_id = c.id
    ORDER BY m2.created_at DESC
    LIMIT 1
  ) lm ON true
  WHERE cp.fursona_id = core.current_fursona_id()
  ORDER BY c.last_message_at DESC;
$$;

-- ============================================================================
-- FUNCTION + TRIGGER: keep conversations.last_message_at in sync
-- ============================================================================
CREATE FUNCTION messages_update_last_message_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = new.created_at
  WHERE id = new.conversation_id;

  RETURN new;
END;
$$;

CREATE TRIGGER messages_update_last_message_at_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION messages_update_last_message_at();

-- ============================================================================
-- FUNCTION: get_or_create_dm
-- Returns the existing 1:1 conversation between two fursonas, creating it
-- if none exists yet.
-- ============================================================================
CREATE FUNCTION get_or_create_dm(other_fursona_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, core
AS $$
DECLARE
  my_fursona_id uuid := core.current_fursona_id();
  conv_id uuid;
BEGIN
  IF my_fursona_id IS NULL THEN
    RAISE EXCEPTION 'No active fursona for caller';
  END IF;

  IF my_fursona_id = other_fursona_id THEN
    RAISE EXCEPTION 'Cannot start a conversation with yourself';
  END IF;

  SELECT cp1.conversation_id INTO conv_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  JOIN conversations c ON c.id = cp1.conversation_id
  WHERE cp1.fursona_id = my_fursona_id
  AND cp2.fursona_id = other_fursona_id
  AND c.is_group = false
  LIMIT 1;

  IF conv_id IS NULL THEN
    INSERT INTO conversations (is_group) VALUES (false) RETURNING id INTO conv_id;
    INSERT INTO conversation_participants (conversation_id, fursona_id)
    VALUES
      (conv_id, my_fursona_id),
      (conv_id, other_fursona_id);
  END IF;

  RETURN conv_id;
END;
$$;

-- ============================================================================
-- FUNCTION: mark_conversation_read
-- Advances the current fursona's read marker for a conversation. Marks read
-- for the *current fursona specifically* — not the account — since each
-- fursona's unread state is its own.
-- ============================================================================
CREATE FUNCTION mark_conversation_read(p_conversation_id uuid)
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, core
AS $$
  UPDATE conversation_participants
  SET last_read_at = now()
  WHERE conversation_id = p_conversation_id
  AND fursona_id = core.current_fursona_id();
$$;

-- ============================================================================
-- GRANTS
-- Placed after every function/table exists, so nothing here references an
-- object that hasn't been created yet. RLS only filters rows — authenticated
-- still needs table-level grants for operations the client performs
-- directly (not through a security definer function). conversation_participants
-- only ever gets written to inside get_or_create_dm / mark_conversation_read,
-- both of which run as their owner, so it only needs SELECT here.
-- ============================================================================
GRANT EXECUTE ON FUNCTION core.is_conversation_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION core.current_fursona_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_dm(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_conversation_read(uuid) TO authenticated;

GRANT SELECT ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT SELECT, UPDATE ON public.conversations TO authenticated;

-- ============================================================================
-- REALTIME PUBLICATION
-- ============================================================================
-- Skip if already added by a previous attempt.
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================================================
-- BROADCAST CHANGES — pushes new messages over Realtime Broadcast instead
-- of Postgres Changes. Broadcast's RLS check happens once per client at
-- connection/subscribe time (cached for the connection); Postgres Changes
-- re-checks RLS on every single row for every subscriber. Same underlying
-- data, cheaper delivery.
--
-- Dashboard step required alongside this: in Realtime Settings, disable
-- "Allow public access" so private channels are actually enforced.
-- ============================================================================
DROP TRIGGER IF EXISTS broadcast_messages_trigger ON public.messages;
DROP FUNCTION IF EXISTS public.broadcast_message_changes();
DROP POLICY IF EXISTS "Fursonas can receive message broadcasts for their conversations" ON "realtime"."messages";

-- Fires on every insert/update/delete to messages and pushes the row to
-- topic "conversation:<conversation_id>". security definer so it can write
-- to realtime.messages regardless of the caller's own grants — clients
-- never broadcast directly, only this trigger does.
CREATE OR REPLACE FUNCTION public.broadcast_message_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'conversation:' || coalesce(new.conversation_id, old.conversation_id)::TEXT, -- topic
    tg_op,           -- event
    tg_op,           -- operation
    tg_table_name,   -- table
    tg_table_schema, -- schema
    new,
    old
  );
  RETURN null;
END;
$$;

CREATE TRIGGER broadcast_messages_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.broadcast_message_changes();

-- A fursona can receive broadcasts on a conversation's topic only if it's
-- actually a participant of that conversation. No matching INSERT policy
-- is needed on realtime.messages — rows only get in there via the security
-- definer trigger above, never a direct client broadcast.
CREATE POLICY "Fursonas can receive message broadcasts for their conversations"
ON "realtime"."messages"
FOR SELECT
TO authenticated
USING (
  realtime.messages.extension IN ('broadcast')
  AND core.is_conversation_participant(
    (split_part(realtime.topic(), ':', 2))::uuid,
    core.current_fursona_id()
  )
);