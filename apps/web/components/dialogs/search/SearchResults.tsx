import {
  TypographyLead,
  TypographyMuted,
  TypographyXSmall,
} from "@repo/ui/typography";
import { FursonaSearch } from "@/types/fursona";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { getInitials } from "@/utils/getInitials";
import type { NavOption, SearchResult } from "./SearchDialog";
import Link from "next/link";

interface SearchResults {
  loading: boolean;
  error: Error | null;
  results: SearchResult[];
  handleClose: () => void;
}

export default function SearchResults({
  loading,
  error,
  results,
  handleClose,
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
                .map((r) => {
                  const f = r.data as FursonaSearch;

                  return (
                    <Link
                      key={f.username}
                      href={`/@${f.username}`}
                      onClick={handleClose}
                      className="flex items-center w-64 gap-2 bg-surface border border-muted shadow-lg hover:bg-surface-highest"
                    >
                      <Avatar size="lg">
                        <AvatarImage
                          src={`${f?.avatar_url}`}
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
                    </Link>
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
                  .map((r) => {
                    const nav = r.data as NavOption;
                    return (
                      <Link
                        key={nav.label}
                        href={nav.path}
                        onClick={handleClose}
                        className="flex px-2 py-2 rounded transition-colors hover:bg-primary-dim"
                      >
                        {nav.label}
                      </Link>
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
