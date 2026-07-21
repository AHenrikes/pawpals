"use client";

import Link from "next/link";
import { cn } from "@/lib/helpers/utils";
import { Fragment, useMemo, useRef, useState } from "react";
import { Input } from "@repo/ui/input";
import { Button } from "@repo/ui/button";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { useProfileSearch } from "@/hooks/core/fursonas/useProfileSearch";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { TypographyH1, TypographyLarge, TypographyP, TypographyXSmall } from "@repo/ui/typography";
import { LucideIcon, EllipsisVerticalIcon, Loader2, MessageCirclePlusIcon, PlusIcon, SearchIcon, UsersIcon, ArchiveIcon, BellOffIcon, PinIcon, LoaderCircleIcon, MessageSquareDotIcon, HeartPlusIcon, UserRoundIcon, UsersRoundIcon, BanIcon, BrushCleaningIcon, Trash2Icon, StarIcon, SquareMousePointerIcon, LockIcon, LogOutIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@repo/ui/dropdown-menu";
import { type Conversation } from "@/types/messages";
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@repo/ui/context-menu";

interface UserListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  onStartConversation: (username: string) => void | Promise<void>;
  currentUsername: string;
  creatingConversation?: boolean;
}

type CTAItem = {
  label: string;
  icon?: LucideIcon;
  subactions?: CTAItem[];
};

type ConversationCTAType = {
  label: string;
  icon?: LucideIcon;
  subactions?: CTAItem[];
  variant?: "destructive" | "default";
}

const filterButtons = [
  "All", "Unread", "Groups", "Favorites"
]

const menuCTA: CTAItem[] = [
  {label: "New Group", icon: UsersIcon},
  {label: "Archived", icon: ArchiveIcon},
  {label: "Starred Messages", icon: StarIcon},
  {label: "Select chats", icon: SquareMousePointerIcon},
  {label: "Mark all as read", icon: MessageSquareDotIcon},
]

const conversationCTA: ConversationCTAType[][] = [
  [{label: "Mark as read"}],

  [
    {label: "Profile"},
    {label: "Start a call"},
    {label: "Add note"},
    {label: "Add nickname"},
    {label: "Close DM"}
  ],

  [
    {label: "Apps", subactions: [{label: "No Commands Available"}]},
    {label: "Invite to server", subactions: [{label: "No Commands Available"}]}
  ],

  [
    {label: "Mute", variant: "destructive"},
    {label: "Remove friend", variant: "destructive"},
    {label: "Clear chat", variant: "destructive"},
    {label: "Block", variant: "destructive"},
    {label: "Report conversation", variant: "destructive"}
  ],

  [
    {label: "Share profile"},
    {label: "Copy channel ID"}
  ]
]

  // {label: "Archive Chat", icon: ArchiveIcon},
  // {label: "Mute Notification", icon: BellOffIcon, subactions: [
  //   { label: "1 Hour", }, { label: "1 day" }, { label: "Forever" }
  // ]},
  // {label: "Pin chat", icon: PinIcon},
  // {label: "Mark as unread", icon: MessageSquareDotIcon},
  // {label: "Add to favourites", icon: HeartPlusIcon },
  // {label: "Add to group", icon: UsersRoundIcon, subactions: [{label: "New group", icon: PlusIcon}]},
// ]

