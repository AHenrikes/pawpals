import { FursonaProfile } from "@/types/fursona";
import { getInitials } from "@/lib/helpers/getInitials";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import {
  TypographyH1,
  TypographyLead,
  TypographyP,
  TypographyXSmall,
} from "@repo/ui/typography";
import { Button } from "@repo/ui/button";
import {
  Loader2Icon,
  MailIcon,
  UserMinusIcon,
  UserPlusIcon,
  UserRoundCheckIcon,
  UserRoundXIcon,
} from "lucide-react";
import type { ConnectionTab } from "./ProfileConnections";
import { avatarImageSrc } from "@/lib/uploads/avatarImageSrc";
import useAchievement from "@/hooks/useAchievement";
import useIsMobile from "@/hooks/useIsMobile";
import Link from "next/link";

interface ProfileInfoProps {
  fursona: FursonaProfile;

  isOwnProfile: boolean;
  isFollowing: boolean;
  isPending: boolean;
  isMutual: boolean;
  followLoading: boolean;

  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesCount: number;

  toggle: () => Promise<void>;
  onOpenConnections: (tab: ConnectionTab) => void;
}

function formatNumbers(count: number): string {
  if (count < 1000) return `${count}`;
  const units = ["K", "M", "B", "T"];
  const tier = Math.floor(Math.log10(count) / 3) - 1;
  const scale = Math.pow(1000, tier + 1);
  const scaled = count / scale;
  return `${scaled.toFixed(scaled % 1 === 0 ? 0 : 1)}${units[tier]}`;
}

