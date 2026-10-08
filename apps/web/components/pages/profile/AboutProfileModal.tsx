"use client";

import { Drawer, DrawerContent } from "@repo/ui/drawer";
import { type FursonaProfile } from "@/types/fursona";
import {
  TypographyLead,
  TypographyP,
  TypographySmall,
} from "@repo/ui/typography";
import { Separator } from "@repo/ui/separator";

interface AboutProfileModalProps {
  fursona: FursonaProfile;
  isOpen: boolean;
  onClose: () => void;
}

export function AboutProfileModal({
  fursona,
  isOpen,
  onClose,
}: Readonly<AboutProfileModalProps>) {
  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DrawerContent className="h-[min(75dvh,44rem)] w-full bg-background px-4 sm:px-6">
        <div className="mx-auto w-full max-w-3xl space-y-4 overflow-y-auto pb-6 scrollbar-hide">
          {fursona.bio ? (
            <>
              <div className="space-y-4">
                <TypographyLead>Bio</TypographyLead>

                <div className="flex flex-col gap-2">
                  <TypographyP className="text-text-muted wrap-break-word">
                    {fursona.bio}
                  </TypographyP>

                  <div className="flex items-center gap-2">
                    <TypographySmall className="text-text-muted wrap-break-word">
                      Member since :
                    </TypographySmall>

                    <TypographyP className="text-text-muted wrap-break-word">
                      {new Date(fursona.created_at).toLocaleDateString()}
                    </TypographyP>
                  </div>
                </div>
              </div>

              <Separator className="h-0.5" />
            </>
          ) : null}

          <div className="space-y-4">
            <TypographyLead>Socials</TypographyLead>

            <div className="flex overflow-x-scroll gap-6 scrollbar-hide">
              <div className="h-35 w-30 shrink-0 bg-secondary border border-primary/80 rounded-sm" />
              <div className="h-35 w-30 shrink-0 bg-secondary border border-primary/80 rounded-sm" />
              <div className="h-35 w-30 shrink-0 bg-secondary border border-primary/80 rounded-sm" />
              <div className="h-35 w-30 shrink-0 bg-secondary border border-primary/80 rounded-sm" />
            </div>
          </div>

          <Separator className="h-0.5" />

          <div className="space-y-4">
            <TypographyLead>Whishlist</TypographyLead>

            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={`row-${i}`}
                  className="flex items-center gap-2 animate-pulse"
                >
                  <div className="h-12 w-12 md:h-14 md:w-14 bg-muted rounded-full shrink-0" />
                  <div className="h-8 w-full md:h-10 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>

          <Separator className="h-0.5" />

          <div className="space-y-4">
            <TypographyLead>Upcoming events</TypographyLead>

            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={`user-col1-${i}`}
                  className="flex items-center gap-2 animate-pulse"
                >
                  <div className="h-12 w-12 md:h-14 md:w-14 bg-muted rounded-full shrink-0" />
                  <div className="h-8 w-full md:h-10 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>

          <Separator className="h-0.5" />

          <div className="space-y-4">
            <TypographyLead>Communities</TypographyLead>

            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={`user-col1-${i}`}
                  className="flex items-center gap-2 animate-pulse"
                >
                  <div className="h-12 w-12 md:h-14 md:w-14 bg-muted rounded-full shrink-0" />

                  <div className="space-y-2 flex-1">
                    <div className="h-6 w-full md:h-6 bg-muted rounded" />
                    <div className="h-5 w-2/3 md:h-5 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
