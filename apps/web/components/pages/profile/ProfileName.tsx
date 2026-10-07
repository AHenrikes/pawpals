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
} from "lucide-react";
import ProfileCTA from "./ProfileCTA";

interface ProfileInfoProps {
  fursona: FursonaProfile;

  isOwnProfile: boolean;
  isFollowing: boolean;
  isMutual: boolean;
  followLoading: boolean;

  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesCount: number;

  toggle: () => Promise<void>;
}

function formatNumbers(count: number): string {
  if (count < 1000) return `${count}`;
  const units = ["K", "M", "B", "T"];
  const tier = Math.floor(Math.log10(count) / 3) - 1;
  const scale = Math.pow(1000, tier + 1);
  const scaled = count / scale;
  return `${scaled.toFixed(scaled % 1 === 0 ? 0 : 1)}${units[tier]}`;
}

export default function ProfileName({
  fursona,

  isOwnProfile,
  isFollowing,
  isMutual,
  followLoading,

  postsCount,
  followingCount,
  followersCount,
  likesCount,

  toggle,
}: Readonly<ProfileInfoProps>) {
  let followLabel = "Follow";
  let FollowIcon = UserPlusIcon;

  if (isFollowing) {
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
        className="flex w-full min-w-0 items-end gap-2"
      >
        <Avatar
          size="lg"
          className="h-28 w-28 md:h-44 md:w-44 border-4 border-background shadow-lg shrink-0"
        >
          <AvatarImage
            src={fursona.avatar_url ?? undefined}
            alt={fursona.display_name}
          />
          <AvatarFallback>{getInitials(fursona.display_name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-1 px-2 md:mb-5">
          <div className="min-w-0">
            <TypographyH1 className="truncate text-xl sm:text-2xl">
              {fursona.display_name}
            </TypographyH1>

            <span className="flex min-w-0 items-center gap-1.5">
              <TypographyP className="min-w-0 truncate text-text-muted">
                @{fursona.username}
              </TypographyP>

              <TypographyXSmall className="shrink-0 p-0.5 px-2 text-text/60 border border-foreground/10">
                {fursona.pronouns}
              </TypographyXSmall>
            </span>
          </div>

          <div className="flex min-w-0 items-center gap-4">
            <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto scrollbar-hide">
              {new Array(1, 2, 3, 4, 5, 6).map((item) => (
                <div
                  key={item}
                  className="h-6 w-6 shrink-0 rounded-sm border border-primary/80 bg-secondary"
                />
              ))}
            </div>

            {!isOwnProfile && (
              <div className="flex shrink-0 items-center gap-2">
                {isFollowing && isMutual && (
                  <Button
                    size="icon"
                    variant="accent"
                    className="shrink-0 p-2 text-text-muted hover:text-text"
                  >
                    <MailIcon />
                  </Button>
                )}

                <Button
                  variant={isFollowing ? "outline" : "default"}
                  onClick={() => toggle()}
                  disabled={followLoading}
                  className="shrink-0 rounded-full px-2 md:px-4"
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

                <ProfileCTA />
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Numbers */}
      <motion.div
        key="counts"
        className="flex gap-4 px-4 py-4 overflow-y-scroll scrollbar-hide"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
      >
        {[
          { count: postsCount, label: "Posts" },
          { count: followersCount, label: "Followers" },
          { count: followingCount, label: "Following" },
          { count: likesCount, label: "Likes" },
        ].map(({ count, label }) => (
          <div key={label} className="flex items-center gap-2">
            <TypographyLead className="text-text-muted font-bold text-lg sm:text-xl">
              {formatNumbers(count)}
            </TypographyLead>

            <TypographyXSmall className="text-text-muted text-xs">
              {label}
            </TypographyXSmall>
          </div>
        ))}
      </motion.div>
    </>
  );
}
