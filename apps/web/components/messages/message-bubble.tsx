"use client";

import { FileIcon } from "lucide-react";
import { cn } from "@/lib/helpers/utils";
import type { MessageType } from "@/types/messages";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { Bubble, BubbleContent } from "@repo/ui/bubble";
import {
  Attachment,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
} from "@repo/ui/attachment";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@repo/ui/message";

interface MessageBubbleProps {
  message: MessageType;
  isOwn: boolean;
  isGroupMessage: boolean;
  showAvatar?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  senderName?: string;
  senderAvatarUrl?: string | null;
}

function getFileName(url: string) {
  try {
    return decodeURIComponent(new URL(url).pathname.split("/").pop() || "attachment");
  } catch {
    return "attachment";
  }
}

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|avif)(\?.*)?$/i.test(url);
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function MessageBubble({
  message,
  isOwn,
  isGroupMessage,
  showAvatar = true,
  showHeader = false,
  showFooter = true,
  senderName = "Unknown",
  senderAvatarUrl,
}: Readonly<MessageBubbleProps>) {
  const timestamp = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Message align={isOwn ? "end" : "start"}>
      {isGroupMessage && !isOwn && (
        <MessageAvatar>
          {showAvatar ? (
            <Avatar className="h-7 w-7">
              <AvatarImage src={senderAvatarUrl ?? undefined} />
              <AvatarFallback>{getInitials(senderName)}</AvatarFallback>
            </Avatar>
          ) : null}
        </MessageAvatar>
      )}

      <MessageContent>
        <Bubble variant={isOwn ? undefined : "muted"}>
          {
            (() => {
              if (!message.attachment_url) return (
                <BubbleContent
                  className={
                    `whitespace-pre-wrap wrap-break-word text-sm
                    ${isOwn ? "rounded-br-none" : "rounded-bl-none"}`
                  }
                >
                  {isGroupMessage &&  showHeader && !isOwn && (
                    <MessageHeader className="text-xs text-muted-foreground p-0">{senderName}</MessageHeader>
                  )}

                  {message.content}
                </BubbleContent>
              );

              if (isImageUrl(message.attachment_url)) {
                return (
                  <BubbleContent className="flex flex-col gap-2 p-1">
                    {!isOwn && showHeader && (
                      <MessageHeader className="text-xs text-muted-foreground">{senderName}</MessageHeader>
                    )}

                    <img
                      src={message.attachment_url}
                      alt={message.content || "Attachment"}
                      className="max-w-60 rounded-[calc(var(--radius)-2px)] sm:max-w-xs"
                    />
                    {message.content && <p className="px-2 pb-1 text-sm">{message.content}</p>}
                  </BubbleContent>
                );
              }

              return (
                <BubbleContent className="flex flex-col gap-2">
                  {!isOwn && showHeader && (
                    <MessageHeader className="text-xs text-muted-foreground">{senderName}</MessageHeader>
                  )}

                  <Attachment size="sm">
                    <AttachmentMedia>
                      <FileIcon />
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>{getFileName(message.attachment_url)}</AttachmentTitle>
                    </AttachmentContent>
                  </Attachment>
                  {message.content && <p className="text-sm">{message.content}</p>}
                </BubbleContent>
              );
            })()
          }
        </Bubble>
        {showFooter && (
          <MessageFooter
            className={cn("text-[11px] text-muted-foreground", isOwn ? "text-end" : "text-start")}
          >
            {timestamp}
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  );
}