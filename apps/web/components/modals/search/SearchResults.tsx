import {
  TypographyLead,
  TypographyMuted,
  TypographyXSmall,
} from "@repo/ui/typography";
import { FursonaSearch } from "@/types/fursona";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { avatarImageSrc } from "@/lib/uploads/avatarImageSrc";
import { getInitials } from "@/lib/helpers/getInitials";
import type { NavOption, SearchResult } from "./SearchModal";
import Link from "next/link";
import { motion } from "framer-motion";

const MotionLink = motion.create(Link);

interface SearchResults {
  loading: boolean;
  error: Error | null;
  results: SearchResult[];
  handleClose: () => void;
  onSelect?: () => void;
}

export default function SearchResults({
  loading,
  error,
  results,
  handleClose,
  onSelect = () => undefined,
}: Readonly<SearchResults>) {
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
                    <MotionLink
                      key={f.username}
                      href={`/@${f.username}`}
                      onClick={() => {
                        onSelect();
                        handleClose();
                      }}
                      className="flex w-full items-center gap-4 rounded-sm border border-border/10 bg-secondary-dim/70 p-2 shadow-sm transition-colors hover:bg-secondary sm:max-w-72"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.25,
                        delay: index * 0.06,
                        ease: "easeOut",
                      }}
                    >
                      <Avatar size="lg">
                        <AvatarImage
                          src={avatarImageSrc(f?.avatar_url, 96)}
                          alt={f.display_name}
                        />

                        <AvatarFallback>
                          {getInitials(f.display_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <TypographyLead className="font-medium text-sm md:text-base">
                          {f.display_name}
                        </TypographyLead>

                        <TypographyXSmall className="text-muted-foreground text-xs">
                          @{f.username}
                        </TypographyXSmall>
                      </div>
                    </MotionLink>
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
                          onSelect();
                          handleClose();
                        }}
                        className="flex px-2 py-2 rounded transition-colors hover:bg-primary-dim"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.25,
                          delay: index * 0.06,
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
