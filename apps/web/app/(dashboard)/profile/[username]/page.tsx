"use client";

import { api } from "@/lib/api/api-client";
import { getErrorMessage } from "@/lib/helpers/error-utils";
import { useUser } from "@/providers/UserProvider";
import { useProfile } from "@/providers/ProfileProvider";
import { Button } from "@repo/ui/button";
import { Separator } from "@repo/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import {
  TypographyH2,
  TypographyLead,
  TypographySmall,
  TypographyXSmall,
} from "@repo/ui/typography";
import {
  SquarePen,
  ShieldAlert,
  Flag,
  MessageCircle,
  Ellipsis,
} from "lucide-react";
import { Fragment, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSocial from "@/hooks/useSocial";
import type { FursonaTypes, FursonaTypesWithID } from "@/types/fursona";
// import type { AccountTypesWithID } from "@/types/account";
import { EditProfileModal } from "@/components/dialogs/EditProfileModal";
// import { ReportProfileModal } from "@/components/dialogs/ReportProfileModal";
// import { AdminPanelModal } from "@/components/dialogs/AdminPanelModal";
import { toast } from "@repo/ui/sonner";
import { Skeleton } from "@repo/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { FollowButton } from "@/components/buttons/FollowButton";

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

  const suffix = units[tier];
  const scale = Math.pow(1000, tier + 1);

  const scaled = count / scale;

  return `${scaled.toFixed(scaled % 1 === 0 ? 0 : 1)}${suffix}`;
}

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const paramUsername = params.username;

  const {
    followersCount,
    followingCount,
    likesCount,
    isFollowing,
    followLoading,
    toggleFollow,
  } = useSocial(paramUsername);
  const { account, currentFursona, loading: userLoading } = useUser();
  const { getProfile, loading: profileLoading } = useProfile();

  const [isEditOpen, setIsEditOpen] = useState(false);
  // const [isReportOpen, setIsReportOpen] = useState(false);
  // const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [viewedFursona, setViewedFursona] = useState<
    FursonaTypesWithID | FursonaTypes | null
  >(null);
  // const [viewedAccount, setViewedAccount] = useState<AccountTypesWithID | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (currentFursona?.username === paramUsername) {
        // Viewing own profile
        setIsOwnProfile(true);
        setViewedFursona(currentFursona);
        // setViewedAccount(account || null);
      } else {
        // Viewing other profile
        setIsOwnProfile(false);

        const profile = await getProfile(paramUsername);

        if (profile) setViewedFursona(profile);
      }
    };

    if (paramUsername && currentFursona) {
      loadProfile();
    }
  }, [paramUsername, currentFursona, getProfile, account]);

  const isLoading = userLoading || profileLoading || !viewedFursona;

  const handleEditSave = async (updates: Partial<FursonaTypesWithID>) => {
    if (!isOwnProfile || !("id" in viewedFursona!)) {
      throw new Error("Cannot edit other profiles");
    }

    try {
      const data = await api.patch<{ fursona: FursonaTypesWithID }>(
        `/api/core/fursonas/${viewedFursona.id}`,
        updates,
      );
      setViewedFursona(data.fursona);
      toast.success("Fursona updated");
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error(`Update failed: ${message}`);
      throw new Error(message);
    }
  };

  // const handleReport = async (reason: string) => {
  //   try {
  //     await api.post("/api/social/reports", {
  //       reported_fursona_id: viewedFursona?.id,
  //       reason,
  //       report_type: "fursona",
  //     });
  //     setIsReportOpen(false);
  //   } catch (err) {
  //     throw new Error(getErrorMessage(err));
  //   }
  // };

  // const handleSuspend = async (reason: string) => {
  //   try {
  //     await api.post(`/api/admin/fursonas/${viewedFursona?.id}/suspend`, {
  //       reason,
  //     });
  //     setIsAdminOpen(false);
  //   } catch (err) {
  //     throw new Error(getErrorMessage(err));
  //   }
  // };

  // const handleDelete = async (reason: string) => {
  //   try {
  //     await api.post(`/api/admin/fursonas/${viewedFursona?.id}/delete`, {
  //       reason,
  //     });
  //     setIsAdminOpen(false);
  //   } catch (err) {
  //     throw new Error(getErrorMessage(err));
  //   }
  // };

  const profileNav = [
    { href: "#", label: "POST" },
    { href: "#", label: "REPOST" },
    { href: "#", label: "ARCHIVE" },
    { href: "#", label: "LIKE" },
  ];

  return (
    <>
      {/* Banner */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="banner-skeleton"
            exit={{ opacity: 0 }}
            className="relative w-full h-64 sm:h-96 md:h-[500px]"
          >
            <Skeleton className="h-full" />
          </motion.div>
        ) : (
          <motion.div
            key="banner-content"
            className="relative w-full h-64 sm:h-96 md:h-[500px]"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {viewedFursona?.banner_url && (
              <Image
                src={viewedFursona.banner_url}
                alt={`${viewedFursona.display_name}'s banner`}
                quality={100}
                fill
                className="object-cover z-10"
                priority
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black z-20"></div>

            {isOwnProfile && (
              <div className="flex place-content-end p-4">
                <Button
                  size="icon"
                  variant="none"
                  onClick={() => setIsEditOpen(true)}
                  className="z-20"
                >
                  <SquarePen className="h-6 w-6" />
                </Button>
              </div>
            )}

            {!isOwnProfile && (
              <div className="flex gap-2 place-content-end p-4">
                <Button size="icon" variant="none" className="z-20">
                  <MessageCircle className="h-6 w-6" />
                </Button>

                <Button size="icon" variant="none" className="z-20">
                  <Ellipsis className="h-6 w-6" />
                </Button>

                <Button
                  size="icon"
                  variant="none"
                  // onClick={() => setIsReportOpen(true)}
                  className="z-20"
                >
                  <Flag className="h-6 w-6" />
                </Button>

                {account?.role === "admin" && (
                  <Button
                    size="icon"
                    variant="outline"
                    // onClick={() => setIsAdminOpen(true)}
                    className="z-20"
                  >
                    <ShieldAlert className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile header section */}
      <section className="px-2 py-4 mb-4 sm:container sm:mx-auto md:px-4">
        <div className="relative -mt-16 space-y-6 sm:-mt-20 md:-mt-24 z-20">
          {/* Avatar */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="avatar-skeleton"
                exit={{ opacity: 0 }}
                className="flex items-center gap-4"
              >
                <Skeleton className="animate-none h-32 w-32 rounded-full sm:h-36 sm:w-36 md:h-44 md:w-44 lg:h-48 lg:w-48 border-4 border-background shadow-lg flex-shrink-0" />

                <div className="min-w-0 mb-4 space-y-2">
                  <Skeleton className="h-9 w-52 animate-none border-2 border-background " />
                  <Skeleton className="h-4 w-40 animate-none border-2 border-background " />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="avatar-content"
                className="flex items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
              >
                <Avatar
                  size="lg"
                  className="h-32 w-32 sm:h-36 sm:w-36 md:h-44 md:w-44 lg:h-48 lg:w-48 border-4 border-background shadow-lg flex-shrink-0"
                >
                  <AvatarImage
                    src={viewedFursona?.avatar_url || ""}
                    alt={viewedFursona?.display_name}
                  />
                  <AvatarFallback>
                    {getInitials(viewedFursona?.display_name || "Profile")}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 mb-4">
                  <TypographyH2 className="text-xl sm:text-2xl truncate">
                    {viewedFursona?.display_name}
                  </TypographyH2>

                  <TypographySmall className="text-muted-foreground">
                    @{viewedFursona?.username}
                  </TypographySmall>
                </div>

                <FollowButton
                  isOwnProfile={isOwnProfile}
                  isFollowing={isFollowing}
                  loading={followLoading}
                  onToggle={toggleFollow}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* Profile info */}
            {isLoading ? (
              <motion.div
                key="info-skeleton"
                exit={{ opacity: 0 }}
                className="flex-1 w-full pb-0 space-y-6"
              >
                <Skeleton className="h-4 w-72" />

                <div className="flex gap-3 sm:gap-6 justify-start">
                  <div className="flex flex-col items-center w-16 gap-2">
                    <Skeleton className="h-9 w-8 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>

                  <div className="flex flex-col items-center w-16 gap-2">
                    <Skeleton className="h-9 w-8 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>

                  <div className="flex flex-col items-center w-16 gap-2">
                    <Skeleton className="h-9 w-8 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
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
                <TypographyXSmall className="text-muted-foreground">
                  {viewedFursona?.bio || "Empty!"}
                </TypographyXSmall>

                <div className="flex gap-3 sm:gap-6 justify-start">
                  <div className="text-center">
                    <TypographyLead className="font-bold text-lg sm:text-xl">
                      {formatNumbers(followersCount)}
                    </TypographyLead>

                    <TypographyXSmall className="text-muted-foreground text-xs">
                      Followers
                    </TypographyXSmall>
                  </div>

                  <div className="text-center">
                    <TypographyLead className="font-bold text-lg sm:text-xl">
                      {formatNumbers(followingCount)}
                    </TypographyLead>

                    <TypographyXSmall className="text-muted-foreground text-xs">
                      Following
                    </TypographyXSmall>
                  </div>

                  <div className="text-center">
                    <TypographyLead className="font-bold text-lg sm:text-xl">
                      {formatNumbers(likesCount)}
                    </TypographyLead>

                    <TypographyXSmall className="text-muted-foreground text-xs">
                      Likes
                    </TypographyXSmall>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="sm:container sm:mx-auto">
        <div className="flex">
          <main className="flex-1">
            <header>
              <nav className="space-y-1 sm:space-y-2">
                <ul className="flex flex-wrap gap-2 sm:gap-0">
                  {profileNav.map(({ href, label }) => {
                    return (
                      <Fragment key={label}>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-xs sm:text-sm"
                        >
                          <Link href={href}>{label}</Link>
                        </Button>
                      </Fragment>
                    );
                  })}
                </ul>

                <Separator className="h-[.5px]" />
              </nav>
            </header>
          </main>
        </div>
      </section>

      {/* Modals */}
      {viewedFursona && isOwnProfile && "id" in viewedFursona && (
        <EditProfileModal
          fursona={viewedFursona}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={handleEditSave}
        />
      )}

      {/* {viewedFursona && !isOwnProfile && (
        <>
          <ReportProfileModal
            fursona={viewedFursona}
            isOpen={isReportOpen}
            onClose={() => setIsReportOpen(false)}
            onSubmit={handleReport}
          />

          {account?.role === "admin" && (
            <AdminPanelModal
              fursona={viewedFursona}
              account={viewedAccount}
              isOpen={isAdminOpen}
              onClose={() => setIsAdminOpen(false)}
              onSuspend={handleSuspend}
              onDelete={handleDelete}
            />
          )}
        </>
      )} */}
    </>
  );
}
