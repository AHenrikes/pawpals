"use client";

import { Button } from "@repo/ui/button";
import { TypographyXSmall } from "@repo/ui/typography";
import { motion } from "framer-motion";
import { ListCollapseIcon } from "lucide-react";
import { useState } from "react";
import { type FursonaProfile } from "@/types/fursona";
import ProfileAboutModal from "./ProfileAboutModal";

type ProfileAboutProps = {
  readonly fursona: FursonaProfile;
  readonly isOwnProfile: boolean;
  readonly theme?: string;
};

export default function ProfileAbout({
  fursona,
  isOwnProfile,
  theme,
}: ProfileAboutProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.div
        key="info-content"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: 0.35,
          ease: "easeOut",
        }}
        className="space-y-3 px-2 md:px-0"
      >
        {isOwnProfile && (
          <TypographyXSmall className="line-clamp-3 text-text-muted wrap-break-word lg:line-clamp-none">
            {fursona.bio ||
              "Your story starts here. Tell a little about yourself."}
          </TypographyXSmall>
        )}

        <div className="flex justify-between">
          <span className="flex flex-wrap gap-x-2 text-text/60">
            <TypographyXSmall>Member since :</TypographyXSmall>
            <TypographyXSmall>
              {new Date(fursona.created_at).toLocaleDateString()}
            </TypographyXSmall>
          </span>

          <Button
            variant={"none"}
            onClick={() => setIsOpen(true)}
            aria-label="Expand about section"
            className="h-auto text-muted p-0 lg:hidden"
          >
            <ListCollapseIcon />
          </Button>
        </div>
      </motion.div>

      {/* Profile about modal */}
      <ProfileAboutModal
        fursona={fursona}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        theme={theme}
      />
    </>
  );
}
