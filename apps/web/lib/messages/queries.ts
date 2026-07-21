import type { SupabaseClient } from "@supabase/supabase-js";
import type { Conversation, MessageType } from "@/types/messages";

type ConversationRow = {
  id: string;
  is_group: boolean;
  name: string | null;
  last_message_at: string;
  last_message_content: string | null;
  unread_count: number;
  other_fursona_id: string | null;
  other_username: string | null;
  other_display_name: string | null;
  other_avatar_url: string | null;
};

/** Conversation list for the current fursona, with last-message preview
 * and unread count computed server-side via get_user_conversations(). */
export async function getConversations(
  supabase: SupabaseClient,
): Promise<Conversation[]> {
  const { data, error } = await supabase.rpc("get_user_conversations");
  if (error) throw error;

  // @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: ConversationRow) => ({
    id: row.id,
    is_group: row.is_group,
    name: row.name,
    last_message_at: row.last_message_at,
    last_message: row.last_message_content,
    unread_count: row.unread_count,
    other_fursona: row.other_fursona_id
      ? {
          id: row.other_fursona_id,
          username: row.other_username,
          display_name: row.other_display_name,
          avatar_url: row.other_avatar_url,
        }
      : undefined,
  }));
}

/**
 * Call from a fursona's profile page's "Message" button. "My" side of the
 * DM is always whichever fursona is currently active — resolved server-side
 * via core.current_fursona_id(), never chosen by the client.
 */
export async function getOrCreateDM(
  supabase: SupabaseClient,
  otherFursonaId: string,
): Promise<string> {
  if (!otherFursonaId) {
    throw new Error("otherFursonaId is required to create a DM");
  }

  const { data, error } = await supabase.rpc("get_or_create_dm", {
    other_fursona_id: otherFursonaId,
  });
  if (error) throw error;
  return data as string;
}

/** Paginated message history for a conversation, oldest-first. Pass `before`
 * (an ISO timestamp) to load older pages. */
export async function getMessages(
  supabase: SupabaseClient,
  conversationId: string,
  { limit = 50, before }: { limit?: number; before?: string } = {},
): Promise<MessageType[]> {
  let query = supabase
    .from("messages")
    .select(
      "id, conversation_id, sender_fursona_id, content, attachment_url, created_at",
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) query = query.lt("created_at", before);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).reverse();
}

/** Sends a message as the given fursona. `conversations.last_message_at` is
 * updated server-side by a trigger — the client never touches it. */
export async function sendMessage(
  supabase: SupabaseClient,
  conversationId: string,
  senderFursonaId: string,
  content: string,
): Promise<MessageType> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_fursona_id: senderFursonaId,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Advances the current fursona's read marker — the RPC resolves which
 * fursona server-side, so no fursona id is passed from the client. */
export async function markConversationRead(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<void> {
  const { error } = await supabase.rpc("mark_conversation_read", {
    p_conversation_id: conversationId,
  });

  if (error) throw error;
}