export default function ProfileInfo({
  fursona,

  isOwnProfile,
  isFollowing,
  isPending,
  isMutual,
  followLoading,

  postsCount,
  followingCount,
  followersCount,
  likesCount,

  toggle,
  onOpenConnections,
}: Readonly<ProfileInfoProps>) {
  const achievements = fursona.featured_achievements ?? [];
  const achievementDetails = useAchievement();
  const isMobile = useIsMobile();

  let followLabel = "Follow";
  let FollowIcon = UserPlusIcon;

  if (isPending) {
    followLabel = "Requested";
    FollowIcon = UserRoundXIcon;
  } else if (isFollowing) {
    followLabel = "Unfollow";
    FollowIcon = UserMinusIcon;
  } else if (isMutual) {
    followLabel = "Follow back";
    FollowIcon = UserRoundCheckIcon;
  }

  return (
    <>
      <motion.section
        key="avatar-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        className="flex w-full min-w-0 items-end gap-3 sm:gap-4"
      >
        <Avatar
          size="lg"
          className="h-24 w-24 shrink-0 border-4 border-background shadow-lg sm:h-32 sm:w-32 md:h-40 md:w-40"
        >
          <AvatarImage
            src={avatarImageSrc(fursona.avatar_url, 320)}
            alt={fursona.display_name}
          />
          <AvatarFallback>{getInitials(fursona.display_name)}</AvatarFallback>
        </Avatar>

        <div className="flex flex-1 justify-between items-end min-w-0 mb-1 md:mb-4">
          <div className="min-w-0">
            <TypographyH1 className="truncate text-xl sm:text-2xl lg:text-3xl">
              {fursona.display_name}
            </TypographyH1>

            <span className="flex min-w-0 flex-wrap items-center gap-1.5">
              <TypographyP className="min-w-0 truncate text-text-muted leading-6 lg:leading-7">
                @{fursona.username}
              </TypographyP>

              {fursona.pronouns !== null && (
                <TypographyXSmall className="shrink-0 p-0.5 px-2 text-text/60 border border-foreground/10">
                  {fursona.pronouns}
                </TypographyXSmall>
              )}
            </span>

            {achievements.length > 0 ? (
              <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto scrollbar-hide">
                {achievements.map((achievementId) => {
                  const achievement = achievementDetails.find(
                    ({ id }) => id === achievementId,
                  );

                  if (!achievement) return null;

                  return (
                    <span
                      key={achievement.id}
                      role="img"
                      aria-label={`${achievement.name}: ${achievement.description}`}
                      title={`${achievement.name}: ${achievement.description}`}
                      className="grid size-8 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/10 cursor-pointer"
                    >
                      {achievement.symbol}
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>

          {!isMobile && !isOwnProfile && (
            <div className="flex shrink-0 justify-self-end items-center gap-2">
              {isFollowing && isMutual && (
                <Button
                  asChild
                  size="icon"
                  variant="accent"
                  aria-label="Message fursona"
                  className="shrink-0 p-2 text-text-muted hover:text-text"
                >
                  <Link href={`/messages?peer=${fursona.id}`}>
                    <MailIcon />
                  </Link>
                </Button>
              )}

              <Button
                variant={isFollowing || isPending ? "outline" : "default"}
                onClick={() => toggle()}
                disabled={followLoading}
                aria-label={followLabel}
                className="shrink-0 rounded-full px-3 sm:px-4"
              >
                {followLoading ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {/* Small screens */}
                    <FollowIcon className="h-4 w-4 sm:hidden" />

                    {/* sm and above */}
                    <span className="hidden sm:inline">{followLabel}</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </motion.section>

      {/* Numbers */}
      <motion.div
        key="counts"
        className="grid grid-cols-4 gap-2 overflow-x-auto scrollbar-hide sm:flex"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
      >
        {[
          { count: postsCount, label: "Posts" },
          { count: followersCount, label: "Followers" },
          { count: followingCount, label: "Following" },
          { count: likesCount, label: "Likes" },
        ].map(({ count, label }) => {
          if (label === "Followers" || label === "Following")
            return (
              <div key={label} className="min-w-0">
                <Button
                  variant={"ghost"}
                  onClick={() =>
                    onOpenConnections(label.toLowerCase() as ConnectionTab)
                  }
                  aria-haspopup="dialog"
                  aria-label={`${count} ${label.toLowerCase()}`}
                  className="flex h-auto w-full min-w-16 flex-col items-center gap-1.5 rounded-sm bg-secondary-dim/40 px-2 py-2 hover:bg-secondary-dim md:flex-row md:gap-2 md:bg-transparent"
                >
                  <TypographyLead className="text-base font-bold text-text md:text-xl">
                    {formatNumbers(count)}
                  </TypographyLead>

                  <TypographyXSmall className="text-[0.65rem] text-text-muted md:text-xs">
                    {label}
                  </TypographyXSmall>
                </Button>
              </div>
            );

          return (
            <div
              key={label}
              className="flex min-w-16 flex-col items-center gap-1.5 rounded-sm bg-secondary-dim/40 px-2 py-2 sm:min-w-0 sm:flex-row sm:bg-transparent sm:p-0"
            >
              <TypographyLead className="text-base font-bold text-text sm:text-xl">
                {formatNumbers(count)}
              </TypographyLead>

              <TypographyXSmall className="text-[0.65rem] text-text-muted sm:text-xs">
                {label}
              </TypographyXSmall>
            </div>
          );
        })}
      </motion.div>

      {/* CTA buttons */}
      {isMobile && !isOwnProfile && (
        <div className="grid grid-cols-2 gap-2">
          {isFollowing && isMutual && (
            <Button
              aria-label="Message fursona"
              className="shrink-0 rounded-md shadow-none"
            >
              <Link href={`/messages?peer=${fursona.id}`}>
                <span className="sm:inline">Message</span>
              </Link>
            </Button>
          )}

          <Button
            variant={isFollowing && isMutual || isPending ? "outline" : "default"}
            onClick={() => toggle()}
            disabled={followLoading}
            aria-label={followLabel}
            className="shrink-0 rounded-md shadow-none"
          >
            {followLoading ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <span className="sm:inline">{followLabel}</span>
            )}
          </Button>

          {!isMutual && (
            <Button
              variant={"outline"}
              onClick={() => toggle()}
              disabled={followLoading}
              aria-label={followLabel}
              className="shrink-0 rounded-md px-3 sm:px-4"
            >
              {followLoading ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <span className="sm:inline">share</span>
              )}
            </Button>
          )}
        </div>
      )}
    </>
  );
}
