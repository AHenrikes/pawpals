"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, MessageCircle, Search, Send, Smile, X } from "lucide-react";
import { api } from "@/lib/api/api-client";
import { useUser } from "@/providers/UserProvider";
import { cn } from "@repo/ui/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/popover";
import { useHeaderSearch } from "@/components/navigations/HeaderSearchProvider";
import FursonaAvatar from "@/components/avatar-icons/FursonaAvatar";
import MessageHeader from "@/components/pages/messages/MessageHeader";

type Conversation = {
  id: string;
  peer_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
};
type Message = {
  id: string;
  sender_fursona_id: string;
  body: string;
  created_at: string;
};
const emoji = [
  "😀",
  "😂",
  "🥰",
  "😍",
  "😊",
  "😎",
  "🥺",
  "😭",
  "😴",
  "🤔",
  "👋",
  "👍",
  "❤️",
  "🔥",
  "🎉",
  "🐾",
  "✨",
  "💜",
  "🌈",
  "👀",
  "🙏",
  "💯",
  "😸",
  "🐶",
];
const time = (date: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
const day = (date: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(date),
  );
const listTime = (date: string) =>
  new Date(date).toDateString() === new Date().toDateString()
    ? time(date)
    : new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
      }).format(new Date(date));
const errorMessage = (error: unknown) =>
  error && typeof error === "object" && "message" in error
    ? String(error.message)
    : "Something went wrong. Please try again.";

