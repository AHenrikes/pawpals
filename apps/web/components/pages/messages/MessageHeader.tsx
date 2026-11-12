"use client";

import { Button } from "@repo/ui/button";
import {
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  ImageIcon,
  LinkIcon,
  MicIcon,
  PhoneIcon,
} from "lucide-react";
import { usePageTransition } from "@/components/transitions/PageTransitionProvider";
import { useReturnHeader } from "../../navigations/ReturnHeaderProvider";
import { motion } from "framer-motion";
import { TypographyXSmall } from "@repo/ui/typography";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/drawer";
import { mediaImageLoader } from "@/lib/uploads/mediaImageLoader";
import { useProfile } from "@/hooks/core/fursonas/useProfile";
import { useProfileFollow } from "@/hooks/social/followers/useProfileFollow";
import { useUser } from "@/providers/UserProvider";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/api-client";
import Link from "next/link";
import Image from "next/image";
import FursonaAvatar from "@/components/avatar-icons/FursonaAvatar";
import useAchievement from "@/hooks/useAchievement";

export type MessagedPeer = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
};

type MutualFriend = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

const linkPattern = /https?:\/\/[^\s]+/gi;

export default function MessageHeader({
  backHref,
  peer,
  messages = [],
}: Readonly<{
  backHref?: string;
  peer: MessagedPeer | null;
  messages?: readonly { body: string }[];
}>) {
  const { back, navigate } = usePageTransition();
  const { override } = useReturnHeader();
  const { currentFursona } = useUser();
  const peerId = peer?.id ?? "";
  const { profile } = useProfile(peerId);
  const { mutualSince } = useProfileFollow(peerId);
  const achievements = useAchievement();

  const { data: mutualFriends = [], isLoading: mutualFriendsLoading } =
    useQuery({
      queryKey: ["mutual-friends", currentFursona?.id, peerId],
      enabled: Boolean(currentFursona?.id && peerId),
      queryFn: async () => {
        const actorId = currentFursona?.id;
        if (!actorId) return [];
        const [mine, theirs] = await Promise.all([
          api.get<{ items: MutualFriend[] }>(
            `/api/core/fursonas/${actorId}/connections?tab=following&page=0`,
          ),
          api.get<{ items: MutualFriend[] }>(
            `/api/core/fursonas/${peerId}/connections?tab=following&page=0`,
          ),
        ]);
        const mineById = new Map(
          mine.items.map((friend) => [friend.id, friend]),
        );
        return theirs.items.filter((friend) => mineById.has(friend.id));
      },
    });

  if (peer === null) return null;

  const displayProfile = profile ?? {
    display_name: peer.displayName,
    username: peer.username,
    avatar_url: peer.avatarUrl,
    banner_url: peer.bannerUrl,
    profile_theme: undefined,
    featured_achievements: [],
    created_at: null,
  };

  const bannerUrl = displayProfile.banner_url ?? peer.bannerUrl;
  const featuredAchievements = displayProfile.featured_achievements ?? [];
  const linkCount = new Set(
    messages.flatMap((message) => message.body.match(linkPattern) ?? []),
  ).size;

  const chatSections = [
    { label: "Media", count: 0, Icon: ImageIcon },
    { label: "Links", count: linkCount, Icon: LinkIcon },
    { label: "Voice notes", count: 0, Icon: MicIcon },
  ];

  const formatDate = (value: string | Date | null | undefined) =>
    value
      ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" })
      : "—";

  let backLabel = "Go back";
  if (override) backLabel = "Previous";
  if (backHref === "/messages") backLabel = "Back to chats";

  const mutualFriendsContent = (() => {
    if (mutualFriendsLoading) {
      return <p className="text-sm text-text-muted">Loading mutual friends…</p>;
    }

    if (!mutualFriends.length) {
      return null
    }

    return (
      <>
        <p className="text-xs text-text-muted">Mutuals</p>

        {mutualFriends.slice(0, 6).map((friend) => (
          <Link
            key={friend.id}
            href={`/@${friend.username}`}
            className="flex w-fit min-w-0 items-center gap-2"
          >
            <FursonaAvatar
              name={friend.displayName}
              src={friend.avatarUrl}
              className="size-6 shrink-0"
            />
          </Link>
        ))}
      </>
    );
  })();

  return (
    <Drawer>
      <header className="fixed top-0 z-50 w-full bg-linear-to-b from-background to-transparent">
        <div className="flex h-16 items-center justify-between gap-2 px-2 md:px-4">
          <Button
            size="icon-sm"
            variant="outline"
            onClick={
              backHref ? () => navigate(backHref) : (override?.onBack ?? back)
            }
            aria-label={backLabel}
            className="rounded-full text-text-muted hover:text-text"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-5" />
          </Button>

          <DrawerTrigger
            aria-label={`Open chat information for ${peer.displayName}`}
            className="flex items-center w-full h-10 min-w-0 gap-2 p-1 text-left bg-background border border-border/60 rounded-full hover:bg-secondary hover:cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
          >
            <FursonaAvatar
              name={peer.displayName}
              src={peer.avatarUrl}
              className="size-7 shrink-0"
            />

            <span className="flex flex-col min-w-0">
              <TypographyXSmall className="text-text">
                {peer.displayName}
              </TypographyXSmall>

              <TypographyXSmall className="text-text-muted leading-3">
                Last seen recently
              </TypographyXSmall>
            </span>
          </DrawerTrigger>

          <div className="flex items-center h-10 shrink-0 gap-1 rounded-full border border-border/60 bg-background">
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", duration: 0.35, ease: "easeOut" }}
              aria-label="Call user"
              className="flex size-9 items-center justify-center rounded-full text-text-muted hover:cursor-pointer hover:text-text"
            >
              <PhoneIcon aria-hidden="true" size={18} />
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", duration: 0.35, ease: "easeOut" }}
              aria-label="Open chat information"
              className="flex size-9 items-center justify-center rounded-full text-text-muted hover:cursor-pointer hover:text-text"
            >
              <EllipsisVerticalIcon aria-hidden="true" size={20} />
            </motion.button>
          </div>
        </div>
      </header>

      <DrawerContent
        showHandle={false}
        className={`profile-theme-${displayProfile.profile_theme ?? "dark"} h-screen bg-background overflow-y-auto scrollbar-hide`}
      >
        <DrawerHeader className="relative min-h-56 justify-end px-2 overflow-hidden">
          {bannerUrl && (
            <Image
              src={bannerUrl}
              loader={
                bannerUrl.startsWith("/api/media/")
                  ? mediaImageLoader
                  : undefined
              }
              alt={`${peer.displayName}'s banner`}
              fill
              sizes="100vw"
              quality={85}
              loading="eager"
              fetchPriority="high"
              className="pointer-events-none object-cover"
            />
          )}

          <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent" />

          <div className="relative flex items-end w-full gap-3 pb-2 z-10">
            <FursonaAvatar
              name={peer.displayName}
              src={peer.avatarUrl}
              className="size-16"
            />

            <div className="min-w-0 text-start">
              <DrawerTitle className="truncate text-xl">
                <b>{displayProfile.display_name}</b>
              </DrawerTitle>

              {featuredAchievements.length ? (
                <div className="flex flex-wrap gap-2">
                  {featuredAchievements.map((achievementId) => {
                    const achievement = achievements.find(
                      (item) => item.id === achievementId,
                    );
                    if (!achievement) return null;

                    return (
                      <span
                        key={achievement.id}
                        title={achievement.description}
                        className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 p-1 text-xs text-text"
                      >
                        <span aria-hidden="true">{achievement.symbol}</span>
                        {/* {achievement.name} */}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <DrawerDescription className="truncate text-sm">
                  @{displayProfile.username}
                </DrawerDescription>
              )}
            </div>
          </div>
        </DrawerHeader>

        <div className="space-y-4 px-4 pt-2">
          <section className="space-y-2" aria-label="Mutual friends">
            {mutualFriendsContent}
          </section>

          <section aria-label="App member since">
            <p className="text-xs text-text-muted">Member since</p>
            <p className="mt-1 font-medium text-text">
              {formatDate(displayProfile.created_at)}
            </p>
          </section>

          <section aria-label="Mutual friends since">
            <p className="text-sm text-text-muted">Mutual friends since</p>
            <p className="text-sm font-semibold text-text">
              {mutualSince
                ? formatDate(mutualSince)
                : "You are not connected as mutual friends yet."}
            </p>
          </section>

          <hr />

          <div className="flex justify-between gap-2">
            {chatSections.map(({ Icon, ...section }) => (
              <Button
                key={section.label}
                variant={"accent"}
                className="w-full rounded-md"
              >
                <Icon className="size-5 text-primary" aria-hidden="true" />

                <span className="text-xs font-medium text-text">
                  {section.label}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
