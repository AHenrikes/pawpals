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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/empty";
import { MessageBubble } from "./message-bubble";
import { type MessageType } from "@/types/messages";
import { Marker, MarkerContent } from "@repo/ui/marker";

// 3 minute
const GROUP_GAP_MS = 3 * 60 * 1000;

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
  isGroupRoom: boolean;
  currentFursonaId: string;
  otherFursona: OtherFursona;
  firstUnreadMessageId: string | null;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

function groupConsecutiveMessages(messages: MessageType[]) {
  const groups: MessageType[][] = [];

  for (const message of messages) {
    const lastGroup = groups[groups.length - 1];
    const lastMessage = lastGroup?.[lastGroup.length - 1];

    const sameSender =
      lastMessage?.sender_fursona_id === message.sender_fursona_id;
    const withinGap =
      !!lastMessage &&
      new Date(message.created_at).getTime() -
        new Date(lastMessage.created_at).getTime() <=
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
  isGroupRoom,
  otherFursona,
  currentFursonaId,
  firstUnreadMessageId,
  onLoadMore,
  hasMore,
}: Readonly<ChatBoxProps>) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => groupConsecutiveMessages(messages), [messages]);
  const otherName =
    otherFursona?.display_name ?? otherFursona?.username ?? "Unknown";

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
    <MessageScroller className="flex-1 min-h-0 px-4 my-2">
      <MessageScrollerViewport ref={viewportRef} onScroll={handleScroll}>
        <MessageScrollerContent className="py-2">
          {groups.map((group) => {
            const isOwn = group[0]?.sender_fursona_id === currentFursonaId;

            return (
              <MessageScrollerItem
                key={group[0]?.id}
                messageId={group[0]?.id}
                scrollAnchor={isOwn}
              >
                <MessageGroup>
                  {group.map((message, i) => (
                    <div key={message.id} className="space-y-5">
                      {message.id === firstUnreadMessageId && (
                        <Marker variant="separator">
                          <MarkerContent>New messages</MarkerContent>
                        </Marker>
                      )}

                      <MessageBubble
                        message={message}
                        isOwn={isOwn}
                        isGroupMessage={isGroupRoom}
                        showAvatar={!isOwn && i === group.length - 1}
                        showHeader={!isOwn && i === 0}
                        showFooter={i === group.length - 1}
                        senderName={otherName}
                        senderAvatarUrl={otherFursona?.avatar_url}
                      />
                    </div>
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
