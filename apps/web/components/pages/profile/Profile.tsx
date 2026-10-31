"use client";

import { useUser } from "@/providers/UserProvider";
import { useProfile } from "@/hooks/core/fursonas/useProfile";
import { useProfileFollow } from "@/hooks/social/followers/useProfileFollow";
import { useState } from "react";
import { motion } from "framer-motion";
import { notFound, usePathname } from "next/navigation";
import { useProfileCounts } from "@/hooks/core/views/useProfileCounts";
import { Dialog, DialogContent, DialogTitle } from "@repo/ui/dialog";
import { usePageTransition } from "@/components/transitions/PageTransitionProvider";
import ProfileBanner from "@/components/pages/profile/ProfileBanner";
import ProfileInfo from "@/components/pages/profile/ProfileInfo";
import ProfileAside from "@/components/pages/profile/ProfileAside";
import ProfilePageSkeleton from "@/components/pages/profile/ProfilePageSkeleton";
import ProfileAbout from "@/components/pages/profile/ProfileAbout";
import SettingsPage from "@/components/pages/settings/SettingsPage";
import PageState from "@/components/pages/PageState";
import ProfileContent from "./ProfileContent";
import ReturnHeader from "@/components/navigations/ReturnHeader";

type AuthenticatedProfilePageProp = {
  username: string;
  initialProfile?: import("@/types/fursona").FursonaProfile;
  initialActorId: string | null;
}

export default function ProfilePage({
  username,
  initialProfile,
  initialActorId,
}: Readonly<AuthenticatedProfilePageProp>) {
  const { currentFursona } = useUser();
  const pathname = usePathname();
  const { exitingPath, destinationPath } = usePageTransition();
  const isExiting = exitingPath === pathname && !destinationPath?.startsWith("/@");
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    refetch,
  } = useProfile(username, initialProfile, initialActorId);

  const [isEditOpen, setIsEditOpen] = useState(false);

  const id = profile?.id;
  const isOwnProfile = currentFursona?.id === id;

  const {
    isFollowing,
    isPending,
    isMutual,
    toggle,
    loading: followLoading,
  } = useProfileFollow(id);

  const { posts, following, followers, likes, reputation, refetch: refetchCounts } = useProfileCounts(id);

  const handleFollowToggle = async () => {
    await toggle();
    await refetchCounts();
  };

  const profileTheme = (profile ?? initialProfile)?.profile_theme === "light"
    ? "profile-theme-light"
    : "profile-theme-dark";

  if (profileLoading) {
    return (
      <div className={`${profileTheme} min-h-svh bg-background text-text`}>
        <ReturnHeader />
        <ProfilePageSkeleton />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className={`${profileTheme} min-h-svh bg-background text-text`}>
        <ReturnHeader />
        <PageState
          error
          title="Profile unavailable"
          description="We couldn't load this profile right now. Please try again."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!profile) notFound();

  const viewedFursona = profile;
  return (
    <div className={`${profileTheme} min-h-svh bg-background text-text`}>
      <motion.div
        className="relative z-50"
        initial={{ opacity: 0, y: -100 }}
        animate={isExiting ? { opacity: 0, y: -100 } : { opacity: 1, y: 0 }}
        transition={isExiting
          ? { duration: 0.3, ease: "easeIn" }
          : { duration: 1.5, ease: "easeInOut", delay: 0.45 }}
      >
        <ReturnHeader />
      </motion.div>
      {/* Banner */}
      <ProfileBanner
        fursona={viewedFursona}
        isOwnProfile={isOwnProfile}
        onClick={() => setIsEditOpen(true)}
      />

      <div className="container relative z-20 -mt-14 pb-16 sm:-mt-18 md:-mt-24">
        {/* Profile header */}
        <ProfileInfo
          fursona={viewedFursona}

          // CTA buttons
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          isPending={isPending}
          isMutual={isMutual}
          followLoading={followLoading}

          // Counts
          postsCount={posts}
          followersCount={followers}
          followingCount={following}
          likesCount={likes}

          toggle={handleFollowToggle}
        />

        <section className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start xl:gap-10">
          <main className="w-full min-w-0 flex-1 space-y-4">
            {/* About */}
            <ProfileAbout fursona={viewedFursona} />

            {/* Content */}
            <ProfileContent fursona={viewedFursona} />
          </main>

          <ProfileAside fursona={viewedFursona} reputation={reputation} />
        </section>
      </div>

      {/* Profile setting modal */}
      {isOwnProfile && viewedFursona && (
        <Dialog
          open={isEditOpen}
          onOpenChange={(open) => !open && setIsEditOpen(false)}
        >
          <DialogContent
            showCloseButton={false}
            className="p-0 flex w-full flex-1 flex-col mx-auto bg-background rounded-xl overflow-hidden sm:p-0 md:flex-row md:max-w-[calc(100dvw-12rem)] md:max-h-[calc(100dvh-12rem)] xl:max-w-7xl"
          >
            <DialogTitle className="sr-only">Profile settings</DialogTitle>
            <SettingsPage
              initialSection="profile"
              onClose={() => setIsEditOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
