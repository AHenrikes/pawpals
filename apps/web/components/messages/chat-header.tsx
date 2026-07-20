"use client";

import { MoreVertical, Info, X, SearchIcon, VideoIcon, PhoneIcon, ArrowLeftIcon, ContactIcon, PlusIcon, LucideIcon, BanIcon, ThumbsDownIcon, UserRoundPenIcon, SquareMousePointerIcon, BellOffIcon, ClockFading, UsersRoundIcon, ClockFadingIcon, StarIcon, HeartPlusIcon, XIcon, LinkIcon, PhoneForwardedIcon, TrashIcon, BrushCleaningIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import type { Conversation } from "@/types/messages";
import { TypographyP, TypographyXSmall } from "@repo/ui/typography";

interface ChatHeaderProps {
  conversation: Conversation;
  onViewProfile?: () => void;
  onCloseConversation?: () => void;
}

type HeaderCTAProps = {
  label: string;
  action?: () => void; 
  icon?: LucideIcon;
  subactions?: HeaderCTAProps[];
};

export function ChatHeader({
  conversation,
  onViewProfile,
  onCloseConversation,
}: Readonly<ChatHeaderProps>) {
  const headerCTA: HeaderCTAProps[] = [
    {label: "Contact info", action: onViewProfile, icon: UserRoundPenIcon},
    {label: "Search", icon: SearchIcon},
    {label: "Select messages", icon: SquareMousePointerIcon},
    {label: "Mute notifications", icon: BellOffIcon, subactions: [
      {label: "1 hour"},
      {label: "1 Day"},
      {label: "1 Week"},
    ]},
    {label: "Disapearing messages", icon: ClockFadingIcon},
    {label: "Add to favourites", icon: HeartPlusIcon},
    {label: "Add to group", icon: UsersRoundIcon, subactions: [
      {label: "New Group", icon: PlusIcon}
    ]},
    {label: "Close chat", action: onCloseConversation, icon: XIcon},
  ]  

  const name =
    conversation.other_fursona?.display_name ??
    conversation.other_fursona?.username ??
    conversation.name ??
    "Unknown";

  return (
    <header className="flex items-center justify-between h-16 px-2 py-4 border-b border-border md:px-4">
      <div className="flex items-center gap-2">
        <Button
          size={"icon"}
          variant={"ghost"}
          onClick={onCloseConversation}
          className="p-2 md:hidden"
        >
          <ArrowLeftIcon size={16} />
        </Button>

        <Avatar className="h-9 w-9">
          <AvatarImage src={conversation.other_fursona?.avatar_url ?? undefined} />
          <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div>
          <TypographyP className="leading-3">{name}</TypographyP>
          <TypographyXSmall className="text-muted-foreground">last seen 2 hours ago</TypographyXSmall>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          size={"icon"}
          variant={"ghost"}
          className="p-2"
        >
          <VideoIcon size={16} />
        </Button>

        <Button
          size={"icon"}
          variant={"ghost"}
          className="p-2"
        >
          <PhoneIcon size={16} />
        </Button>

        <Button
          size={"icon"}
          variant={"ghost"}
          className="hidden p-2 md:block"
        >
          <SearchIcon size={16} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            {headerCTA.map(item => {
              const Icon = item.icon;

              if (item.subactions) {
                return (
                  <DropdownMenuSub key={item.label}>
                    <DropdownMenuSubTrigger>
                      {Icon && <Icon className="mr-2 w-4 h-4" />}
                      {item.label}
                    </DropdownMenuSubTrigger>

                    <DropdownMenuSubContent>
                      {item.subactions.map(sub => {
                        const SubIcon = sub.icon;

                        return (
                          <DropdownMenuItem key={sub.label}>
                            {SubIcon && <SubIcon className="mr-2 w-4 h-4" />}

                            {sub.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )
              }

              return (
                <DropdownMenuItem
                  key={item.label}
                  onClick={item.action}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {item.label}
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <LinkIcon className="mr-2 h-4 w-4" />
                Send call link
              </DropdownMenuItem>

              <DropdownMenuItem>
                <PhoneForwardedIcon className="mr-2 h-4 w-4" />
                New group call
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive">
                <ThumbsDownIcon />
                Report
              </DropdownMenuItem>

              <DropdownMenuItem variant="destructive">
                <BanIcon />
                Block
              </DropdownMenuItem>

              <DropdownMenuItem variant="destructive">
                <BrushCleaningIcon />
                Clear chat
              </DropdownMenuItem>

              <DropdownMenuItem variant="destructive">
                <TrashIcon />
                Delete chat
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
