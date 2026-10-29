import type { FursonaProfile, ProfileAchievement } from "@/types/fursona";
import {
  TypographyLead,
  TypographySmall,
  TypographyXSmall,
} from "@repo/ui/typography";
import {
  AwardIcon,
  CalendarDaysIcon,
  ExternalLinkIcon,
  ShieldCheckIcon,
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

function EmptyProfileSection({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <TypographyXSmall className="block rounded-lg border border-dashed border-border/30 p-4 text-center text-text-muted">
      {children}
    </TypographyXSmall>
  );
}

export default function ProfileAside({
  fursona,
  reputation,
}: Readonly<{ fursona: FursonaProfile; reputation: number }>) {
  const socials = fursona.social_links ?? [];
  let reputationLabel = "New pal";
  if (reputation >= 100) reputationLabel = "Trusted";
  else if (reputation >= 25) reputationLabel = "Established";

  return (
    <aside className="sticky top-20 hidden h-fit w-80 shrink-0 space-y-4 lg:block">
      {/* Reputation */}
      {(
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
      )}

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
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg bg-background/35 px-3 py-2 text-sm capitalize transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <span>{social.platform}</span>
                <ExternalLinkIcon className="size-4" />
              </a>
            ))}
          </div>
        ) : (
          <div className="mt-3">
            <EmptyProfileSection>No social links shared.</EmptyProfileSection>
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
            <EmptyProfileSection>
              No public event activity yet.
            </EmptyProfileSection>
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
            <EmptyProfileSection>
              No public communities yet.
            </EmptyProfileSection>
          </div>
        </section>
      )}

      {fursona.show_events === false && fursona.show_communities === false && (
        <section className="rounded-xl border border-border/20 bg-secondary-dim/35 p-4">
          <span className="flex items-center gap-2">
            <UsersIcon className="size-5 text-primary" />
            <TypographyLead>Suggested Accounts</TypographyLead>
          </span>
          <div className="mt-3">
            <EmptyProfileSection>No suggested users found.</EmptyProfileSection>
          </div>
        </section>
      )}
    </aside>
  );
}
