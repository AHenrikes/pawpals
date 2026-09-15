"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import {
  getConversations,
  getMessages,
  getOrCreateDM,
  markConversationRead,
  sendMessage,
} from "@/lib/messages/queries";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { UserList } from "@/components/pages/messages/user-list";
import { ChatBox } from "@/components/pages/messages/chat-box";
import { ChatInput } from "@/components/pages/messages/chat-input";
import { ChatHeader } from "@/components/pages/messages/chat-header";
import { useUser } from "@/providers/UserProvider";
import { api } from "@/lib/api/api-client";
import { MessageScrollerProvider } from "@repo/ui/message-scroller";
import { TypographyH2 } from "@repo/ui/typography";
import { toast } from "@repo/ui/sonner";
import { type FursonaProfile } from "@/types/fursona";
import type { Conversation, MessageType } from "@/types/messages";

let optimisticCounter = 0;

function sortConversationsNewestFirst(conversations: Conversation[]) {
  return [...conversations].sort(
    (a, b) =>
      new Date(b.last_message_at).getTime() -
      new Date(a.last_message_at).getTime(),
  );
}

function dedupeMessagesById(messages: MessageType[]) {
  const seen = new Set<string>();
  const deduped: MessageType[] = [];

  for (const message of messages) {
    if (seen.has(message.id)) continue;
    seen.add(message.id);
    deduped.push(message);
  }

  return deduped;
}

function makeOptimisticId() {
  const random = globalThis.crypto?.randomUUID;
  if (typeof random === "function") return random.call(globalThis.crypto);

  const fillRandom = globalThis.crypto?.getRandomValues;
  if (typeof fillRandom === "function") {
    const bytes = new Uint8Array(16);
    fillRandom.call(globalThis.crypto, bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
      "",
    );
    return `tmp-${hex}`;
  }

  // Last-resort fallback for very old browsers with no Web Crypto API.
  optimisticCounter += 1;
  return `tmp-${Date.now()}-${optimisticCounter}`;
}

