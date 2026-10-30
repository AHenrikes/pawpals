import { motion } from "framer-motion";
import { SettingsIcon } from "lucide-react";
import { Button } from "@repo/ui/button";
import { usePageTransition } from "@/components/transitions/PageTransitionProvider";
import { mediaImageLoader } from "@/lib/uploads/mediaImageLoader";
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
  const { navigate } = usePageTransition();

  const handleSettingsClick = () => {
    if (globalThis.matchMedia("(max-width: 1024px)").matches) {
      navigate("/settings");
      return;
    }

    onClick();
  };

  return (
    <motion.div
      key="banner-content"
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative flex h-56 w-full items-end justify-center sm:h-72 md:h-96 xl:h-112"
    >
      {fursona.banner_url && (
        <Image
          src={fursona.banner_url}
          loader={fursona.banner_url.startsWith("/api/media/") ? mediaImageLoader : undefined}
          alt={`${fursona.display_name}'s banner`}
          fill
          sizes="100vw"
          quality={85}
          loading="eager"
          fetchPriority="high"
          className="pointer-events-none z-10 object-cover"
        />
      )}

      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background pointer-events-none z-20" />

      {isOwnProfile && (
        <div className="container z-30 grid place-content-end py-4">
          <Button
            size={"icon-sm"}
            variant={"outline"}
            onClick={handleSettingsClick}
            className="p-1 text-text-muted hover:text-text"
          >
            <SettingsIcon />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
