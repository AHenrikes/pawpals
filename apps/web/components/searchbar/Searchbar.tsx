"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { FursonaTypes } from "@/types/fursona";
import { api } from "@/lib/api/api-client";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { TypographyLead, TypographyXSmall } from "@repo/ui/typography";
import { useRouter } from "next/navigation";

interface SearchResult {
  type: "fursona" | "nav";
  data: FursonaTypes | Record<string, unknown>;
}

export function Searchbar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);

  const router = useRouter();

  // Parse search prefix (@, >, etc)
  const parseSearchQuery = (query: string) => {
    if (query.startsWith("@")) {
      return { type: "fursona", query: query.slice(1).trim() };
    }

    if (query.startsWith(">")) {
      return { type: "nav", query: query.slice(1).trim() };
    }

    return { type: null, query };
  };

  const searchFursonas = useCallback(async (term: string) => {
    if (!term.trim()) {
      setError("Enter a username to search");
      setResults([]);
      return [];
    }

    const res = await api.get<{ fursonas: FursonaTypes[] }>(
      `/api/search/fursonas/${term}`,
    );

    return res.fursonas.map((fursona) => ({
      type: "fursona" as const,
      data: fursona,
    }));
  }, []);

  const searchNav = useCallback((term: string) => {
    const options = [
      { label: "Home", path: "/" },
      { label: "Store", path: "/store" },
      { label: "DMs", path: "/dms" },
      { label: "Communities", path: "/communities" },
      { label: "Pawpal-Meet", path: "/meet" },
      { label: "Threads", path: "/threads" },
      { label: "Notifications", path: "/notifications" },
      { label: "Settings", path: "/settings" },
    ];

    if (!term.trim()) {
      return options.map((o) => ({
        type: "nav" as const,
        data: o,
      }));
    }

    return options
      .filter((o) => o.label.toLowerCase().includes(term.toLowerCase()))
      .map((o) => ({ type: "nav" as const, data: o }));
  }, []);

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        setError(null);
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const { type, query: searchTerm } = parseSearchQuery(query);
      setIsLoading(true);
      setError(null);

      try {
        if (type === "fursona") {
          const results = await searchFursonas(searchTerm);
          if (results) setResults(results ?? []);
        } else if (type === "nav") {
          const navResults = searchNav(searchTerm);
          setResults(navResults);
        } else if (query.trim()) {
          // Generic search (no prefix) - search all categories
          // For now, search users by default
          try {
            const results = await searchFursonas(searchTerm);
            if (results) setResults(results ?? []);
          } catch {
            setError("No results found");
            setResults([]);
          }
        }
      } catch {
        setError("User not found");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchFursonas, searchNav],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsOpen(true);

    if (!e.target.value.trim()) {
      setResults([]);
      setError(null);
    }

    // Debounce search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setIsOpen(false);
    if (e.key === "Enter" && results.length > 0) {
      const first = results[0];
      const href =
        first?.type === "fursona"
          ? `/@${(first.data as FursonaTypes).username}`
          : (first?.data as { path: string }).path;

      router.push(href);
      setIsOpen(false);
      setSearchQuery("");
      setResults([]);
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
        onFocus={handleFocus}
        onBlur={handleBlur}
        error={typeof error === "string"}
      />

      {isOpen && (
        <div className="absolute top-full mt-1 w-full z-50 bg-popover border border-border rounded-md shadow-md">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Searching...
              </span>
            </div>
          )}

          {error && !isLoading && (
            <div className="px-2 py-2 text-sm text-destructive">{error}</div>
          )}

          {results.length > 0 && !isLoading && (
            <div className="px-2 py-2">
              {/* Group results by type */}
              {results.some((r) => r.type === "fursona") && (
                <div>
                  <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                    Users
                  </p>
                  {results
                    .filter((r) => r.type === "fursona")
                    .map((result) => {
                      if (result.type === "fursona") {
                        const fursona = result.data as FursonaTypes;
                        const displayName = fursona.display_name || "Unknown";
                        const username = fursona.username || "unknown";
                        return (
                          <Link
                            key={username}
                            href={`/@${username}`}
                            onClick={() => {
                              setIsOpen(false);
                              setSearchQuery("");
                            }}
                            className="flex flex-col space-y-1 hover:bg-secondary"
                          >
                            <TypographyLead className="font-medium">
                              {displayName}
                            </TypographyLead>
                            <TypographyXSmall className="text-muted-foreground">
                              @{username}
                            </TypographyXSmall>
                          </Link>
                        );
                      }
                      return null;
                    })}
                </div>
              )}

              {results.some((r) => r.type === "nav") && (
                <div>
                  <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                    Navigation
                  </p>
                  {results
                    .filter((r) => r.type === "nav")
                    .map((result) => {
                      const nav = result.data as {
                        label: string;
                        path: string;
                      };
                      return (
                        <Link
                          key={nav.label}
                          href={nav.path}
                          onClick={() => {
                            setIsOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex flex-col gap-4 text-sm hover:bg-accent cursor-pointer rounded mx-1"
                        >
                          {nav.label}
                        </Link>
                      );
                    })}
                </div>
              )}

              {/* TODO: Add more results section in future */}
              {/* {results.some((r) => r.type === "thread") && (
                  <div className="border-t border-border pt-1 mt-1">
                    <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Threads</p>
                    {results.filter((r) => r.type === "thread").map(...)}
                  </div>
                )} */}
            </div>
          )}

          {!isLoading && !error && results.length === 0 && searchQuery && (
            <div className="px-2 py-2 text-sm text-muted-foreground">
              No results found
            </div>
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
