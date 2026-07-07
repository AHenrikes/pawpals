import { TypographyLead, TypographyXSmall } from "@repo/ui/typography";
import { FursonaSearch } from "@/types/fursona";
import { type NavOption, SearchResult } from "./SearchDialog";
import Link from "next/link";

interface SearchResults {
  loading: boolean;
  error: Error | null;
  results: SearchResult[];
}

export default function SearchResults({loading, error, results}: Readonly<SearchResults>) {
  return (
    <>
      {/* Results */}
      {!loading && !error && results.length > 0 && (
        <div className="space-y-3 md:space-y-4">
          {results.some((r) => r.type === "fursona") && (
            <div>
              <TypographyXSmall className="px-2 py-2 font-semibold text-muted-foreground text-xs md:text-sm">
                Users
              </TypographyXSmall>
              {results
                .filter((r) => r.type === "fursona")
                .map((r) => {
                  const f = r.data as FursonaSearch;
                  return (
                    <Link
                      key={f.username}
                      href={`/@${f.username}`}
                      className="flex flex-col space-y-0.5 md:space-y-1 hover:bg-secondary px-2 md:px-3 py-2 md:py-2 rounded transition-colors"
                    >
                      <TypographyLead className="font-medium text-sm md:text-base">
                        {f.display_name}
                      </TypographyLead>
                      <TypographyXSmall className="text-muted-foreground text-xs">
                        @{f.username}
                      </TypographyXSmall>
                    </Link>
                  );
                })}
            </div>
          )}

          {results.some((r) => r.type === "nav") && (
            <div>
              <TypographyXSmall className="px-2 py-2 font-semibold text-muted-foreground text-xs md:text-sm">
                Navigation
              </TypographyXSmall>
              {results
                .filter((r) => r.type === "nav")
                .map((r) => {
                  const nav = r.data as NavOption;
                  return (
                    <Link
                      key={nav.label}
                      href={nav.path}
                      className="flex items-center text-xs md:text-sm hover:bg-accent cursor-pointer rounded px-2 md:px-3 py-2 transition-colors"
                    >
                      {nav.label}
                    </Link>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </>
  )
}