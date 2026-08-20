"use client";

import { api } from "@/lib/api/api-client";
import { getErrorMessage } from "@/lib/helpers/error-utils";
import { useUser } from "@/providers/UserProvider";
import { useProfile } from "@/hooks/core/fursonas/useProfile";
import { Button } from "@repo/ui/button";
import { useFollow } from "@/hooks/social/followers/useFollow";
import { DotIcon, MailIcon } from "lucide-react";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useProfileCounts } from "@/hooks/core/views/useProfileCounts";
import { EditProfileModal } from "@/components/dialogs/EditProfileModal";
import { toast } from "@repo/ui/sonner";
import {
  TypographyLead,
  TypographySmall,
  TypographyXSmall,
} from "@repo/ui/typography";
import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "@repo/ui/skeleton";
import type { FursonaProfile, FursonaTypes } from "@/types/fursona";
import Banner from "@/components/profile/ProfileBanner";
import ProfileName from "@/components/profile/ProfileName";
import ProfileCTA from "@/components/profile/ProfileCTA";
import ProfileContent from "@/components/profile/ProfileContent";
import ProfileAside from "@/components/profile/ProfileAside";

function formatNumbers(count: number): string {
  if (count < 1000) return `${count}`;
  const units = ["K", "M", "B", "T"];
  const tier = Math.floor(Math.log10(count) / 3) - 1;
  const scale = Math.pow(1000, tier + 1);
  const scaled = count / scale;
  return `${scaled.toFixed(scaled % 1 === 0 ? 0 : 1)}${units[tier]}`;
}

export default function ProfilePage() {
  const { currentFursona, refresh, loading: userLoading } = useUser();
  const { username: paramUsername } = useParams<{ username: string }>();
  const { profile, loading: profileLoading } = useProfile(paramUsername);

  const [isEditOpen, setIsEditOpen] = useState(false);

  const id = profile?.id;
  const isOwnProfile = currentFursona?.id === id;
  const viewedFursona: FursonaProfile | null = profile || currentFursona;

  const { isFollowing, isMutual, toggle, loading } = useFollow(id);
  const { following, follower, likes, refetch } = useProfileCounts(id);

  const isLoading = isOwnProfile
    ? userLoading || !currentFursona
    : profileLoading;

  const handleEditSave = async (updates: Partial<FursonaTypes>) => {
    if (!isOwnProfile || !viewedFursona)
      throw new Error("Cannot edit other profiles");
    try {
      await api.patch<{ fursona: FursonaTypes }>(
        `/api/core/fursonas/${(viewedFursona as FursonaTypes).id}`,
        updates,
      );
      toast.success("Fursona updated");
      refresh();
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error(`Update failed: ${message}`);
      throw new Error(message);
    }
  };

  if (isLoading || !viewedFursona) return null;

  return (
    <div className="flex-1 w-full bg-background">
      {/* Banner */}
      <Banner fursona={viewedFursona} loading={isLoading} />

      {/* Profile header */}
      <section className="px-2 py-4 sm:container sm:mx-auto md:px-4">
        <div className="relative -mt-16 space-y-4 sm:-mt-20 md:-mt-24 z-20">
          <div className="flex justify-between">
            <ProfileName fursona={viewedFursona} loading={isLoading} />

            {/* Action button */}
            <div className="pt-16 md:flex md:items-center gap-4">
              {isOwnProfile ? (
                <Button size={"lg"} onClick={() => setIsEditOpen(true)}>
                  <p>Edit Profile</p>
                </Button>
              ) : (
                <div className="flex gap-4 items-center">
                  {isFollowing && isMutual && (
                    <Button
                      size={"icon-lg"}
                      variant={"secondary"}
                      className="text-text-muted hover:text-text"
                    >
                      <MailIcon />
                    </Button>
                  )}

                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    onClick={async () => {
                      await toggle();
                      refetch();
                    }}
                    disabled={loading}
                    className="rounded-full px-6"
                  >
                    {!isFollowing && isMutual
                      ? "Follow back"
                      : isFollowing
                        ? "Unfollow"
                        : "Follow"}
                  </Button>

                  <ProfileCTA />
                </div>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <div className="flex gap-4">
                <motion.div
                  key="info-skeleton"
                  exit={{ opacity: 0 }}
                  className="flex-1 w-full pb-0 space-y-6"
                >
                  <Skeleton className="h-12 w-full" />
                  <div className="flex gap-3 sm:gap-6 justify-start">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center w-16 gap-2"
                      >
                        <Skeleton className="h-9 w-8 rounded-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                </motion.div>

                <aside className="hidden sticky top-20 flex-col w-125 h-[calc(100svh-96px)] gap-5 md:flex">
                  <div>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>

                  <div>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </aside>
              </div>
            ) : (
              <div className="flex gap-10">
                <div className="flex-1 space-y-4 w-full">
                  {/* Bio */}
                  {viewedFursona.bio && (
                    <motion.div
                      key="about-content"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.35,
                        ease: "easeOut",
                      }}
                      className="gradientBG h-fit p-4 rounded-base"
                    >
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-primary shadow-lg shadow-red-500/70" />

                        <TypographyLead>Bio</TypographyLead>

                        <DotIcon />

                        <TypographySmall className="text-text-muted">
                          {viewedFursona.pronouns}
                        </TypographySmall>
                      </span>

                      <TypographyXSmall className="text-text-muted wrap-break-word">
                        {viewedFursona.bio}
                      </TypographyXSmall>
                    </motion.div>
                  )}

                  {/* Numbers */}
                  <motion.div
                    key="counts"
                    className="flex-1 w-full space-y-6"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
                  >
                    <div className="flex gap-3 sm:gap-6 justify-start">
                      {[
                        { count: follower, label: "Followers" },
                        { count: following, label: "Following" },
                        { count: likes, label: "Likes" },
                      ].map(({ count, label }) => (
                        <div key={label} className="text-center">
                          <TypographyLead className="text-text-muted font-bold text-lg sm:text-xl">
                            {formatNumbers(count)}
                          </TypographyLead>

                          <TypographyXSmall className="text-text-muted text-xs">
                            {label}
                          </TypographyXSmall>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Content */}
                  <ProfileContent fursona={viewedFursona} />
                </div>

                <ProfileAside isFollowing={isFollowing} />
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Modals */}
      {isOwnProfile && viewedFursona && (
        <EditProfileModal
          fursona={viewedFursona as FursonaTypes}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}