export default function MessagesPage({
  conversationId,
  standalone = false,
}: Readonly<{ conversationId?: string; standalone?: boolean }>) {
  const { currentFursona, loading: userLoading } = useUser();
  const params = useSearchParams();
  const router = useRouter();
  const peerParam = params.get("peer");
  const conversationParam = params.get("conversation");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [openedConversation, setOpenedConversation] =
    useState<Conversation | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    conversationId ?? null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const { query, setQuery } = useHeaderSearch();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [chatError, setChatError] = useState("");
  const [peerLoading, setPeerLoading] = useState(
    Boolean(standalone && peerParam),
  );
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const listRequest = useRef(0);
  const chatRequest = useRef(0);
  const bottomRef = useRef<HTMLLIElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const openedPeer = useRef<string | null>(null);
  const activeChat = useRef<string | null>(null);

  useEffect(() => {
    const syncVisibility = () => setPageVisible(!document.hidden);
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () =>
      document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  const loadConversations = useCallback(async (quiet = false) => {
    const request = ++listRequest.current;
    if (!quiet) setLoading(true);
    try {
      const result = await api.get<{ conversations: Conversation[] }>(
        "/api/social/messages",
      );
      if (request === listRequest.current) {
        setConversations(result.conversations ?? []);
        setError("");
      }
    } catch (cause) {
      if (request === listRequest.current && !quiet)
        setError(errorMessage(cause));
    } finally {
      if (request === listRequest.current) setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (id: string, quiet = false) => {
    const request = ++chatRequest.current;
    if (!quiet) setMessagesLoading(true);
    try {
      const result = await api.get<{ messages: Message[] }>(
        `/api/social/messages/${id}`,
      );
      if (request !== chatRequest.current) return;
      setMessages((current) => {
        const incoming = result.messages ?? [];
        const byId = new Map(current.map((message) => [message.id, message]));
        for (const message of incoming) byId.set(message.id, message);
        const next = [...byId.values()]
          .sort(
            (a, b) =>
              a.created_at.localeCompare(b.created_at) ||
              a.id.localeCompare(b.id),
          )
          .slice(-100);
        return next.length === current.length &&
          next.every((message, index) => message.id === current[index]?.id)
          ? current
          : next;
      });
      setChatError("");
      await api.patch(`/api/social/messages/${id}`);
      setConversations((items) =>
        items.map((item) =>
          item.id === id ? { ...item, unread_count: 0 } : item,
        ),
      );
    } catch (cause) {
      if (request === chatRequest.current && !quiet)
        setChatError(errorMessage(cause));
    } finally {
      if (request === chatRequest.current) setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentFursona?.id) return;
    setConversations([]);
    setOpenedConversation(null);
    setSelectedId(conversationId ?? null);
    activeChat.current = conversationId ?? null;
    setMessages([]);
    openedPeer.current = null;
  }, [currentFursona?.id, conversationId]);

  useEffect(() => {
    if (!currentFursona?.id || !pageVisible) return;
    void loadConversations();
    const interval = window.setInterval(
      () => void loadConversations(true),
      10000,
    );
    return () => {
      window.clearInterval(interval);
      // Invalidate an in-flight response when polling stops.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      listRequest.current++;
    };
  }, [currentFursona?.id, conversationId, loadConversations, pageVisible]);

  useEffect(() => {
    if (!selectedId || !currentFursona?.id || !pageVisible) return;
    void loadMessages(selectedId);
    const interval = window.setInterval(
      () => void loadMessages(selectedId, true),
      5000,
    );
    return () => {
      window.clearInterval(interval);
      // Invalidate an in-flight response when polling stops.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      chatRequest.current++;
    };
  }, [selectedId, currentFursona?.id, loadMessages, pageVisible]);

  useEffect(() => {
    if (
      standalone ||
      !peerParam ||
      !currentFursona?.id ||
      openedPeer.current === peerParam
    )
      return;
    openedPeer.current = peerParam;
    let active = true;
    void api
      .post<{ id: string }>("/api/social/messages", { peerId: peerParam })
      .then(async ({ id }) => {
        if (!active) return;
        const profile = await api.get<{
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          banner_url: string | null;
        }>(`/api/core/fursonas/${peerParam}`);
        await loadConversations(true);
        if (!active) return;
        setOpenedConversation({
          id,
          peer_id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          banner_url: profile.banner_url,
          last_message: null,
          last_message_at: new Date().toISOString(),
          unread_count: 0,
        });
        if (window.matchMedia("(max-width: 767px)").matches) {
          router.replace(`/messages/${id}?peer=${peerParam}`, {
            scroll: false,
          });
        } else {
          setSelectedId(id);
          activeChat.current = id;
          router.replace("/messages", { scroll: false });
        }
      })
      .catch((cause) => {
        if (active) setError(errorMessage(cause));
      });
    return () => {
      active = false;
    };
  }, [standalone, peerParam, currentFursona?.id, loadConversations, router]);

  useEffect(() => {
    if (!standalone || !conversationId || !peerParam || !currentFursona?.id)
      return;
    let active = true;
    void api
      .get<{
        id: string;
        username: string;
        display_name: string;
        avatar_url: string | null;
        banner_url: string | null;
      }>(`/api/core/fursonas/${peerParam}`)
      .then((profile) => {
        if (!active) return;
        setOpenedConversation({
          id: conversationId,
          peer_id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          banner_url: profile.banner_url,
          last_message: null,
          last_message_at: new Date().toISOString(),
          unread_count: 0,
        });
        setPeerLoading(false);
      })
      .catch((cause) => {
        if (active) {
          setChatError(errorMessage(cause));
          setPeerLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [standalone, conversationId, peerParam, currentFursona?.id]);

  useEffect(() => {
    if (standalone || !conversationParam || !currentFursona?.id) return;
    if (window.matchMedia("(max-width: 767px)").matches) {
      router.replace(`/messages/${conversationParam}`);
      return;
    }
    activeChat.current = conversationParam;
    setSelectedId(conversationParam);
    router.replace("/messages", { scroll: false });
  }, [standalone, conversationParam, currentFursona?.id, router]);

  useEffect(() => {
    if (!standalone || !conversationId) return;
    const media = window.matchMedia("(min-width: 768px)");
    const moveToSplitLayout = () => {
      if (media.matches) {
        router.replace(
          peerParam
            ? `/messages?peer=${peerParam}`
            : `/messages?conversation=${conversationId}`,
        );
      }
    };
    moveToSplitLayout();
    media.addEventListener("change", moveToSplitLayout);
    return () => media.removeEventListener("change", moveToSplitLayout);
  }, [standalone, conversationId, peerParam, router]);

  useEffect(() => {
    if (messages.length)
      bottomRef.current?.scrollIntoView({
        behavior:
          document.documentElement.dataset.motion === "reduced" ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        block: "end",
      });
  }, [messages.length, selectedId]);
  const allConversations = useMemo(
    () =>
      openedConversation &&
      !conversations.some((item) => item.id === openedConversation.id)
        ? [openedConversation, ...conversations]
        : conversations,
    [openedConversation, conversations],
  );
  const selected = allConversations.find((item) => item.id === selectedId);
  useEffect(() => {
    if (standalone || !selectedId) return;
    const media = window.matchMedia("(max-width: 767px)");
    const moveToReturnLayout = () => {
      if (media.matches) {
        const peerQuery =
          openedConversation?.id === selectedId
            ? `?peer=${openedConversation.peer_id}`
            : "";
        router.replace(`/messages/${selectedId}${peerQuery}`);
      }
    };
    media.addEventListener("change", moveToReturnLayout);
    return () => media.removeEventListener("change", moveToReturnLayout);
  }, [standalone, selectedId, openedConversation, router]);
  const visible = useMemo(
    () =>
      allConversations.filter((item) => {
        if (filter === "unread" && !item.unread_count) return false;
        return `${item.display_name} ${item.username} ${item.last_message ?? ""}`
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase());
      }),
    [allConversations, filter, query],
  );
  const selectConversation = (id: string) => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      router.push(`/messages/${id}`);
      return;
    }
    activeChat.current = id;
    setSelectedId(id);
    setMessages([]);
    setChatError("");
    window.setTimeout(() => draftRef.current?.focus(), 100);
  };
  const sendMessage = async () => {
    const body = draft.trim();
    if (!selectedId || !body || body.length > 4000 || sending) return;
    const conversationId = selectedId;
    setSending(true);
    setChatError("");
    try {
      const result = await api.post<{ message: Message }>(
        `/api/social/messages/${conversationId}`,
        { body },
      );
      if (activeChat.current === conversationId) {
        setMessages((items) =>
          items.some((item) => item.id === result.message.id)
            ? items
            : [...items, result.message],
        );
        setDraft("");
      }
      void loadConversations(true);
      draftRef.current?.focus();
    } catch (cause) {
      if (activeChat.current === conversationId)
        setChatError(errorMessage(cause));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {standalone && (
        <MessageHeader
          backHref="/messages"
          peer={
            selected
              ? {
                  id: selected.peer_id,
                  username: selected.username,
                  displayName: selected.display_name,
                  avatarUrl: selected.avatar_url,
                  bannerUrl: selected.banner_url,
                }
              : null
          }
          messages={messages}
        />
      )}

      <main
        className={cn(
          "flex h-[calc(100svh-env(safe-area-inset-bottom))] min-h-0 min-w-0 flex-1 overflow-hidden border-foreground/10 bg-background md:h-[calc(100svh-4rem)]",
        )}
        aria-label="Messages"
      >
        <section
          aria-label="Chats"
          className={cn(
            "min-w-0 flex-col border-r border-foreground/10 bg-background md:w-[340px] md:shrink-0 xl:w-[390px]",
            standalone ? "hidden" : "flex w-full",
          )}
        >
          <div className="border-b border-foreground/10 px-4 pb-3 pt-4">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-[22px] font-semibold tracking-tight text-text">
                Chats
              </h1>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {allConversations.length}
              </span>
            </div>
            <label className="hidden h-10 items-center gap-2 rounded-full bg-secondary/70 px-3 text-text-muted focus-within:ring-2 focus-within:ring-primary/40 md:flex">
              <Search className="size-4 shrink-0" aria-hidden="true" />
              <span className="sr-only">Search chats and recent messages</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search chats and messages"
                className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                >
                  <X className="size-4" />
                </button>
              )}
            </label>
          </div>
          <div
            className="flex h-11 shrink-0 gap-6 border-b border-foreground/10 px-5 text-sm font-medium"
            aria-label="Chat filter"
          >
            {(["all", "unread"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={cn(
                  "border-b-2 px-1 capitalize transition-colors",
                  filter === value
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted hover:text-text",
                )}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading || userLoading ? (
              <p className="p-6 text-center text-sm text-text-muted">
                Loading chats…
              </p>
            ) : error ? (
              <div className="p-6 text-center text-sm text-destructive">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void loadConversations()}
                  className="mt-2 font-medium underline"
                >
                  Try again
                </button>
              </div>
            ) : visible.length ? (
              <ul className="m-0 list-none p-0">
                {visible.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => selectConversation(item.id)}
                      className={cn(
                        "flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60 focus-visible:outline-2 focus-visible:outline-primary",
                        selectedId === item.id && "bg-primary/10",
                      )}
                    >
                      <FursonaAvatar
                        name={item.display_name}
                        src={item.avatar_url}
                        className="size-13 shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate font-semibold text-text">
                            {item.display_name}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 text-xs",
                              item.unread_count
                                ? "text-primary"
                                : "text-text-muted",
                            )}
                          >
                            {item.last_message
                              ? listTime(item.last_message_at)
                              : ""}
                          </span>
                        </span>
                        <span className="mt-1 flex items-center justify-between gap-2">
                          <span className="truncate text-sm text-text-muted">
                            {item.last_message ?? `@${item.username}`}
                          </span>
                          {item.unread_count > 0 && (
                            <span className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                              {item.unread_count}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-text-muted">
                <MessageCircle
                  className="size-12 text-primary/40"
                  strokeWidth={1.5}
                />
                <p className="font-medium text-text">
                  {query
                    ? "No matching chats"
                    : filter === "unread"
                      ? "You’re all caught up"
                      : "No conversations yet"}
                </p>
                <p className="max-w-55 text-sm">
                  {query
                    ? "Try a different name or recent message."
                    : filter === "unread"
                      ? "New messages will appear here."
                      : "Visit a mutual’s profile to start a conversation."}
                </p>
              </div>
            )}
          </div>
        </section>

        <section
          aria-label={
            selected
              ? `Conversation with ${selected.display_name}`
              : "Conversation"
          }
          className={cn(
            "min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_15%_20%,hsl(var(--primary)/0.08),transparent_32%),radial-gradient(circle_at_85%_75%,hsl(var(--accent)/0.09),transparent_35%),hsl(var(--background))]",
            standalone ? "flex" : "hidden md:flex",
          )}
        >
          {selected ? (
            <>
              {/* <header className="flex h-16 shrink-0 items-center gap-3 border-b border-foreground/10 bg-background/90 px-3 backdrop-blur-md sm:px-5">
              <FursonaAvatar
                name={selected.display_name}
                src={selected.avatar_url}
                className="size-10 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/@${selected.username}`}
                  className="block truncate font-semibold text-text hover:text-primary"
                >
                  {selected.display_name}
                </Link>
                <p className="truncate text-xs text-text-muted">
                  @{selected.username}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Conversation options"
                    className="rounded-full p-2 text-text-muted hover:bg-secondary"
                  >
                    <MoreVertical className="size-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/@${selected.username}`}>View profile</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </header> */}
              <div
                className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-7"
                aria-live="polite"
              >
                {messagesLoading && !messages.length ? (
                  <p className="text-center text-sm text-text-muted">
                    Loading messages…
                  </p>
                ) : !messages.length ? (
                  <div className="mx-auto mt-12 max-w-sm rounded-2xl bg-background/75 p-6 text-center shadow-sm">
                    <MessageCircle className="mx-auto mb-3 size-10 text-primary/50" />
                    <p className="font-medium text-text">
                      Start the conversation
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                      Send a message to {selected.display_name}.
                    </p>
                  </div>
                ) : (
                  <ol className="mx-auto flex max-w-3xl list-none flex-col gap-1.5 p-0">
                    {messages.map((message, index) => {
                      const mine =
                        message.sender_fursona_id === currentFursona?.id;
                      const previous = messages[index - 1];
                      const newDay =
                        !previous ||
                        new Date(previous.created_at).toDateString() !==
                          new Date(message.created_at).toDateString();
                      return (
                        <li
                          key={message.id}
                          ref={
                            index === messages.length - 1
                              ? bottomRef
                              : undefined
                          }
                        >
                          {newDay && (
                            <div className="my-4 text-center">
                              <span className="rounded-full bg-foreground/10 px-3 py-1 text-xs font-medium text-text-muted backdrop-blur">
                                {day(message.created_at)}
                              </span>
                            </div>
                          )}
                          <div
                            className={cn(
                              "flex",
                              mine ? "justify-end" : "justify-start",
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[85%] rounded-[18px] px-3.5 py-2 shadow-sm sm:max-w-[75%]",
                                mine
                                  ? "rounded-br-md bg-primary text-primary-foreground"
                                  : "rounded-bl-md border border-foreground/5 bg-background text-text",
                              )}
                            >
                              <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">
                                {message.body}
                              </p>
                              <span
                                className={cn(
                                  "mt-0.5 flex items-center justify-end gap-1 text-[10px]",
                                  mine
                                    ? "text-primary-foreground/75"
                                    : "text-text-muted",
                                )}
                              >
                                {time(message.created_at)}
                                {mine && (
                                  <Check
                                    aria-label="Sent"
                                    className="size-3.5"
                                  />
                                )}
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
              <div className="shrink-0 border-t border-foreground/10 bg-background/90 px-3 py-3 backdrop-blur-md sm:px-6">
                {chatError && (
                  <p
                    role="alert"
                    className="mx-auto mb-2 max-w-3xl text-xs text-destructive"
                  >
                    {chatError}
                  </p>
                )}
                <form
                  className="mx-auto flex max-w-3xl items-end gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sendMessage();
                  }}
                >
                  <div className="flex min-w-0 flex-1 items-end rounded-[22px] border border-foreground/10 bg-secondary/50 px-2 focus-within:border-primary/50">
                    <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          aria-label="Choose emoji"
                          className="mb-1 rounded-full p-2 text-text-muted hover:text-primary"
                        >
                          <Smile className="size-5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="top"
                        align="start"
                        className="grid w-64 grid-cols-6 gap-1 p-2"
                      >
                        {emoji.map((value) => (
                          <button
                            key={value}
                            type="button"
                            aria-label={`Insert ${value}`}
                            onClick={() => {
                              setDraft((text) => text + value);
                              setEmojiOpen(false);
                              draftRef.current?.focus();
                            }}
                            className="rounded-lg p-1.5 text-xl hover:bg-secondary"
                          >
                            {value}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                    <label htmlFor="message-draft" className="sr-only">
                      Message
                    </label>
                    <textarea
                      id="message-draft"
                      ref={draftRef}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        const isImeComposing =
                          event.nativeEvent.isComposing ||
                          Reflect.get(
                            event.nativeEvent,
                            ["key", "Code"].join(""),
                          ) === 229;
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey &&
                          !isImeComposing
                        ) {
                          event.preventDefault();
                          void sendMessage();
                        }
                      }}
                      rows={1}
                      maxLength={4000}
                      placeholder="Message"
                      className="max-h-36 min-h-10 min-w-0 flex-1 resize-none bg-transparent py-2.5 text-sm text-text outline-none placeholder:text-text-muted"
                    />
                  </div>
                  <button
                    type="submit"
                    aria-label="Send message"
                    disabled={!draft.trim() || sending}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Send className="size-5" />
                  </button>
                </form>
                <p className="sr-only">
                  Press Enter to send, Shift+Enter for a new line.
                </p>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-5 text-center text-text-muted">
              <div className="rounded-full bg-primary/10 p-6">
                <MessageCircle
                  className="size-12 text-primary/65"
                  strokeWidth={1.5}
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text">
                  {standalone
                    ? loading || userLoading || peerLoading
                      ? "Loading conversation…"
                      : "Conversation unavailable"
                    : "Your messages"}
                </h2>
                <p className="mt-1 text-sm">
                  {standalone
                    ? chatError ||
                      (loading || userLoading || peerLoading
                        ? ""
                        : "This chat could not be found.")
                    : "Select a chat to start messaging."}
                </p>
                {standalone && !loading && !userLoading && !peerLoading && (
                  <Link
                    href="/messages"
                    className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                  >
                    Back to chats
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
