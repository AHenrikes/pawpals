import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "@repo/ui/skeleton";
import { type FursonaProfile } from "@/types/fursona";
import Image from "next/image";
import ProfileHeader from "./ProfileHeader";

interface ProfileBannerProps {
  fursona: FursonaProfile;
  loading: boolean;
}

export default function Banner({
  fursona,
  loading,
}: Readonly<ProfileBannerProps>) {
  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.section
          key="banner-skeleton"
          exit={{ opacity: 0 }}
          className="relative w-full h-64 md:h-[55dvh]"
        >
          <Skeleton className="h-full" />
        </motion.section>
      ) : (
        <motion.section
          key="banner-content"
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full h-64 md:h-[55dvh]"
        >
          <ProfileHeader />

          {fursona.banner_url && (
            <Image
              src={fursona.banner_url}
              alt={`${fursona.display_name}'s banner`}
              fill
              quality={85}
              loading="lazy"
              className="object-cover pointer-events-none z-10"
            />
          )}

          <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background pointer-events-none z-20" />
        </motion.section>
      )}
    </AnimatePresence>
  );
}
