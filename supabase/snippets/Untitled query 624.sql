CREATE OR REPLACE FUNCTION update_conversation_last_message()
returns trigger
language plpgsql
SECURITY definer
SET search_path = public
AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = new.CREATEd_at
  WHERE id = new.conversation_id;

  RETURN new;
END;
$$;