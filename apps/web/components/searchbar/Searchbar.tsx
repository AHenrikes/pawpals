"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Label } from "@repo/ui/label";
import { Loader2, SearchIcon } from "lucide-react";
import { TypographyLead, TypographyP, TypographyXSmall } from "@repo/ui/typography";
import { useRouter } from "next/navigation";
import { useProfileSearch } from "@/hooks/core/fursonas/useProfileSearch";
import { createPortal } from "react-dom";
import type { FursonaSearch } from "@/types/fursona";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@repo/ui/input-group";
import { Kbd } from "@repo/ui/kbd";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@repo/ui/button";
import { KeyboardEvent, LockScreen } from "@/utils/lock-body";
import Link from "next/link";

type SearchType = "fursona" | "nav" | null;

interface NavOption {
  label: string;
  path: string;
}

interface SearchResult {
  type: "fursona" | "nav";
  data: FursonaSearch | NavOption;
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
  if (query.startsWith("@"))
    return { type: "fursona", term: query.slice(1).trim() };
  if (query.startsWith(">"))
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

export function Searchbar() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { type, term } = parseSearchQuery(searchQuery);
  const fursonaSearchTerm = type === "nav" ? "" : term;
  const {
    results: fursonaResults,
    loading,
    error,
  } = useProfileSearch(fursonaSearchTerm);

  const results: SearchResult[] =
    type === "nav"
      ? searchNav(term)
      : fursonaResults.map((f) => ({ type: "fursona" as const, data: f }));

  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && results.length > 0) {
      const first = results[0];
      const href =
        first?.type === "fursona"
          ? `/@${(first.data as FursonaSearch).username}`
          : (first?.data as NavOption).path;
      router.push(href);
      handleClose();
    }
  };

  LockScreen(isOpen);
  KeyboardEvent(isOpen, handleClose);

  return (
    <>
      {/* Anchor — never changes size */}
      <div
        ref={containerRef}
        className={`relative flex items-center ${isOpen === true ? "hidden" : ""}`}
      >
        <Button
          variant={"outline"}
          size={"icon"}
          aria-label="Open search"
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-accent transition-colors"
        >
          <SearchIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Everything portalled to body so fixed/z-index works globally */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="fixed inset-0 top-16 bg-black/40 backdrop-blur-sm z-30"
                  onClick={handleClose}
                />

                {/* Input */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="fixed top-3.5 right-16 w-72 z-50"
                >
                  <Label htmlFor="header-search" className="sr-only">
                    Search
                  </Label>

                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <SearchIcon className="w-4 h-4" />
                    </InputGroupAddon>

                    <InputGroupInput
                      ref={inputRef}
                      id="header-search"
                      type="text"
                      value={searchQuery}
                      placeholder="Search... (@user, >page)"
                      onKeyDown={handleKeyDown}
                      onChange={handleInputChange}
                      error={!!error}
                    />

                    <InputGroupAddon align="inline-end">
                      <Kbd>Esc</Kbd>
                    </InputGroupAddon>
                  </InputGroup>
                </motion.div>

                {/* Results */}
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity:0, y: -50 }}
                  transition={{ duration: .25, ease: "easeOut" }}
                  className="fixed top-16 left-0 right-0 w-full h-[30svh] mx-auto py-2 bg-background border-b border-border md:px-6 shadow-md z-30"
                >
                  <>
                    {/* Searching */}
                    {loading && (
                      <div className="flex items-center justify-center gap-2 py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          Searching...
                        </span>
                      </div>
                    )}

                    {/* Error */}
                    {error && !loading && (
                      <div className="px-2 py-2 text-sm text-destructive">
                        {error.message}
                      </div>
                    )}

                    {/* Results */}
                    {!loading && !error && results.length > 0 && (
                      <div className="px-2 py-2">
                        {results.some((r) => r.type === "fursona") && (
                          <div>
                            <TypographyXSmall className="px-2 py-1 font-semibold text-muted-foreground">
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
                                    onClick={handleClose}
                                    className="flex flex-col space-y-1 hover:bg-secondary px-2 py-1 rounded"
                                  >
                                    <TypographyLead className="font-medium">
                                      {f.display_name}
                                    </TypographyLead>
                                    <TypographyXSmall className="text-muted-foreground">
                                      @{f.username}
                                    </TypographyXSmall>
                                  </Link>
                                );
                              })}
                          </div>
                        )}

                        {results.some((r) => r.type === "nav") && (
                          <div>
                            <TypographyXSmall className="px-2 py-1 font-semibold text-muted-foreground">
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
                                    onClick={handleClose}
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

                    {/* No results */}
                    {!loading &&
                      !error &&
                      results.length === 0 &&
                      searchQuery && (
                        <div className="px-2 py-2 text-sm text-muted-foreground">
                          No results found
                        </div>
                      )
                    }

                    {/* default */}
                    {!searchQuery && (
                      <div className="flex h-full justify-between">
                        <div className="space-y-10">
                          <TypographyLead>Users</TypographyLead>

                          <div className="flex gap-5">
                            <div className="space-y-5">
                              <div>
                                <div className="flex gap-2 animate-pulse">
                                  <div className="h-12 w-12 bg-muted rounded-full" />

                                  <div className="space-y-2">
                                    <div className="h-4 w-32 bg-muted rounded" />
                                    <div className="h-4 w-16 bg-muted rounded" />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <div className="flex gap-2 animate-pulse">
                                  <div className="h-12 w-12 bg-muted rounded-full" />

                                  <div className="space-y-2">
                                    <div className="h-4 w-32 bg-muted rounded" />
                                    <div className="h-4 w-16 bg-muted rounded" />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <div className="flex gap-2 animate-pulse">
                                  <div className="h-12 w-12 bg-muted rounded-full" />

                                  <div className="space-y-2">
                                    <div className="h-4 w-32 bg-muted rounded" />
                                    <div className="h-4 w-16 bg-muted rounded" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-5">
                              <div>
                                <div className="flex gap-2 animate-pulse">
                                  <div className="h-12 w-12 bg-muted rounded-full" />

                                  <div className="space-y-2">
                                    <div className="h-4 w-32 bg-muted rounded" />
                                    <div className="h-4 w-16 bg-muted rounded" />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <div className="flex gap-2 animate-pulse">
                                  <div className="h-12 w-12 bg-muted rounded-full" />

                                  <div className="space-y-2">
                                    <div className="h-4 w-32 bg-muted rounded" />
                                    <div className="h-4 w-16 bg-muted rounded" />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <div className="flex gap-2 animate-pulse">
                                  <div className="h-12 w-12 bg-muted rounded-full" />

                                  <div className="space-y-2">
                                    <div className="h-4 w-32 bg-muted rounded" />
                                    <div className="h-4 w-16 bg-muted rounded" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="px-2 py-2 text-xs text-muted-foreground space-y-0.5">
                          <p>🔍 How to search:</p>
                          <p>Type to search all</p>
                          <p>@ Search specific username</p>
                          <p>&gt; Navigate to page</p>
                        </div>
                      </div>
                    )}
                  </>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