export function UserList({
  conversations,
  selectedId,
  onSelect,
  onStartConversation,
  currentUsername,
  creatingConversation,
}: Readonly<UserListProps>) {
  const [search, setSearch] = useState("");

  const { results: users, loading: searchingUsers } = useProfileSearch(search);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;

    const q = search.toLowerCase();

    return conversations.filter((conversation) => {
      const displayName = conversation.other_fursona?.display_name ?? "";
      const username = conversation.other_fursona?.username ?? "";
      const conversationName = conversation.name ?? "";
      const lastMessage = conversation.last_message ?? "";

      return [displayName, username, conversationName, lastMessage]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [conversations, search]);

  const suggestedUsers = useMemo(() => {
    if (!search.trim()) return [];

    const conversationUsernames = new Set(
      conversations
        .map((conversation) => conversation.other_fursona?.username?.toLowerCase())
        .filter(Boolean)
    );

    const currentUsernameLower = currentUsername.toLowerCase();

    return users.filter((user) => {
      const usernameLower = user.username.toLowerCase();
      return (
        usernameLower !== currentUsernameLower &&
        !conversationUsernames.has(usernameLower)
      );
    });
  }, [conversations, currentUsername, search, users]);

  return (
    <aside className="flex h-full min-w-full max-w-[30%] flex-col border-r border-border bg-background md:min-w-[420]">
      <header className="flex justify-between items-center h-16 p-4">
        <Link href={AUTH_ROUTES.HOME}>
          <TypographyH1 className="md:text-xl">PAWPALS</TypographyH1>
        </Link>

        <div className="flex items-center">
          <Button
            size={"icon"}
            variant={"ghost"}
          >
            <MessageCirclePlusIcon />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size={"icon"}
                variant={"ghost"}
              >
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              <DropdownMenuGroup>
                {menuCTA.map(elem => {
                  const Icon = elem.icon;

                  return (
                    <DropdownMenuItem key={elem.label}>
                      {Icon && <Icon size={32} />}
                      {elem.label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive">
                  <LockIcon />
                  App lock
                </DropdownMenuItem>

                <DropdownMenuItem variant="destructive">
                  <LogOutIcon />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="space-y-2">
        <header className="px-4 py-2 space-y-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4" />

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages..."
              className="h-10 pl-8 rounded-full"
            />
          </div>

          <div className="space-x-1">
            {filterButtons.map(elem => (
              <Button
                key={elem}
                size={"default"}
                variant={"outline"}
                className="px-4 rounded-full"
              >
                {elem}
              </Button>
            ))}
          </div>
        </header>

        <main className="flex flex-col gap-3 md:px-4">
          {filtered.length === 0 && !search.trim() && (
            <p className="p-4 text-sm text-muted-foreground">
              No conversations yet. Find a pal and say hi.
            </p>
          )}

          {filtered.map((conversation) => {
            const name =
              conversation.other_fursona?.display_name ??
              conversation.other_fursona?.username ??
              conversation.name ??
              "Unknown";

            const date = new Date(conversation.last_message_at);
            const now = new Date();
            const diffInMs = now.getTime() - date.getTime();
            const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;

            const formatted =
              diffInMs < twoDaysInMs
                ? date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : date.toLocaleDateString("en-GB");

            return (
              <ContextMenu key={conversation.id}>
                <ContextMenuTrigger>
                  <button
                    onClick={() => onSelect(conversation)}
                    className={cn(
                      "group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer md:px-2 md:rounded-md hover:bg-muted focus-visible:bg-muted focus-visible:outline-hidden",
                      selectedId === conversation.id && "bg-muted"
                    )}
                  >
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={conversation.other_fursona?.avatar_url ?? undefined} />
                      <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <TypographyLarge className="flex-1 truncate md:text-sm font-medium">{name}</TypographyLarge>

                        {!!conversation.unread_count && (
                          <TypographyP className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-dim px-1.5 text-[11px] font-semibold text-primary-foreground">
                            {conversation.unread_count}
                          </TypographyP>
                        )}
                      </div>

                      <div className="flex items-center">
                        <p className="flex-1 truncate text-xs text-muted-foreground">
                          {conversation.last_message ?? "Say hi 👋"}
                        </p>

                        <TypographyXSmall className="text-muted-foreground">
                          {formatted}
                        </TypographyXSmall>
                      </div>
                    </div>
                  </button>
                </ContextMenuTrigger>

                <ContextMenuContent
                  side="left"
                  className="rounded-md"
                >
                  {conversationCTA.map((group, groupIndex) => (
                    <Fragment key={groupIndex}>
                        {group.map((item) => {
                          const Icon = item.icon;

                          if (item.subactions) {
                            return (
                              <ContextMenuSub key={item.label}>
                                <ContextMenuSubTrigger>
                                  {Icon && <Icon />}
                                  {item.label}
                                </ContextMenuSubTrigger>

                                <ContextMenuSubContent>
                                  {item.subactions.map((sub) => {
                                    const SubIcon = sub.icon;

                                    return (
                                      <ContextMenuItem key={sub.label}>
                                        {SubIcon && <SubIcon />}
                                        {sub.label}
                                      </ContextMenuItem>
                                    );
                                  })}
                                </ContextMenuSubContent>
                              </ContextMenuSub>
                            );
                          }

                          return (
                            <ContextMenuGroup key={item.label}>
                              <ContextMenuItem variant={item.variant}>
                                {Icon && <Icon />}
                                {item.label}
                              </ContextMenuItem>
                            </ContextMenuGroup>
                          );
                        })}
                      {groupIndex < conversationCTA.length - 1 && (
                        <ContextMenuSeparator />
                      )}
                    </Fragment>
                  ))}
                </ContextMenuContent>
              </ContextMenu>
            )
          })}

          {search.trim() && (
            <>
              <div className="px-3 pb-2 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Find users
                </p>
              </div>

              {searchingUsers && (
                <div className="flex items-center gap-2 px-4 pb-3 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Searching users...
                </div>
              )}

              {!searchingUsers && suggestedUsers.length === 0 && filtered.length === 0 && (
                <p className="px-4 pb-4 text-sm text-muted-foreground">No users found.</p>
              )}

              {suggestedUsers.map((user) => {
                const name = user.display_name || user.username;

                return (
                  <button
                    key={`search-${user.username}`}
                    onClick={() => onStartConversation(user.username)}
                    disabled={creatingConversation}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-hidden",
                      creatingConversation && "cursor-not-allowed opacity-70"
                    )}
                  >
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={user.avatar_url ?? undefined} />
                      <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{name}</span>
                      <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </main>
      </main>
    </aside>
  );
}
