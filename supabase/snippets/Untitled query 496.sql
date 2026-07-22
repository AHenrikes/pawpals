-- Add read-receipt support for messages.
--
-- Updates the caller's conversation_participants.last_read_at for the chosen
-- conversation, using account mapping via core.current_account_id().

create or replace function mark_conversation_read(p_conversation_id uuid)
returns void
language sql
security definer
set search_path = public, core
as $$
  update conversation_participants
  set last_read_at = now()
  where conversation_id = p_conversation_id
    and account_id = core.current_account_id();
$$;

grant execute on function mark_conversation_read(uuid) to authenticated;
