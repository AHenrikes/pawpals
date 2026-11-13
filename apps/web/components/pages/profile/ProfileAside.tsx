"use client";

import type { FursonaProfile } from "@/types/fursona";
import { TypographyLead, TypographyXSmall } from "@repo/ui/typography";
import {
  CalendarDaysIcon,
  ExternalLinkIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { safeSocialLinks } from "@/lib/validation/socialLinks";
import { EmptyState } from "./ProfileAboutModal";
import { useState } from "react";
import { cn } from "@repo/ui/lib/utils";
import ProfileSetupCard from "@/components/cards/ProfileSetupCard";

export default function ProfileAside({
  fursona,
  reputation,
  postsCount,
  isOwnProfile,
}: Readonly<{
  fursona: FursonaProfile;
  reputation: number;
  postsCount: number;
  isOwnProfile: boolean;
}>) {
  const [showSetupCard, setShowSetupCard] = useState(false);
  const socials = safeSocialLinks(fursona.social_links);
  let reputationLabel = "New pal";
  if (reputation >= 100) reputationLabel = "Trusted";
  else if (reputation >= 25) reputationLabel = "Established";

  return (
    <aside
      className={cn(
        "order-first w-full shrink-0 space-y-4 lg:order-last lg:sticky lg:top-20 lg:h-fit lg:w-80",
        !showSetupCard && "hidden lg:block",
      )}
    >
      {isOwnProfile && (
        <ProfileSetupCard
          fursona={fursona}
          postsCount={postsCount}
          onVisibilityChange={setShowSetupCard}
        />
      )}

      <div className="hidden space-y-4 lg:block">
        {/* Reputation */}
        {
          <section className="rounded-xl border border-border/20 bg-secondary-dim/50 p-4">
            <span className="flex items-center gap-2">
              <ShieldCheckIcon className="size-5 text-primary" />
              <TypographyLead>Reputation</TypographyLead>
            </span>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold">{reputation}</p>
                <TypographyXSmall className="text-text-muted">
                  Reputation points
                </TypographyXSmall>
              </div>
              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
                {reputationLabel}
              </span>
            </div>
          </section>
        }

        {/* socials */}
        <section className="rounded-xl border border-border/20 bg-secondary-dim/35 p-4">
          <TypographyLead>Socials</TypographyLead>

          {socials.length > 0 ? (
            <div className="mt-3 grid gap-2">
              {socials.map((social) => (
                <a
                  key={`${social.platform}-${social.url}`}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg bg-background/35 px-3 py-2 text-sm capitalize transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <span>{social.platform}</span>
                  <ExternalLinkIcon className="size-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          ) : (
            <div className="mt-3">
              <EmptyState>No social media links yet.</EmptyState>
            </div>
          )}
        </section>

        {/* Joined events */}
        {fursona.show_events !== false && (
          <section className="rounded-xl border border-border/20 bg-secondary-dim/35 p-4">
            <span className="flex items-center gap-2">
              <CalendarDaysIcon className="size-5 text-primary" />
              <TypographyLead>Events joined</TypographyLead>
            </span>

            <div className="mt-3">
              <EmptyState>No event joined yet.</EmptyState>
            </div>
          </section>
        )}

        {/* Joined communities */}
        {fursona.show_communities !== false && (
          <section className="rounded-xl border border-border/20 bg-secondary-dim/35 p-4">
            <span className="flex items-center gap-2">
              <UsersIcon className="size-5 text-primary" />
              <TypographyLead>Communities</TypographyLead>
            </span>

            <div className="mt-3">
              <EmptyState>No communities joined yet.</EmptyState>
            </div>
          </section>
        )}

        {fursona.show_events === false &&
          fursona.show_communities === false && (
            <section className="rounded-xl border border-border/20 bg-secondary-dim/35 p-4">
              <span className="flex items-center gap-2">
                <UsersIcon className="size-5 text-primary" />
                <TypographyLead>Suggested Accounts</TypographyLead>
              </span>
              <div className="mt-3">
                <EmptyState>No suggested users found.</EmptyState>
              </div>
            </section>
          )}
      </div>
    </aside>
  );
}
