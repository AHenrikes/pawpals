"use client";

import { useUser } from "@/providers/UserProvider";
import { useProfile } from "@/hooks/core/fursonas/useProfile";
import { useProfileFollow } from "@/hooks/social/followers/useProfileFollow";
import { useEffect, useState } from "react";
import { motion, useReducedMotion, type Transition } from "framer-motion";
import {
  notFound,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useProfileCounts } from "@/hooks/core/views/useProfileCounts";
import { Dialog, DialogContent, DialogTitle } from "@repo/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@repo/ui/drawer";
import { usePageTransition } from "@/components/transitions/PageTransitionProvider";
import { useAppPreferences } from "@/providers/AppPreferencesProvider";
import { useTheme } from "next-themes";
import ProfileBanner from "@/components/pages/profile/ProfileBanner";
import ProfileInfo from "@/components/pages/profile/ProfileInfo";
import ProfileAside from "@/components/pages/profile/ProfileAside";
import ProfilePageSkeleton from "@/components/pages/profile/ProfilePageSkeleton";
import ProfileAbout from "@/components/pages/profile/ProfileAbout";
import SettingsPage from "@/components/pages/settings/SettingsPage";
import PageState from "@/components/pages/PageState";
import ProfileContent from "./ProfileContent";
import ReturnHeader from "@/components/navigations/ReturnHeader";
import ProfileConnections, { type ConnectionTab } from "./ProfileConnections";
import useIsMobile from "@/hooks/useIsMobile";

type AuthenticatedProfilePageProp = {
  username: string;
  initialProfile?: import("@/types/fursona").FursonaProfile;
  initialActorId: string | null;
};

export default function ProfilePage({
  username,
  initialProfile,
  initialActorId,
}: Readonly<AuthenticatedProfilePageProp>) {
  const { currentFursona, fursonas } = useUser();
  const { resolvedTheme } = useTheme();
  const { motion: motionPreference } = useAppPreferences();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = motionPreference === "reduced" || prefersReducedMotion;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { exitingPath, destinationPath } = usePageTransition();
  const isExiting =
    exitingPath === pathname && !destinationPath?.startsWith("/@");
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    refetch,
  } = useProfile(username, initialProfile, initialActorId);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [connectionsTab, setConnectionsTab] = useState<ConnectionTab | null>(
    null,
  );

  const id = profile?.id;
  const isOwnProfile = currentFursona?.id === id;
  const canManageConnections =
    isOwnProfile || fursonas.some((fursona) => fursona.id === id);
  const requestedConnections = searchParams.get("connections");

  useEffect(() => {
    if (requestedConnections === "requests" && canManageConnections) {
      setConnectionsTab("requests");
    }
  }, [requestedConnections, canManageConnections]);

  const closeConnections = () => {
    setConnectionsTab(null);
    if (requestedConnections === "requests") {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("connections");
      const queryString = next.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    }
  };

  const {
    isFollowing,
    isPending,
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

  const storedProfileTheme = (profile ?? initialProfile)?.profile_theme;
  const resolvedProfileTheme = storedProfileTheme === "app" ? resolvedTheme : storedProfileTheme;
  const profileTheme = resolvedProfileTheme === "light"
      ? "profile-theme-light"
      : "profile-theme-dark";

  let headerTarget = { opacity: 1, y: 0 };
  let headerTransition: Transition = {
    duration: 1.5,
    ease: "easeInOut",
    delay: 0.45,
  };

  if (reduceMotion) {
    headerTransition = { duration: 0 };
  } else if (isExiting) {
    headerTarget = { opacity: 0, y: -100 };
    headerTransition = { duration: 0.3, ease: "easeIn" };
  }

  if (profileLoading) {
    return (
      <div className={`${profileTheme} min-h-svh bg-background text-text`}>
        <ReturnHeader theme={profileTheme} />

        <main>
          <output className="sr-only">Loading profile…</output>
          <ProfilePageSkeleton />
        </main>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className={`${profileTheme} min-h-svh bg-background text-text`}>
        <ReturnHeader theme={profileTheme} />
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
  const connectionsList = connectionsTab && (
    <ProfileConnections
      key={connectionsTab}
      id={viewedFursona.id}
      initialTab={connectionsTab}
      isOwner={canManageConnections}
      onProfileChange={refetchCounts}
      onNavigate={closeConnections}
      withinDrawer={isMobile}
    />
  );

  return (
    <div className={`${profileTheme} min-h-svh bg-background text-text`}>
      <motion.div
        className="relative z-50"
        initial={reduceMotion ? false : { opacity: 0, y: -100 }}
        animate={headerTarget}
        transition={headerTransition}
      >
        <ReturnHeader theme={profileTheme} />
      </motion.div>

      <main>
        <ProfileBanner
          fursona={viewedFursona}
          isOwnProfile={isOwnProfile}
          onClick={() => setIsEditOpen(true)}
        />

        <div className="container relative space-y-4 z-20 -mt-14 pb-16 sm:-mt-18 md:-mt-24">
          {/* Profile */}
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
            onOpenConnections={setConnectionsTab}
          />

          {/* main */}
          <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start xl:gap-10">
            <div className="w-full min-w-0 flex-1 space-y-4">
              {/* About */}
              <ProfileAbout
                fursona={viewedFursona}
                isOwnProfile={isOwnProfile}
                theme={profileTheme}
              />

              {/* Content */}
              <ProfileContent />
            </div>

            <ProfileAside
              fursona={viewedFursona}
              reputation={reputation}
              postsCount={posts}
              isOwnProfile={isOwnProfile}
            />
          </div>
        </div>
      </main>

      {/* Profile setting modal */}
      {isOwnProfile && viewedFursona && (
        <Dialog
          open={isEditOpen}
          onOpenChange={(open) => !open && setIsEditOpen(false)}
        >
          <DialogContent
            showCloseButton={false}
            className="p-0 flex w-full min-h-10/12 flex-1 flex-col mx-auto bg-background rounded-xl overflow-hidden sm:p-0 md:flex-row md:max-w-[calc(100dvw-12rem)] md:max-h-[calc(100dvh-12rem)] xl:max-w-7xl"
          >
            <DialogTitle className="sr-only">Profile settings</DialogTitle>
            <SettingsPage
              initialSection="profile"
              onClose={() => setIsEditOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Follows */}
      {isMobile ? (
        <Drawer
          open={connectionsTab !== null}
          onOpenChange={(open) => !open && closeConnections()}
        >
          <DrawerContent className="h-[min(85svh,48rem)] bg-background pb-[env(safe-area-inset-bottom)] text-text data-[vaul-drawer-direction=bottom]:max-h-[85svh]">
            <DrawerTitle className="sr-only">Connections</DrawerTitle>
            {connectionsList}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog
          open={connectionsTab !== null}
          onOpenChange={(open) => !open && closeConnections()}
        >
          <DialogContent
            className="flex h-[min(78svh,760px)] max-h-[calc(100svh-2rem)] w-full flex-col gap-0 overflow-hidden rounded-xl p-0 motion-safe:duration-200 motion-reduce:duration-0 sm:max-h-[calc(100svh-2rem)] sm:max-w-2xl sm:p-0"
            overlayClassName="motion-safe:duration-200 motion-reduce:duration-0"
            showCloseButton={false}
          >
            <DialogTitle className="sr-only">Connections</DialogTitle>

            {connectionsList}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
