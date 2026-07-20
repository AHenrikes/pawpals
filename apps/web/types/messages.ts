export interface Fursona {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface Conversation {
  id: string;
  is_group: boolean;
  name: string | null;
  last_message_at: string;
  last_message?: string | null;
  unread_count?: number;
  /** The other side, for 1:1 conversations. */
  other_fursona?: Fursona;
}

export interface MessageType {
  id: string;
  conversation_id: string;
  sender_fursona_id: string;
  content: string | null;
  attachment_url: string | null;
  created_at: string;
}
