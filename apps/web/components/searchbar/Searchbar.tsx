"use client";

import { useRef, useState } from "react";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { TypographyLead, TypographyXSmall } from "@repo/ui/typography";
import { useRouter } from "next/navigation";
import { useProfileSearch } from "@/hooks/useProfileSearch";
import type { FursonaSearchResult } from "@/types/fursona";

type SearchType = "fursona" | "nav" | null;

interface NavOption {
  label: string;
  path: string;
}

interface SearchResult {
  type: "fursona" | "nav";
  data: FursonaSearchResult | NavOption;
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

function parseSearchQuery(query: string): { type: SearchType; term: string } {
  if (query.startsWith("@")) return { type: "fursona", term: query.slice(1).trim() };
  if (query.startsWith(">")) return { type: "nav", term: query.slice(1).trim() };
  return { type: null, term: query };
}

function searchNav(term: string): SearchResult[] {
  const options = term.trim()
    ? NAV_OPTIONS.filter((o) => o.label.toLowerCase().includes(term.toLowerCase()))
    : NAV_OPTIONS;
  return options.map((o) => ({ type: "nav" as const, data: o }));
}

export function Searchbar() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { type, term } = parseSearchQuery(searchQuery);

  // Only pass term to useProfileSearch when we want fursona results
  const fursonaSearchTerm = type === "nav" ? "" : term;
  const { results: fursonaResults, loading, error } = useProfileSearch(fursonaSearchTerm);

  const results: SearchResult[] = type === "nav"
    ? searchNav(term)
    : fursonaResults.map((f) => ({ type: "fursona" as const, data: f }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget)) {
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (e.key === "Enter" && results.length > 0) {
      const first = results[0];
      const href = first?.type === "fursona"
        ? `/@${(first.data as FursonaSearchResult).username}`
        : (first?.data as NavOption).path;
      router.push(href);
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <div className="relative w-64" ref={containerRef}>
      <Label htmlFor="header-search" className="sr-only" />
      <Input
        id="header-search"
        type="text"
        value={searchQuery}
        placeholder="Search..."
        onKeyDown={handleKeyDown}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        error={!!error}
      />

      {isOpen && (
        <div className="absolute top-full mt-1 w-full z-50 bg-popover border border-border rounded-md shadow-md">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Searching...</span>
            </div>
          )}

          {error && !loading && (
            <div className="px-2 py-2 text-sm text-destructive">{error.message}</div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="px-2 py-2">
              {results.some((r) => r.type === "fursona") && (
                <div>
                  <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Users</p>
                  {results
                    .filter((r) => r.type === "fursona")
                    .map((r) => {
                      const f = r.data as FursonaSearchResult;
                      return (
                        <Link
                          key={f.username}
                          href={`/@${f.username}`}
                          onClick={() => { setIsOpen(false); setSearchQuery(""); }}
                          className="flex flex-col space-y-1 hover:bg-secondary px-2 py-1 rounded"
                        >
                          <TypographyLead className="font-medium">{f.display_name}</TypographyLead>
                          <TypographyXSmall className="text-muted-foreground">@{f.username}</TypographyXSmall>
                        </Link>
                      );
                    })}
                </div>
              )}

              {results.some((r) => r.type === "nav") && (
                <div>
                  <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Navigation</p>
                  {results
                    .filter((r) => r.type === "nav")
                    .map((r) => {
                      const nav = r.data as NavOption;
                      return (
                        <Link
                          key={nav.label}
                          href={nav.path}
                          onClick={() => { setIsOpen(false); setSearchQuery(""); }}
                          className="flex items-center text-sm hover:bg-accent cursor-pointer rounded px-2 py-1 mx-1"
                        >
                          {nav.label}
                        </Link>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {!loading && !error && results.length === 0 && searchQuery && (
            <div className="px-2 py-2 text-sm text-muted-foreground">No results found</div>
          )}

          {!searchQuery && (
            <div className="px-2 py-2 text-xs text-muted-foreground space-y-0.5">
              <p>🔍 How to search:</p>
              <p>Type to search all</p>
              <p>@ Search specific username</p>
              <p>&gt; Navigate to page</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}