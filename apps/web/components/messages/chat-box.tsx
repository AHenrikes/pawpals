"use client";

import { useCallback, useMemo, useRef } from "react";
import { MessageCircleDashedIcon } from "lucide-react";
import { MessageGroup } from "@repo/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerViewport,
} from "@repo/ui/message-scroller";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@repo/ui/Empty";
import { MessageBubble } from "./message-bubble";
import { type MessageType } from "@/types/messages";

// Messages from the same sender within this window render as one visual
// group: avatar + name once, individual bubbles stacked tight underneath.
const GROUP_GAP_MS = 5 * 60 * 1000;

type OtherFursona =
  | {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    }
  | null
  | undefined;

interface ChatBoxProps {
  messages: MessageType[];
  currentFursonaId: string;
  otherFursona?: OtherFursona;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

function groupConsecutiveMessages(messages: MessageType[]) {
  const groups: MessageType[][] = [];

  for (const message of messages) {
    const lastGroup = groups[groups.length - 1];
    const lastMessage = lastGroup?.[lastGroup.length - 1];

    const sameSender = lastMessage?.sender_fursona_id === message.sender_fursona_id;
    const withinGap =
      !!lastMessage &&
      new Date(message.created_at).getTime() - new Date(lastMessage.created_at).getTime() 
        GROUP_GAP_MS;

    if (lastGroup && sameSender && withinGap) {
      lastGroup.push(message);
    } else {
      groups.push([message]);
    }
  }

  return groups;
}

export function ChatBox({
  messages,
  currentFursonaId,
  otherFursona,
  onLoadMore,
  hasMore,
}: Readonly<ChatBoxProps>) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => groupConsecutiveMessages(messages), [messages]);
  const otherName = otherFursona?.display_name ?? otherFursona?.username ?? "Unknown";

  // Loading earlier history is still your job to detect — the scroller only
  // preserves position once you prepend, it doesn't decide when to fetch.
  const handleScroll = useCallback(() => {
    if (!viewportRef.current || !onLoadMore || !hasMore) return;
    if (viewportRef.current.scrollTop < 80) onLoadMore();
  }, [onLoadMore, hasMore]);

  if (messages.length === 0) {
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia>
            <MessageCircleDashedIcon />
          </EmptyMedia>
          <EmptyTitle>No messages yet.</EmptyTitle>
          <EmptyDescription>Send the first one.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <MessageScroller className="h-full max-h-[calc(100dvh-140px)] px-4 my-2">
      <MessageScrollerViewport ref={viewportRef} onScroll={handleScroll}>
        <MessageScrollerContent className="space-y-4 py-2">
          {groups.map((group) => {
            const isOwn = group[0]?.sender_fursona_id === currentFursonaId;

            return (
              // One item per group, keyed on the first message — the run of
              // consecutive messages is treated as a single "turn" for anchoring.
              <MessageScrollerItem key={group[0]?.id} messageId={group[0]?.id} scrollAnchor={isOwn}>
                <MessageGroup>
                  {group.map((message, i) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      showAvatar={!isOwn && i === group.length - 1}
                      showHeader={!isOwn && i === 0}
                      showFooter={i === group.length - 1}
                      senderName={otherName}
                      senderAvatarUrl={otherFursona?.avatar_url}
                    />
                  ))}
                </MessageGroup>
              </MessageScrollerItem>
            );
          })}
        </MessageScrollerContent>
      </MessageScrollerViewport>

      <MessageScrollerButton />
    </MessageScroller>
  );
}
