"use client";

import { api } from "@/lib/api/api-client";
import { getErrorMessage } from "@/lib/helpers/error-utils";
import { useUser } from "@/providers/UserProvider";
import { useProfile } from "@/hooks/core/fursonas/useProfile";
import { Button } from "@repo/ui/button";
import { Separator } from "@repo/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { useFollow } from "@/hooks/social/followers/useFollow";
import {
  TypographyH2,
  TypographyLead,
  TypographySmall,
  TypographyXSmall,
} from "@repo/ui/typography";
import { EllipsisVerticalIcon } from "lucide-react";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useProfileCounts } from "@/hooks/core/views/useProfileCounts";
import { EditProfileModal } from "@/components/dialogs/EditProfileModal";
import { toast } from "@repo/ui/sonner";
import { Skeleton } from "@repo/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import type { FursonaProfile, FursonaTypes } from "@/types/fursona";
import ProfilePost from "@/components/ProfilePost";
import ProfileRepost from "@/components/ProfileRepost";
import Image from "next/image";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatNumbers(count: number): string {
  if (count < 1000) return `${count}`;
  const units = ["K", "M", "B", "T"];
  const tier = Math.floor(Math.log10(count) / 3) - 1;
  const scale = Math.pow(1000, tier + 1);
  const scaled = count / scale;
  return `${scaled.toFixed(scaled % 1 === 0 ? 0 : 1)}${units[tier]}`;
}

const profileNav = [
  { label: "POST",    key: "post" },
  { label: "REPOST",  key: "repost" },
  { label: "ARCHIVE", key: "archive" },
  { label: "LIKE",    key: "likes" },
] as const;

type ContentKey = typeof profileNav[number]["key"];

