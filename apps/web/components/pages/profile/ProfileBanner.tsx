import { motion } from "framer-motion";
import { SettingsIcon } from "lucide-react";
import { Button } from "@repo/ui/button";
import { type FursonaProfile } from "@/types/fursona";
import Image from "next/image";

interface ProfileBannerProps {
  fursona: FursonaProfile;
  isOwnProfile: boolean;
  onClick: () => void;
}

export default function ProfileBanner({
  fursona,
  isOwnProfile,
  onClick,
}: Readonly<ProfileBannerProps>) {
  return (
    <motion.div
      key="banner-content"
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative flex justify-center items-end w-full h-64 md:h-[55dvh]"
    >
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

      {isOwnProfile && (
        <div className="container grid place-content-end px-2.5 py-4 z-50">
          <Button
            size={"icon-sm"}
            variant={"outline"}
            onClick={onClick}
            className="p-1 text-text-muted hover:text-text"
          >
            <SettingsIcon />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
