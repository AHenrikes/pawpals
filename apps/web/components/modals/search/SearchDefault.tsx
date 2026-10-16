import { Button } from "@repo/ui/button";
import { Separator } from "@repo/ui/separator";
import {
  TypographyH4,
  TypographyMuted,
  TypographyXSmall,
} from "@repo/ui/typography";
import { Clock3Icon, HashIcon, TrendingUpIcon } from "lucide-react";

interface SearchDefaultProps {
  history: string[];
  onClearHistory: () => void;
  onSelectHistory: (query: string) => void;
}

export default function SearchDefault({
  history,
  onClearHistory,
  onSelectHistory,
}: Readonly<SearchDefaultProps>) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-6 md:flex-row md:max-h-64">
      <section className="flex min-h-0 w-full flex-col gap-4 md:max-w-72">
        <div className="flex items-center justify-between">
          <TypographyH4 className="text-base text-text-muted">
            History
          </TypographyH4>
          {history.length > 0 && (
            <Button
              size="xs"
              variant="none"
              onClick={onClearHistory}
              className="h-fit p-0 text-text-muted hover:text-text"
            >
              <TypographyXSmall>Clear</TypographyXSmall>
            </Button>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-none">
          {history.length === 0 ? (
            <TypographyXSmall className="text-text-muted">
              Your recent searches will appear here.
            </TypographyXSmall>
          ) : (
            history.map((query) => (
              <Button
                key={query}
                variant="none"
                onClick={() => onSelectHistory(query)}
                className="h-auto w-full justify-start gap-3 rounded-sm bg-secondary-dim/60 px-3 py-2 text-left text-text hover:bg-secondary"
              >
                <Clock3Icon className="size-4 shrink-0 text-text-muted" />
                <span className="truncate">{query}</span>
              </Button>
            ))
          )}
        </div>
      </section>

      <Separator orientation="vertical" className="hidden h-auto md:block" />

      <section className="space-y-4 md:flex-1">
        <div className="flex items-center gap-2">
          <TrendingUpIcon className="size-4 text-text-muted" />
          <TypographyMuted className="text-xs md:text-sm">
            Trending users
          </TypographyMuted>
        </div>
        <TypographyXSmall className="text-text-muted">
          Trending profiles will appear here when available.
        </TypographyXSmall>
      </section>

      <Separator orientation="vertical" className="hidden h-auto lg:block" />

      <section className="w-full space-y-4 md:max-w-72">
        <div className="flex items-center gap-2">
          <HashIcon className="size-4 text-text-muted" />
          <TypographyMuted className="text-xs md:text-sm">
            Trending tags
          </TypographyMuted>
        </div>
        <TypographyXSmall className="text-text-muted">
          Trending tags will appear here when available.
        </TypographyXSmall>
      </section>
    </div>
  );
}