export default function ProfilePage() {
  const { currentFursona, refresh, loading: userLoading } = useUser();
  const { username: paramUsername } = useParams<{ username: string }>();
  const { following, follower, refetch, like, } = useProfileCounts(paramUsername);
  const { isFollowing, toggle: follow, loading: followLoading } = useFollow(paramUsername);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [content, setContent] = useState<ContentKey>("post");
  const [direction, setDirection] = useState(0);

  const isOwnProfile = currentFursona?.username === paramUsername;

  const { profile, loading: profileLoading } = useProfile(
    isOwnProfile ? "" : paramUsername
  );

  const viewedFursona: FursonaProfile | null = isOwnProfile
    ? currentFursona
    : profile;

  const isLoading = isOwnProfile ? userLoading || !currentFursona : profileLoading;

  const handleEditSave = async (updates: Partial<FursonaTypes>) => {
    if (!isOwnProfile || !viewedFursona) throw new Error("Cannot edit other profiles");
    try {
      await api.patch<{ fursona: FursonaTypes }>(
        `/api/core/fursonas/me/${(viewedFursona as FursonaTypes).id}`,
        updates,
      );
      toast.success("Fursona updated");
      refresh()
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error(`Update failed: ${message}`);
      throw new Error(message);
    }
  };

  const handleNavClick = (key: ContentKey) => {
    const oldIndex = profileNav.findIndex(n => n.key === content);
    const newIndex = profileNav.findIndex(n => n.key === key);
    setDirection(newIndex > oldIndex ? 1 : -1);
    setContent(key);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  if (isLoading || !viewedFursona) return null;
  
  let followLabel = "";
  
  if(followLoading) {
    followLabel = "...";
  } else if (isFollowing) {
    followLabel = "Unfollow";
  } else {
    followLabel = "Follow";
  }

  return (
    <>
      {/* Banner */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.section
            key="banner-skeleton"
            exit={{ opacity: 0 }}
            className="relative w-full h-64 sm:h-96 md:h-[500px]"
          >
            <Skeleton className="h-full" />
          </motion.section>
        ) : (
          <motion.section
            key="banner-content"
            className="relative w-full h-64 sm:h-96 md:h-[500px]"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {viewedFursona.banner_url && (
              <Image
                src={viewedFursona.banner_url}
                alt={`${viewedFursona.display_name}'s banner`}
                quality={100}
                fill
                className="object-cover z-10"
                priority
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black z-20" />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Profile header */}
      <section className="px-2 py-4 mb-4 sm:container sm:mx-auto md:px-4">
        <div className="relative -mt-16 space-y-6 sm:-mt-20 md:-mt-24 z-20">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="avatar-skeleton" exit={{ opacity: 0 }} className="flex items-center gap-4">
                <Skeleton className="animate-none h-32 w-32 rounded-full sm:h-36 sm:w-36 md:h-44 md:w-44 lg:h-48 lg:w-48 border-4 border-background shadow-lg flex-shrink-0" />
                <div className="min-w-0 mb-4 space-y-2">
                  <Skeleton className="h-9 w-52 animate-none border-2 border-background" />
                  <Skeleton className="h-4 w-40 animate-none border-2 border-background" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="avatar-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                className="flex flex-col"
              >
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar size="lg" className="h-32 w-32 sm:h-36 sm:w-36 md:h-44 md:w-44 lg:h-48 lg:w-48 border-4 border-background shadow-lg flex-shrink-0">
                      <AvatarImage src={viewedFursona.avatar_url ?? undefined} alt={viewedFursona.display_name} />
                      <AvatarFallback>{getInitials(viewedFursona.display_name)}</AvatarFallback>
                    </Avatar>

                    <div className="hidden relative px-2 top-5 sm:flex flex-1 flex-col sm:max-w-52 xl:max-w-full">
                      <TypographyH2 className="truncate text-xl sm:text-2xl">
                        {viewedFursona.display_name}
                      </TypographyH2>

                      <TypographySmall className="text-muted-foreground truncate">
                        @{viewedFursona.username}
                      </TypographySmall>
                    </div>
                  </div>

                  <div className="relative top-4 flex items-center gap-4">
                    {isOwnProfile ? (
                      <Button onClick={() => setIsEditOpen(true)}>
                        <p>Edit Profile</p>
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => {
                          follow();
                          
                          setTimeout(() => {
                            refetch();
                          }, 350)
                        }}
                        disabled={followLoading}
                      >
                        { followLoading ? "..." : followLabel }
                      </Button>
                    )}

                    <Button
                      size={"icon"}
                      variant={"outline"}
                    >
                      <EllipsisVerticalIcon className="h-6 w-6" />
                    </Button>
                  </div>
                </div>

                <div className="px-2 sm:hidden">
                  <TypographyH2 className="text-xl sm:text-2xl truncate">{viewedFursona.display_name}</TypographyH2>
                  <TypographySmall className="text-muted-foreground">@{viewedFursona.username}</TypographySmall>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="info-skeleton" exit={{ opacity: 0 }} className="flex-1 w-full pb-0 space-y-6">
                <Skeleton className="h-4 w-72" />
                <div className="flex gap-3 sm:gap-6 justify-start">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex flex-col items-center w-16 gap-2">
                      <Skeleton className="h-9 w-8 rounded-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="info-content"
                className="flex-1 w-full pb-0 space-y-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
              >
                <TypographyXSmall className="block max-w-xl text-muted-foreground break-words">
                    { viewedFursona?.bio }
                </TypographyXSmall>

                <div className="flex gap-3 sm:gap-6 justify-start">
                  {[
                    { count: follower, label: "Followers" },
                    { count: following, label: "Following" },
                    { count: like, label: "Likes" },
                  ].map(({ count, label }) => (
                    <div key={label} className="text-center">
                      <TypographyLead className="font-bold text-lg sm:text-xl">
                        {formatNumbers(count)}
                      </TypographyLead>

                      <TypographyXSmall className="text-muted-foreground text-xs">
                        { label }
                      </TypographyXSmall>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/*  Profile content */}
      <div className="flex flex-col sm:container sm:mx-auto">
        {/* Nav */}
        <nav className="shrink-0 space-y-1 sm:space-y-2">
          <ul className="flex flex-wrap gap-2 sm:gap-0">
            {profileNav.map(({ label, key }) => (
              <Button
                key={label}
                size="sm"
                variant="ghost"
                className={`text-xs sm:text-sm ${content === key ? "bg-surface-container-highest" : ""}`}
                onClick={() => handleNavClick(key)}
              >
                {label}
              </Button>
            ))}
          </ul>
          <Separator className="h-[.5px]" />
        </nav>

        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.section
            key={content}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            {content === "post"    && <ProfilePost username={viewedFursona.username} />}
            {content === "repost"  && <ProfileRepost username={paramUsername} />}
            {content === "archive" && <div>Archive coming soon</div>}
            {content === "likes"   && <div>Likes coming soon</div>}
          </motion.section>
        </AnimatePresence>
      </div>

      {/* Modals */}
      {isOwnProfile && viewedFursona && (
        <EditProfileModal
          fursona={viewedFursona as FursonaTypes}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={handleEditSave}
        />
      )}
    </>
  );
}
