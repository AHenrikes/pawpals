"use client";

import { useUser } from "@/providers/UserProvider";
import { useProfile } from "@/hooks/core/fursonas/useProfile";
import { useProfileFollow } from "@/hooks/social/followers/useProfileFollow";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useProfileCounts } from "@/hooks/core/views/useProfileCounts";
import { AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@repo/ui/dialog";
import ProfileBanner from "@/components/pages/profile/ProfileBanner";
import ProfileInfo from "@/components/pages/profile/ProfileInfo";
import ProfileContent from "@/components/pages/profile/ProfileContent";
import ProfileAside from "@/components/pages/profile/ProfileAside";
import ProfilePageSkeleton from "@/components/pages/profile/ProfilePageSkeleton";
import ProfileAbout from "@/components/pages/profile/ProfileAbout";
import SettingsPage from "@/components/pages/settings/SettingsPage";

export default function ProfilePage() {
  const { currentFursona, loading: userLoading } = useUser();
  const { username: paramUsername } = useParams<{ username: string }>();
  const { profile, loading: profileLoading } = useProfile(paramUsername);

  const [isEditOpen, setIsEditOpen] = useState(false);

  const id = profile?.id;
  const isOwnProfile = currentFursona?.id === id;
  const viewedFursona = profile || currentFursona;

  const {
    isFollowing,
    isMutual,
    toggle,
    loading: followLoading,
  } = useProfileFollow(id);

  const {
    posts,
    following,
    followers,
    likes,
    reputation,
    refetch: refetchCounts,
  } = useProfileCounts(id);

  const handleFollowToggle = async () => {
    await toggle();
    await refetchCounts();
  };

  const isLoading = isOwnProfile
    ? userLoading || !currentFursona
    : profileLoading;

  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  if (!viewedFursona) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <>
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
          <Dialog open={isEditOpen} onOpenChange={(open) => !open && setIsEditOpen(false)}>
            <DialogContent
              showCloseButton={false}
              className="p-0 flex w-full flex-1 flex-col mx-auto bg-background rounded-xl overflow-hidden sm:p-0 md:flex-row md:max-w-[calc(100dvw-12rem)] md:max-h-[calc(100dvh-12rem)] xl:max-w-7xl"
            >
              <DialogTitle className="sr-only">Profile settings</DialogTitle>
              <SettingsPage initialSection="profile" onClose={() => setIsEditOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </>
    </AnimatePresence>
  );
}
