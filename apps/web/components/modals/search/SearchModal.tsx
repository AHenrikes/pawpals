"use client";

import { type FocusEventHandler, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useProfileSearch } from "@/hooks/core/fursonas/useProfileSearch";
import { TypographyP, TypographyXSmall } from "@repo/ui/typography";
import { DrawerFooter } from "@repo/ui/drawer";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { PopoverContent } from "@repo/ui/popover";
import { Kbd } from "@repo/ui/kbd";
import { type FursonaSearch } from "@/types/fursona";
import { AnimatePresence, motion } from "framer-motion";
import SearchResults from "./SearchResults";
import SearchDefault from "./SearchDefault";

type SearchType = "fursona" | "nav" | null;

export interface NavOption {
  label: string;
  path: string;
}

export interface SearchResult {
  type: "fursona" | "nav";
  data: FursonaSearch | NavOption;
}

interface SearchDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onMouseEnter: () => void;
  readonly onMouseLeave: () => void;
  readonly onFocusCapture: FocusEventHandler<HTMLDivElement>;
  readonly onBlurCapture: FocusEventHandler<HTMLDivElement>;
  readonly searchQuery: string;
  readonly onSearchQueryChange: (query: string) => void;
}

const NAV_OPTIONS: NavOption[] = [
  { label: "Home", path: "/" },
  { label: "Store", path: "/store" },
  { label: "DMs", path: "/dms" },
  { label: "Communities", path: "/communities" },
  { label: "Pawpal-Meet", path: "/meet" },
  { label: "Threads", path: "/threads" },
  { label: "Notifications", path: "/notifications" },
  { label: "Settings", path: "/settings" },
];

const search_guide = [
  { symbol: "@", label: "For username" },
  { symbol: "/", label: "For pages" },
];

function parseSearchQuery(query: string): { type: SearchType; term: string } {
  if (query.startsWith("@"))
    return { type: "fursona", term: query.slice(1).trim() };
  if (query.startsWith("/") || query.startsWith(">"))
    return { type: "nav", term: query.slice(1).trim() };

  return { type: null, term: query };
}

function searchNav(term: string): SearchResult[] {
  const options = term.trim()
    ? NAV_OPTIONS.filter((o) =>
        o.label.toLowerCase().includes(term.toLowerCase()),
      )
    : NAV_OPTIONS;

  return options.map((o) => ({ type: "nav" as const, data: o }));
}

export default function SearchModal({
  open,
  onClose,
  onMouseEnter,
  onMouseLeave,
  onFocusCapture,
  onBlurCapture,
  searchQuery,
  onSearchQueryChange,
}: SearchDialogProps) {
  const { history, addSearch, clearHistory } = useSearchHistory();

  const { type, term } = parseSearchQuery(searchQuery);
  const fursonaSearchTerm = type === "nav" ? "" : term;
  const {
    results: fursonaResults,
    loading,
    error,
  } = useProfileSearch(fursonaSearchTerm);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const results: SearchResult[] =
    type === "nav"
      ? searchNav(term)
      : fursonaResults.map((f) => ({ type: "fursona" as const, data: f }));

  return (
    <AnimatePresence>
      {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            key="popup-overlay"
            aria-hidden="true"
            className="fixed inset-0 top-16 backdrop-blur-md z-30"
          />
        )}

      {open && (
        <PopoverContent
          asChild
          disableAnimation
          align="end"
          side="bottom"
          sideOffset={14}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="w-dvw rounded-none border-none border-b-border/20 bg-background rounded-b-sm"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onFocusCapture={onFocusCapture}
          onBlurCapture={onBlurCapture}
        >
          <motion.div
            key="search-popover"
            initial={{ opacity: 0, y: -50, scaleY: 0.98 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            {/* Results Container */}
            <div className="flex-1 min-h-0 px-2 py-4 overflow-y-auto scrollbar-none z-50 md:min-h-74 md:px-6 md:pb-0">
              {/* default */}
              {!searchQuery.trim() && (
                <SearchDefault
                  history={history}
                  onClearHistory={clearHistory}
                  onSelectHistory={onSearchQueryChange}
                />
              )}

              {/* loading */}
              {searchQuery.trim() && loading && (
                <div className="flex items-center p-4 gap-2">
                  <Loader2 className="size-4 animate-spin" />

                  <span className="text-sm text-text-muted">Searching...</span>
                </div>
              )}

              {/* error */}
              {searchQuery.trim() && error && (
                <div className="px-4 py-4 text-sm text-destructive">
                  {error.message || "Search is unavailable. Please try again."}
                </div>
              )}

              {/* search results */}
              {searchQuery.trim() && (
                <SearchResults
                  loading={loading}
                  results={results}
                  error={error}
                  handleClose={handleClose}
                  onSelect={() => addSearch(searchQuery)}
                />
              )}

              {/* no results */}
              {!loading &&
                !error &&
                results.length === 0 &&
                searchQuery.trim() && (
                  <div className="h-full p-4 text-sm text-text-muted text-center">
                    No results found
                  </div>
                )}
            </div>

            {/* How to Search */}
            <DrawerFooter className="hidden sm:flex md:px-6">
              <div className="flex items-center gap-4">
                <TypographyP className="text-sm">How to search :</TypographyP>

                <div className="flex gap-4">
                  {search_guide.map((elem) => (
                    <div
                      key={`guide-${elem.label}`}
                      className="flex items-center"
                    >
                      <Kbd className="text-base text-text bg-transparent">
                        {elem.symbol}
                      </Kbd>

                      <TypographyXSmall className="text-text-muted">
                        {elem.label}
                      </TypographyXSmall>
                    </div>
                  ))}
                </div>
              </div>
            </DrawerFooter>
          </motion.div>
        </PopoverContent>
      )}
    </AnimatePresence>
  );
}
