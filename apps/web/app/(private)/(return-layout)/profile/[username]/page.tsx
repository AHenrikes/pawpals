"use client";

import { api } from "@/lib/api/api-client";
import { getErrorMessage } from "@/lib/helpers/error-utils";
import { useUser } from "@/providers/UserProvider";
import { useProfile } from "@/hooks/core/fursonas/useProfile";
import { useFollow } from "@/hooks/social/followers/useFollow";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useProfileCounts } from "@/hooks/core/views/useProfileCounts";
import { EditProfileModal } from "@/components/pages/profile/EditProfileModal";
import { toast } from "@repo/ui/sonner";
import { AnimatePresence, motion } from "framer-motion";
import type { FursonaTypes } from "@/types/fursona";
import ProfileBanner from "@/components/pages/profile/ProfileBanner";
import ProfileName from "@/components/pages/profile/ProfileName";
import ProfileContent from "@/components/pages/profile/ProfileContent";
import ProfileAside from "@/components/pages/profile/ProfileAside";
import ProfilePageSkeleton from "@/components/pages/profile/ProfilePageSkeleton";
import ProfileAbout from "@/components/pages/profile/ProfileAbout";

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
  } = useFollow(id);
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
      await api.patch<{ fursona: FursonaTypes }>(
        `/api/core/fursonas/${(viewedFursona as FursonaTypes).id}`,
        updates,
      );
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

        <div className="container relative -mt-15 mx-auto md:-mt-25 z-20">
          {/* Profile header */}
          <ProfileName
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

          <section className="flex gap-10">
            <main className="flex-1 space-y-4 w-full">
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
          <EditProfileModal
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
