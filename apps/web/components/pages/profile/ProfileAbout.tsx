"use client";

import { Button } from "@repo/ui/button";
import { TypographySmall, TypographyXSmall } from "@repo/ui/typography";
import { motion } from "framer-motion";
import { DotIcon, MaximizeIcon } from "lucide-react";
import { type FursonaProfile } from "@/types/fursona";
import { useState } from "react";
import { AboutProfileModal } from "./AboutProfileModal";

export default function ProfileAbout({
  fursona,
}: Readonly<{ fursona: FursonaProfile }>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {fursona.bio && (
        <motion.div
          key="info-content"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.35,
            ease: "easeOut",
          }}
          className="space-y-4 px-4 py-2 mx-1 gradientBG rounded-xs md:rounded-sm"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-primary rounded-full shadow-lg shadow-red-500/70 md:h-3 md:w-3" />
                <TypographySmall className="text-text/80">
                  About
                </TypographySmall>
              </div>

              <DotIcon className="text-text/60" />

              <span className="flex gap-2 text-text/60">
                <TypographyXSmall>Member since :</TypographyXSmall>
                <TypographyXSmall>
                  {new Date(fursona.created_at).toLocaleDateString()}
                </TypographyXSmall>
              </span>
            </div>

            <Button
              size={"icon"}
              variant={"none"}
              onClick={() => setIsOpen(true)}
              aria-label="Expand about section"
              className="text-muted lg:hidden"
            >
              <MaximizeIcon />
            </Button>
          </div>

          <TypographyXSmall className="line-clamp-3 text-text-muted wrap-break-word lg:line-clamp-none">
            {fursona.bio}
          </TypographyXSmall>
        </motion.div>
      )}

      {/* Profile about modal */}
      <AboutProfileModal
        fursona={fursona}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
