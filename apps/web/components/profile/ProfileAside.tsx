import { FursonaProfile } from "@/types/fursona";
import { TypographyLead, TypographyXSmall } from "@repo/ui/typography";

interface ProfileProp {
  fursona: FursonaProfile;
  isMutual: boolean;
  mutualSince: string | null;
  isOwn: boolean;
  isFollowing: boolean;
}

export default function ProfileAside({ 
  fursona,
  isMutual,
  mutualSince,
  isOwn,
  isFollowing
} : Readonly<ProfileProp>) {

  return (
    <aside className="sticky top-6 hidden h-full max-h-[clac(100dvh-64px)] max-w-[320px] space-y-6 lg:block xl:max-w-full">
      <section className="flex flex-col gap-16 xl:gap-6">
        <div className="relative flex flex-col h-10 gap-6 xl:flex-row">
          <span className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary shadow-lg shadow-red-500/70" />
            <TypographyLead>Reputation</TypographyLead>
          </span>

          <div className="relative bottom-2.5 flex items-center gap-6">
            <span className="flex flex-col items-center gap-2">
              <TypographyXSmall className="text-text-muted">New User</TypographyXSmall>
              <div className="h-3 w-20 bg-accent rounded-base" />
            </span>

            <span className="flex flex-col items-center gap-2">
              <TypographyXSmall className="text-text">Verified</TypographyXSmall>
              <div className="h-3 w-20 bg-primary-dim rounded-base" />
            </span>

            <span className="flex flex-col items-center gap-2">
              <TypographyXSmall className="text-text-muted">Trusted</TypographyXSmall>
              <div className="h-3 w-20 bg-secondary-dim rounded-base" />
            </span>
          </div>
        </div>

        {/* <div className="flex h-10 items-center gap-10">
          <span className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary shadow-lg shadow-red-500/70" />
            <TypographyLead>Member since :</TypographyLead>
          </span>

          <TypographySmall className="text-text-muted">{new Date(fursona.created_at).toLocaleDateString()}</TypographySmall>
        </div> */}
        
        {/* {!isOwn && isMutual && isFollowing && mutualSince && (
          <div className="flex h-10 items-center gap-10">
            <span className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary shadow-lg shadow-red-500/70" />
              <TypographyLead>Mutual since :</TypographyLead>
            </span>

            <TypographySmall className="text-text-muted">{new Date(mutualSince).toLocaleDateString()}</TypographySmall>
          </div>
        )} */}

        <div className="space-y-6 p-4 w-full border border-muted/30">
          <TypographyLead>Achievements</TypographyLead>
          
          <div className="flex max-w-md overflow-x-scroll gap-6 scrollbar-hide">
            <div className="h-35 w-30 shrink-0 bg-secondary border border-primary/80 rounded-sm" />
            <div className="h-35 w-30 shrink-0 bg-secondary border border-primary/80 rounded-sm" />
            <div className="h-35 w-30 shrink-0 bg-secondary border border-primary/80 rounded-sm" />
            <div className="h-35 w-30 shrink-0 bg-secondary border border-primary/80 rounded-sm" />
          </div>
        </div>
      </section>

      <section className="h-full space-y-6">
        {/* <div className="space-y-6 p-4 w-full bg-secondary-dim border border-muted/30">
          <TypographyLead>Whishlist</TypographyLead>

          <div className="space-y-6 max-h-56 overflow-auto scrollbar-hide">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={`user-col1-${i}`}
                className="flex items-center gap-2 animate-pulse"
              >
                <div className="h-12 w-12 md:h-14 md:w-14 bg-muted rounded-full shrink-0" />
                <div className="h-4 w-full md:h-10 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div> */}

        { !isFollowing && (
          <div className="space-y-6 p-4 w-full bg-secondary-dim border border-muted/30">
            <TypographyLead>Upcoming events</TypographyLead>

            <div className="space-y-6 max-h-56 overflow-y-scroll scrollbar-hide">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={`user-col1-${i}`}
                  className="flex items-center gap-2 animate-pulse"
                >
                  <div className="h-12 w-12 md:h-14 md:w-14 bg-muted rounded-full shrink-0" />
                  <div className="h-4 w-full md:h-10 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6 p-4 w-full bg-secondary-dim border border-muted/30">
          <TypographyLead>Communities</TypographyLead>

          <div className="space-y-6 max-h-56 overflow-y-scroll scrollbar-hide">
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
      </section>
    </aside>
  )
}
