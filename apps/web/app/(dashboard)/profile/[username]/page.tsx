"use client";

import { api } from "@/lib/api/api-client";
import { getErrorMessage } from "@/lib/helpers/error-utils";
import { useUser } from "@/providers/UserProvider";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@repo/ui/button";
import { Separator } from "@repo/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import {
  TypographyH2,
  TypographyLead,
  TypographySmall,
  TypographyXSmall,
} from "@repo/ui/typography";
import { SquarePen, ShieldAlert, Flag, MessageCircle, Ellipsis } from "lucide-react";
import { Fragment, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useProfileCounts } from "@/hooks/useProfileCounts";
import type { FursonaTypes, FursonaTypesWithId } from "@/types/fursona";
import { EditProfileModal } from "@/components/dialogs/EditProfileModal";
import { toast } from "@repo/ui/sonner";
import { Skeleton } from "@repo/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

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
  { href: "#", label: "POST" },
  { href: "#", label: "REPOST" },
  { href: "#", label: "ARCHIVE" },
  { href: "#", label: "LIKE" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { username: paramUsername } = useParams<{ username: string }>();

  const { account, currentFursona, loading: userLoading } = useUser();
  const { following, follower, like, } = useProfileCounts(paramUsername);

  const isOwnProfile = currentFursona?.username === paramUsername;

  const { profile, loading: profileLoading } = useProfile(
    isOwnProfile ? "" : paramUsername
  );

  const viewedFursona: FursonaTypes | FursonaTypesWithId | null = isOwnProfile
    ? currentFursona
    : profile;

  const isLoading = isOwnProfile ? userLoading || !currentFursona : profileLoading;

  const [isEditOpen, setIsEditOpen] = useState(false);

const handleEditSave = async (updates: Partial<FursonaTypesWithId>) => {
  if (!isOwnProfile || !viewedFursona) throw new Error("Cannot edit other profiles");
  try {
    await api.patch<{ fursona: FursonaTypesWithId }>(
      `/api/profile/me/${(viewedFursona as FursonaTypesWithId).id}`,
      updates,
    );
    toast.success("Fursona updated");
    router.refresh();
  } catch (err) {
    const message = getErrorMessage(err);
    toast.error(`Update failed: ${message}`);
    throw new Error(message);
  }
};

  if (isLoading || !viewedFursona) return null;
  
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

            <div className="flex gap-2 place-content-end p-4">
              {isOwnProfile ? (
                <Button size="icon" variant="none" onClick={() => setIsEditOpen(true)} className="z-20">
                  <SquarePen className="h-6 w-6" />
                </Button>
              ) : (
                <>
                  <Button size="icon" variant="none" className="z-20">
                    <MessageCircle className="h-6 w-6" />
                  </Button>
                  <Button size="icon" variant="none" className="z-20">
                    <Ellipsis className="h-6 w-6" />
                  </Button>
                  <Button size="icon" variant="none" className="z-20">
                    <Flag className="h-6 w-6" />
                  </Button>
                  {account?.account_role === "admin" && (
                    <Button size="icon" variant="outline" className="z-20">
                      <ShieldAlert className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </motion.div>
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
                className="flex items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
              >
                <Avatar size="lg" className="h-32 w-32 sm:h-36 sm:w-36 md:h-44 md:w-44 lg:h-48 lg:w-48 border-4 border-background shadow-lg flex-shrink-0">
                  <AvatarImage src={viewedFursona.avatar_url ?? undefined} alt={viewedFursona.display_name} />
                  <AvatarFallback>{getInitials(viewedFursona.display_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 mb-4">
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
                <TypographyXSmall className="text-muted-foreground">
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
                        {label}
                      </TypographyXSmall>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Nav */}
      <section className="sm:container sm:mx-auto">
        <div className="flex">
          <main className="flex-1">
            <header>
              <nav className="space-y-1 sm:space-y-2">
                <ul className="flex flex-wrap gap-2 sm:gap-0">
                  {profileNav.map(({ href, label }) => (
                    <Fragment key={label}>
                      <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
                        <Link href={href}>{label}</Link>
                      </Button>
                    </Fragment>
                  ))}
                </ul>
                <Separator className="h-[.5px]" />
              </nav>
            </header>
          </main>
        </div>
      </section>

      {/* Modals */}
      {isOwnProfile && viewedFursona && (
        <EditProfileModal
          fursona={viewedFursona as FursonaTypesWithId}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={handleEditSave}
        />
      )}
    </>
  );
}