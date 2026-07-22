-- Fix messaging auth/account mapping for DM creation and message send policy.
-- Previous logic compared core.fursonas.account_id to auth.uid(), but
-- core.fursonas.account_id points to core.accounts.id, not auth.users.id.

-- 1) Ensure participant account_id FK points to core.accounts(id).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'conversation_participants'
      AND constraint_name = 'conversation_participants_account_id_fkey'
  ) THEN
    ALTER TABLE public.conversation_participants
      DROP CONSTRAINT conversation_participants_account_id_fkey;
  END IF;

  ALTER TABLE public.conversation_participants
    ADD CONSTRAINT conversation_participants_account_id_fkey
    FOREIGN KEY (account_id)
    REFERENCES core.accounts(id)
    ON DELETE CASCADE;
END
$$;

-- 2) Recreate RLS policies with correct account resolution.
DROP POLICY IF EXISTS "Participants can view conversation" ON public.conversations;
CREATE POLICY "Participants can view conversation"
ON public.conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversations.id
      AND cp.account_id = (
        SELECT a.id
        FROM core.accounts a
        WHERE a.user_id = auth.uid()
      )
  )
);

DROP POLICY IF EXISTS "Participants can view participant list" ON public.conversation_participants;
CREATE POLICY "Participants can view participant list"
ON public.conversation_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants cp2
    WHERE cp2.conversation_id = conversation_participants.conversation_id
      AND cp2.account_id = (
        SELECT a.id
        FROM core.accounts a
        WHERE a.user_id = auth.uid()
      )
  )
);

DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
      AND cp.account_id = (
        SELECT a.id
        FROM core.accounts a
        WHERE a.user_id = auth.uid()
      )
  )
);

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM core.fursonas f
    WHERE f.id = sender_fursona_id
      AND f.account_id = (
        SELECT a.id
        FROM core.accounts a
        WHERE a.user_id = auth.uid()
      )
  )
  AND EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
      AND cp.account_id = (
        SELECT a.id
        FROM core.accounts a
        WHERE a.user_id = auth.uid()
      )
  )
);

-- 3) Recreate RPC: get_user_conversations with proper account mapping.
CREATE OR REPLACE FUNCTION public.get_user_conversations()
RETURNS TABLE (
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
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT a.id AS account_id
    FROM core.accounts a
    WHERE a.user_id = auth.uid()
    LIMIT 1
  )
  SELECT
    c.id,
    c.is_group,
    c.name,
    c.last_message_at,
    cp.fursona_id AS my_fursona_id,
    f.id AS other_fursona_id,
    f.username AS other_username,
    f.display_name AS other_display_name,
    f.avatar_url AS other_avatar_url,
    lm.content AS last_message_content,
    (
      SELECT count(*)
      FROM public.messages m
      WHERE m.conversation_id = c.id
        AND m.created_at > coalesce(cp.last_read_at, 'epoch'::timestamptz)
        AND m.sender_fursona_id NOT IN (
          SELECT sf.id
          FROM core.fursonas sf
          WHERE sf.account_id = (SELECT account_id FROM me)
        )
    ) AS unread_count
  FROM public.conversation_participants cp
  JOIN me ON cp.account_id = me.account_id
  JOIN public.conversations c ON c.id = cp.conversation_id
  LEFT JOIN public.conversation_participants cp_other
    ON cp_other.conversation_id = c.id
   AND cp_other.account_id != me.account_id
  LEFT JOIN core.fursonas f ON f.id = cp_other.fursona_id
  LEFT JOIN LATERAL (
    SELECT m2.content
    FROM public.messages m2
    WHERE m2.conversation_id = c.id
    ORDER BY m2.created_at DESC
    LIMIT 1
  ) lm ON true
  ORDER BY c.last_message_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_conversations() TO authenticated;

-- 4) Recreate RPC: get_or_create_dm with proper auth user -> account mapping.
CREATE OR REPLACE FUNCTION public.get_or_create_dm(my_fursona_id uuid, other_fursona_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  my_account_id uuid;
  other_account_id uuid;
  conv_id uuid;
BEGIN
  SELECT a.id INTO my_account_id
  FROM core.accounts a
  WHERE a.user_id = auth.uid()
  LIMIT 1;

  IF my_account_id IS NULL THEN
    RAISE EXCEPTION 'Caller account not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM core.fursonas f
    WHERE f.id = my_fursona_id
      AND f.account_id = my_account_id
  ) THEN
    RAISE EXCEPTION 'my_fursona_id does not belong to the caller';
  END IF;

  SELECT f.account_id INTO other_account_id
  FROM core.fursonas f
  WHERE f.id = other_fursona_id
  LIMIT 1;

  IF other_account_id IS NULL THEN
    RAISE EXCEPTION 'other_fursona_id not found';
  END IF;

  SELECT cp1.conversation_id INTO conv_id
  FROM public.conversation_participants cp1
  JOIN public.conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  JOIN public.conversations c
    ON c.id = cp1.conversation_id
  WHERE cp1.account_id = my_account_id
    AND cp2.account_id = other_account_id
    AND c.is_group = false
  LIMIT 1;

  IF conv_id IS NULL THEN
    INSERT INTO public.conversations (is_group)
    VALUES (false)
    RETURNING id INTO conv_id;

    INSERT INTO public.conversation_participants (conversation_id, account_id, fursona_id)
    VALUES
      (conv_id, my_account_id, my_fursona_id),
      (conv_id, other_account_id, other_fursona_id);
  ELSE
    UPDATE public.conversation_participants
    SET fursona_id = my_fursona_id
    WHERE conversation_id = conv_id
      AND account_id = my_account_id;
  END IF;

  RETURN conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_dm(uuid, uuid) TO authenticated;
