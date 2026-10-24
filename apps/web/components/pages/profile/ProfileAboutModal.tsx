"use client";

import { Drawer, DrawerContent } from "@repo/ui/drawer";
import { Separator } from "@repo/ui/separator";
import {
  TypographyLead,
  TypographyP,
  TypographySmall,
} from "@repo/ui/typography";
import type { FursonaProfile, ProfileAchievement } from "@/types/fursona";
import {
  AwardIcon,
  CalendarDaysIcon,
  ExternalLinkIcon,
  UsersIcon,
} from "lucide-react";

const achievementDetails: Record<
  ProfileAchievement,
  { name: string; symbol: string }
> = {
  early_paw: { name: "Early Paw", symbol: "🐾" },
  community_builder: { name: "Community Builder", symbol: "🏕️" },
  event_explorer: { name: "Event Explorer", symbol: "🧭" },
  trusted_pal: { name: "Trusted Pal", symbol: "✨" },
};

function EmptyState({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="rounded-lg border border-dashed border-border/30 p-4 text-center text-sm text-text-muted">
      {children}
    </p>
  );
}

export default function ProfileAboutModal({
  fursona,
  isOpen,
  onClose,
}: Readonly<{
  fursona: FursonaProfile;
  isOpen: boolean;
  onClose: () => void;
}>) {
  const socials = fursona.social_links ?? [];
  const achievements = fursona.featured_achievements ?? [];

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[min(78dvh,48rem)] w-full bg-background px-4 sm:px-6">
        <div className="mx-auto w-full max-w-3xl space-y-5 overflow-y-auto pb-8 scrollbar-hide">
          <section className="space-y-3">
            <TypographyLead>About</TypographyLead>
            <TypographyP className="text-text-muted wrap-break-word">
              {fursona.bio || "This fursona has not added a bio yet."}
            </TypographyP>
            <TypographySmall className="text-text-muted">
              Member since {new Date(fursona.created_at).toLocaleDateString()}
            </TypographySmall>
          </section>

          <Separator className="h-px" />

          <section className="space-y-3">
            <TypographyLead>Socials</TypographyLead>
            {socials.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {socials.map((social) => (
                  <a
                    key={`${social.platform}-${social.url}`}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg bg-secondary-dim p-3 text-sm capitalize hover:text-primary"
                  >
                    <span>{social.platform}</span>
                    <ExternalLinkIcon className="size-4" />
                  </a>
                ))}
              </div>
            ) : (
              <EmptyState>No social links shared.</EmptyState>
            )}
          </section>

          {achievements.length > 0 && (
            <>
              <Separator className="h-px" />
              <section className="space-y-3">
                <span className="flex items-center gap-2">
                  <AwardIcon className="size-5 text-primary" />
                  <TypographyLead>Achievements</TypographyLead>
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {achievements.map((id) => {
                    const achievement = achievementDetails[id];
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-3 rounded-lg bg-secondary-dim p-3"
                      >
                        <span className="text-2xl">{achievement.symbol}</span>
                        <TypographySmall>{achievement.name}</TypographySmall>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {fursona.show_events !== false && (
            <>
              <Separator className="h-px" />
              <section className="space-y-3">
                <span className="flex items-center gap-2">
                  <CalendarDaysIcon className="size-5 text-primary" />
                  <TypographyLead>Events joined</TypographyLead>
                </span>
                <EmptyState>No public event activity yet.</EmptyState>
              </section>
            </>
          )}

          {fursona.show_communities !== false && (
            <>
              <Separator className="h-px" />
              <section className="space-y-3">
                <span className="flex items-center gap-2">
                  <UsersIcon className="size-5 text-primary" />
                  <TypographyLead>Communities</TypographyLead>
                </span>
                <EmptyState>No public communities yet.</EmptyState>
              </section>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
