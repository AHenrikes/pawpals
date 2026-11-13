import {
  TypographyLead,
  TypographyMuted,
  TypographyXSmall,
} from "@repo/ui/typography";
import { FursonaSearch } from "@/types/fursona";
import { motion, useReducedMotion } from "framer-motion";
import type { NavOption, SearchResult } from "./SearchModal";
import FursonaAvatar from "@/components/avatar-icons/FursonaAvatar";
import Link from "next/link";

const MotionLink = motion.create(Link);

interface SearchResults {
  loading: boolean;
  error: Error | null;
  results: SearchResult[];
  handleClose: () => void;
  onSelect?: (result: SearchResult) => void;
  reduceMotion?: boolean;
}

export function ProfileResultLink({
  profile,
  onSelect,
  index,
  reduceMotion = false,
}: Readonly<{
  profile: FursonaSearch;
  onSelect: () => void;
  index?: number;
  reduceMotion?: boolean;
}>) {
  const prefersReducedMotion = useReducedMotion();
  const disableMotion = reduceMotion || prefersReducedMotion === true;
  return (
    <MotionLink
      href={`/@${profile.username}`}
      onClick={onSelect}
      className="flex w-full items-center gap-4 rounded-sm border border-border/10 bg-secondary-dim/70 p-2 shadow-sm transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:max-w-72"
      initial={
        index === undefined || disableMotion ? false : { opacity: 0, y: 10 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={
        index === undefined || disableMotion
          ? undefined
          : { duration: 0.25, delay: index * 0.06, ease: "easeOut" }
      }
    >
      <div aria-hidden="true">
        <FursonaAvatar
          size="lg"
          name={profile.display_name}
          alt=""
          src={profile.avatar_url}
        />
      </div>
      <div className="min-w-0 flex-1">
        <TypographyLead className="truncate font-medium text-sm md:text-base">
          {profile.display_name}
        </TypographyLead>
        <TypographyXSmall className="text-muted-foreground text-xs">
          @{profile.username}
        </TypographyXSmall>
      </div>
    </MotionLink>
  );
}

export default function SearchResults({
  loading,
  error,
  results,
  handleClose,
  onSelect = () => undefined,
  reduceMotion = false,
}: Readonly<SearchResults>) {
  const prefersReducedMotion = useReducedMotion();
  const disableMotion = reduceMotion || prefersReducedMotion === true;
  return (
    <>
      {/* Results */}
      {!loading && !error && results.length > 0 && (
        <>
          {results.some((r) => r.type === "fursona") && (
            <div className="space-y-3">
              <TypographyMuted className="text-xs md:text-sm">
                Users
              </TypographyMuted>

              {results
                .filter((r) => r.type === "fursona")
                .map((r, index) => {
                  const f = r.data as FursonaSearch;

                  return (
                    <ProfileResultLink
                      key={f.username}
                      profile={f}
                      index={index}
                      reduceMotion={disableMotion}
                      onSelect={() => {
                        onSelect(r);
                        handleClose();
                      }}
                    />
                  );
                })}
            </div>
          )}

          {results.some((r) => r.type === "nav") && (
            <div className="space-y-3">
              <TypographyMuted className="text-xs md:text-sm">
                Navigate
              </TypographyMuted>

              <div className="flex flex-col pt-2 gap-2">
                {results
                  .filter((r) => r.type === "nav")
                  .map((r, index) => {
                    const nav = r.data as NavOption;
                    return (
                      <MotionLink
                        key={nav.label}
                        href={nav.path}
                        onClick={() => {
                          onSelect(r);
                          handleClose();
                        }}
                        className="flex min-h-11 items-center rounded-sm px-2 py-2 transition-colors hover:bg-primary-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        initial={disableMotion ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: disableMotion ? 0 : 0.25,
                          delay: disableMotion ? 0 : index * 0.06,
                          ease: "easeOut",
                        }}
                      >
                        {nav.label}
                      </MotionLink>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