export default function MessagesPage() {
  const { currentFursona } = useUser();
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [startingConversation, setStartingConversation] = useState(false);
  const [firstUnreadMessageId, setFirstUnreadMessageId] = useState<
    string | null
  >(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const supabase = useSupabaseClient();

  // Each fursona has its own separate inbox. If the active fursona changes
  // while this page stays mounted, everything currently on screen belongs
  // to the wrong identity — reset and reload for the new one.
  useEffect(() => {
    if (!currentFursona?.id) return;

    setSelected(null);
    setMessages([]);

    const fetchData = async () => {
      const data = await getConversations(supabase);
      setConversations(data);
    };

    fetchData();
  }, [supabase, currentFursona?.id]);

  const loadMessages = useCallback(
    async (conversation: Conversation) => {
      setLoadingMessages(true);

      try {
        const data = await getMessages(supabase, conversation.id);
        setMessages(data);
        return data;
      } finally {
        setLoadingMessages(false);
      }
    },
    [supabase],
  );

  const markSelectedConversationRead = useCallback(
    async (conversationId: string) => {
      try {
        await markConversationRead(supabase, conversationId);
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, unread_count: 0 }
              : conversation,
          ),
        );
      } catch {
        toast.error("Failed to mark conversation as read");
      }
    },
    [supabase],
  );

  useEffect(() => {
    if (!selected) return;

    let cancelled = false;

    const selectedConversation = selected;

    async function openConversation() {
      setLoadingConversation(true);

      try {
        const hadUnread = (selectedConversation.unread_count ?? 0) > 0;
        const loadedMessages = await loadMessages(selectedConversation);

        if (cancelled) return;

        if (hadUnread) {
          const firstUnread =
            loadedMessages[
              loadedMessages.length - (selectedConversation.unread_count ?? 0)
            ];

          setFirstUnreadMessageId(firstUnread?.id ?? null);
        } else {
          setFirstUnreadMessageId(null);
        }

        await markSelectedConversationRead(selectedConversation.id);
      } finally {
        if (!cancelled) {
          setTimeout(() => {
            setLoadingConversation(false);
          }, 400);
        }
      }
    }

    openConversation();

    return () => {
      cancelled = true;
    };
  }, [selected, loadMessages, markSelectedConversationRead]);

  function handleSelect(conversation: Conversation) {
    // Clear immediately so switching threads doesn't flash the previous
    // conversation's messages while the new ones are still loadingMessages.
    // setMessages([]);
    setLoadingConversation(true);
    setSelected(conversation);
  }

  function handleCloseConversation() {
    setSelected(null);
    setMessages([]);
  }

  const handleNewMessage = useCallback(
    (message: MessageType) => {
      const isOpenConversation = selected?.id === message.conversation_id;
      const isOwnMessage = currentFursona?.id === message.sender_fursona_id;

      setConversations((prev) => {
        const existing = prev.find(
          (conversation) => conversation.id === message.conversation_id,
        );
        if (!existing) return prev;

        const updated: Conversation = {
          ...existing,
          last_message: message.content,
          last_message_at: message.created_at,
          unread_count:
            isOpenConversation || isOwnMessage
              ? 0
              : (existing.unread_count ?? 0) + 1,
        };

        const rest = prev.filter(
          (conversation) => conversation.id !== message.conversation_id,
        );
        return [updated, ...rest];
      });

      if (isOpenConversation) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;

          // Reconcile local optimistic message with the confirmed DB row to
          // avoid duplicates when realtime arrives before insert().select().
          const optimisticIndex = prev.findIndex(
            (m) =>
              m.id.startsWith("tmp-") &&
              m.conversation_id === message.conversation_id &&
              m.sender_fursona_id === message.sender_fursona_id &&
              m.content === message.content,
          );

          if (optimisticIndex === -1) return [...prev, message];

          const next = [...prev];
          next[optimisticIndex] = message;
          return dedupeMessagesById(next);
        });
      }

      // A message just arrived in the thread that's already open — keep it
      // marked read instead of letting last_read_at fall behind until the
      // user reselects the conversation.
      if (isOpenConversation) {
        markSelectedConversationRead(selected.id);
      }
    },
    [selected, currentFursona?.id, markSelectedConversationRead],
  );

  useRealtimeMessages(handleNewMessage);

  async function handleStartConversation(username: string) {
    if (!currentFursona?.id) {
      toast.error("No current fursona found");
      return;
    }

    const normalized = username.trim().toLowerCase();
    if (!normalized || normalized === currentFursona.username.toLowerCase())
      return;

    const existing = conversations.find(
      (conversation) =>
        conversation.other_fursona?.username?.toLowerCase() === normalized,
    );

    if (existing) {
      handleSelect(existing);
      return;
    }

    setStartingConversation(true);

    try {
      const targetFursona = await api.get<
        Pick<FursonaProfile, "id" | "username" | "display_name" | "avatar_url">
      >(`/api/core/fursonas/${encodeURIComponent(username)}`);

      const conversationId = await getOrCreateDM(supabase, targetFursona.id);
      const latestConversations = await getConversations(supabase);
      setConversations(sortConversationsNewestFirst(latestConversations));

      const matchedConversation = latestConversations.find(
        (conversation) => conversation.id === conversationId,
      );

      if (matchedConversation) {
        handleSelect(matchedConversation);
        return;
      }

      const fallbackConversation: Conversation = {
        id: conversationId,
        is_group: false,
        name: null,
        last_message_at: new Date().toISOString(),
        last_message: null,
        unread_count: 0,
        other_fursona: {
          id: targetFursona.id,
          username: targetFursona.username,
          display_name: targetFursona.display_name,
          avatar_url: targetFursona.avatar_url,
        },
      };

      setConversations((prev) => [fallbackConversation, ...prev]);
      handleSelect(fallbackConversation);
    } catch {
      toast.error("Failed to start conversation");
    } finally {
      setStartingConversation(false);
    }
  }

  async function handleSend(content: string) {
    if (!selected || !currentFursona?.id) return;

    const optimisticId = makeOptimisticId();
    const optimistic: MessageType = {
      id: optimisticId,
      conversation_id: selected.id,
      sender_fursona_id: currentFursona.id,
      content,
      attachment_url: null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setConversations((prev) => {
      const existing = prev.find(
        (conversation) => conversation.id === selected.id,
      );
      if (!existing) return prev;

      const updated: Conversation = {
        ...existing,
        last_message: content,
        last_message_at: optimistic.created_at,
      };

      const rest = prev.filter(
        (conversation) => conversation.id !== selected.id,
      );
      return [updated, ...rest];
    });

    try {
      const saved = await sendMessage(
        supabase,
        selected.id,
        currentFursona.id,
        content,
      );
      setMessages((prev) => {
        const next = prev.map((m) => (m.id === optimisticId ? saved : m));
        return dedupeMessagesById(next);
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      toast.error("Failed to send message");
    }
  }

  if (!currentFursona) return null;

  return (
    <section className="relative flex w-full h-dvh">
      <UserList
        conversations={conversations}
        selectedId={selected?.id ?? null}
        onSelect={handleSelect}
        onStartConversation={handleStartConversation}
        currentUsername={currentFursona.username}
        creatingConversation={startingConversation}
      />

      {selected ? (
        <MessageScrollerProvider autoScroll defaultScrollPosition="last-anchor">
          {!loadingConversation ? (
            <main className="absolute inset-0 flex flex-col min-w-0 min-h-0 bg-background md:flex-1 md:static md:bg-transparent">
              <ChatHeader
                conversation={selected}
                onCloseConversation={handleCloseConversation}
              />
              <ChatBox
                messages={messages}
                isGroupRoom={selected.is_group}
                firstUnreadMessageId={firstUnreadMessageId}
                currentFursonaId={currentFursona.id}
                otherFursona={selected.other_fursona}
              />
              <ChatInput
                onSend={handleSend}
                disabled={loadingMessages || startingConversation}
              />
            </main>
          ) : (
            <div className="grid place-content-center h-full w-full">
              <TypographyH2>Loading...</TypographyH2>
            </div>
          )}
        </MessageScrollerProvider>
      ) : (
        <div className="hidden flex-1 items-center justify-center text-sm text-muted-foreground md:flex">
          Pick a conversation to start chatting.
        </div>
      )}
    </section>
  );
}
