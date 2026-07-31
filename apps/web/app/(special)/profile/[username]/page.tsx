"use client";

import { api } from "@/lib/api/api-client";
import { getErrorMessage } from "@/lib/helpers/error-utils";
import { useUser } from "@/providers/UserProvider";
import { useProfile } from "@/hooks/core/fursonas/useProfile";
import { Button } from "@repo/ui/button";
import { Separator } from "@repo/ui/separator";
import { useFollow } from "@/hooks/social/followers/useFollow";
import { TypographyLead, TypographyXSmall } from "@repo/ui/typography";
import { EllipsisVerticalIcon, MailIcon } from "lucide-react";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useProfileCounts } from "@/hooks/core/views/useProfileCounts";
import { EditProfileModal } from "@/components/dialogs/EditProfileModal";
import { toast } from "@repo/ui/sonner";
import { Skeleton } from "@repo/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { ProfilePostCards } from "@/components/cards/PostCards";
import { type FursonaProfile, FursonaTypes } from "@/types/fursona";
import Banner from "@/components/profile/ProfileBanner";
import ProfileInfo from "@/components/profile/ProfileInfo";
import { DropdownMenu, DropdownMenuTrigger } from "@repo/ui/dropdown-menu";
import ProfileDropdown from "@/components/dropdowns/Profile";

function formatNumbers(count: number): string {
  if (count < 1000) return `${count}`;
  const units = ["K", "M", "B", "T"];
  const tier = Math.floor(Math.log10(count) / 3) - 1;
  const scale = Math.pow(1000, tier + 1);
  const scaled = count / scale;
  return `${scaled.toFixed(scaled % 1 === 0 ? 0 : 1)}${units[tier]}`;
}

const profileNav = [
  { label: "POST", key: "post" },
  { label: "GALLERY", key: "gallery" },
  { label: "ARCHIVE", key: "archive" },
  { label: "LIKE", key: "likes" },
] as const;

type ContentKey = (typeof profileNav)[number]["key"];

export default function ProfilePage() {
  const { currentFursona, refresh, loading: userLoading } = useUser();
  const { username: paramUsername } = useParams<{ username: string }>();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [content, setContent] = useState<ContentKey>("post");
  const [direction, setDirection] = useState(0);

  const { profile, loading: profileLoading } = useProfile(paramUsername);

  const id = profile?.id;
  const isOwnProfile = currentFursona?.id === id;
  const viewedFursona: FursonaProfile | null = profile || currentFursona;

  const { following, follower, refetch, like } = useProfileCounts(id);
  const { isFollowing, toggle: follow, loading: followLoading } = useFollow(id);

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

  const handleNavClick = (key: ContentKey) => {
    const oldIndex = profileNav.findIndex((n) => n.key === content);
    const newIndex = profileNav.findIndex((n) => n.key === key);
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

  if (followLoading) {
    followLabel = "...";
  } else if (isFollowing) {
    followLabel = "Unfollow";
  } else {
    followLabel = "Follow";
  }

  return (
    <div className="flex-1 w-full bg-background">
      {/* Banner */}
      <Banner fursona={viewedFursona} loading={isLoading} />

      {/* Profile header */}
      <section className="px-2 py-4 sm:container sm:mx-auto md:px-4">
        <div className="relative -mt-16 space-y-6 sm:-mt-20 md:-mt-24 z-20">
          <div className="flex justify-between">
            <ProfileInfo fursona={viewedFursona} loading={isLoading} />

            <div className="relative top-4 flex items-center gap-4">
              {isOwnProfile ? (
                <Button onClick={() => setIsEditOpen(true)}>
                  <p>Edit Profile</p>
                </Button>
              ) : (
                <>
                  {isFollowing && (
                    <Button
                      size={"icon"}
                      variant={"secondary"}
                      className="p-2.5"
                    >
                      <MailIcon size={18} />
                    </Button>
                  )}

                  <Button
                    onClick={() => {
                      follow();

                      setTimeout(() => {
                        refetch();
                      }, 350);
                    }}
                    disabled={followLoading}
                  >
                    {followLoading ? "..." : followLabel}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size={"icon"}
                        variant={"outline"}
                        className="p-2.5"
                      >
                        <EllipsisVerticalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <ProfileDropdown />
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="info-skeleton"
                exit={{ opacity: 0 }}
                className="flex-1 w-full pb-0 space-y-6"
              >
                <Skeleton className="h-4 w-72" />
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
            ) : (
              <div className="flex gap-4">
                <div className="flex-1 space-y-4 w-full">
                  {viewedFursona.bio && (
                    <motion.div
                      key="about-content"
                      className="w-full h-fit p-4 bg-surface-low border border-border rounded-base"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.35,
                        ease: "easeOut",
                      }}
                    >
                      <TypographyXSmall className="text-muted-foreground wrap-break-word">
                        {viewedFursona.bio}
                      </TypographyXSmall>
                    </motion.div>
                  )}

                  <motion.div
                    key="counts"
                    className="flex-1 w-full pb-0 space-y-6"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
                  >
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
                            {label}
                          </TypographyXSmall>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/*  Profile content */}
                  <div className="container flex flex-col mx-auto">
                    {/* Nav */}
                    <nav className="space-y-2">
                      <ul className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {profileNav.map(({ label, key }) => (
                          <Button
                            key={label}
                            size="sm"
                            variant="ghost"
                            className={`justify-start rounded-none text-xs sm:text-sm ${content === key ? "bg-surface-container-highest" : ""}`}
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
                        className="grow space-y-4 min-h-[calc(100svh-64px)] py-2 lg:overflow-y-auto scrollbar-hide md:py-4"
                      >
                        {content === "post" && (
                          <ProfilePostCards username={viewedFursona.id} />
                        )}
                        {content === "gallery" && (
                          <div>Gallery coming soon</div>
                        )}
                        {content === "archive" && (
                          <div>Archive coming soon</div>
                        )}
                        {content === "likes" && <div>Likes coming soon</div>}
                      </motion.section>
                    </AnimatePresence>
                  </div>
                </div>

                <aside className="hidden sticky top-20 flex-col w-125 h-[calc(100svh-96px)] gap-5 md:flex">
                  <div className="bg-surface-low animate-pulse w-full h-96 rounded-md shadow-lg" />

                  <div className="bg-surface-low animate-pulse w-full h-full rounded-md shadow-lg" />
                </aside>
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
