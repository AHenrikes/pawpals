"use client";

import { api } from "@/lib/api/api-client";
import { getErrorMessage } from "@/lib/helpers/error-utils";
import { useUser } from "@/providers/UserProvider";
import { useProfile } from "@/hooks/core/fursonas/useProfile";
import { useProfileFollow } from "@/hooks/social/followers/useProfileFollow";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useProfileCounts } from "@/hooks/core/views/useProfileCounts";
import { toast } from "@repo/ui/sonner";
import { AnimatePresence, motion } from "framer-motion";
import type { FursonaTypes } from "@/types/fursona";
import ProfileBanner from "@/components/pages/profile/ProfileBanner";
import ProfileInfo from "@/components/pages/profile/ProfileInfo";
import ProfileContent from "@/components/pages/profile/ProfileContent";
import ProfileAside from "@/components/pages/profile/ProfileAside";
import ProfilePageSkeleton from "@/components/pages/profile/ProfilePageSkeleton";
import ProfileAbout from "@/components/pages/profile/ProfileAbout";
import ProfileEditModal from "@/components/pages/profile/ProfileEditModal";

export default function ProfilePage() {
  const { currentFursona, refresh, loading: userLoading } = useUser();
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

  const handleEditSave = async (updates: Partial<FursonaTypes>) => {
    if (!isOwnProfile || !viewedFursona)
      throw new Error("Cannot edit other profiles");
    try {
      const { username, ...profileUpdates } = updates;
      if (username && username !== viewedFursona.username) {
        await api.post(
          `/api/core/fursonas/${(viewedFursona as FursonaTypes).id}/change-username`,
          { new_username: username },
        );
      }
      if (Object.keys(profileUpdates).length > 0) {
        await api.patch<{ fursona: FursonaTypes }>(
          `/api/core/fursonas/${(viewedFursona as FursonaTypes).id}`,
          profileUpdates,
        );
      }
      toast.success("Fursona updated");
      await refresh();
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error(`Update failed: ${message}`);
      throw new Error(message);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <>
        {/* Banner */}
        <ProfileBanner
          fursona={viewedFursona}
          isOwnProfile={isOwnProfile}
          onClick={() => setIsEditOpen(true)}
        />

        <div className="container relative z-20 -mt-14 pb-10 sm:-mt-18 md:-mt-24">
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

            <ProfileAside isFollowing={isFollowing} />
          </section>
        </div>

        {/* Profile setting modal */}
        {isOwnProfile && viewedFursona && (
          <ProfileEditModal
            fursona={viewedFursona as FursonaTypes}
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            onSave={handleEditSave}
          />
        )}
      </>
    </AnimatePresence>
  );
}
