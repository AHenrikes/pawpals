"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Loader2, SearchIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProfileSearch } from "@/hooks/core/fursonas/useProfileSearch";
import type { FursonaSearch } from "@/types/fursona";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@repo/ui/input-group";
import { Kbd } from "@repo/ui/kbd";
import { AnimatePresence, motion } from "framer-motion";
import { KeyboardEvent, LockScreen } from "@/utils/lock-body";
import SearchResults from "./SearchResults";
import SearchDefault from "./SearchDefault";
import { createPortal } from "react-dom";
import { Field, FieldLabel } from "@repo/ui/field";
import { Button } from "@repo/ui/button";

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
  open: boolean;
  onClose: () => void;
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

export default function SearchDialog({open, onClose}: Readonly<SearchDialogProps>) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState("");

  const { type, term } = parseSearchQuery(searchQuery);
  const fursonaSearchTerm = type === "nav" ? "" : term;
  const {
    results: fursonaResults,
    loading,
    error,
  } = useProfileSearch(fursonaSearchTerm);

  const handleClose = useCallback(() => {
    onClose();
    setSearchQuery("");
  }, [onClose]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 350)
    };
  }, [open]);

  LockScreen(open);
  KeyboardEvent(open, handleClose);

  if (!open) return null

  const results: SearchResult[] =
    type === "nav"
      ? searchNav(term)
      : fursonaResults.map((f) => ({ type: "fursona" as const, data: f }));

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

  return createPortal(
    <AnimatePresence mode="wait">
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 top-16 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleClose}
          />

          {/* Container */}
          <motion.div
            key="container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 flex justify-center z-50 pointer-events-none"
          >
            <div className="flex flex-col h-[75svh] w-full overflow-hidden shadow-lg md:h-[320px] md:rounded-xl pointer-events-auto">
              {/* Input */}
              <div className="flex items-center h-16 px-2 gap-2 bg-background flex-shrink-0 md:px-6 md:bg-transparent">
                <Field className="md:fixed md:right-16 md:w-72">
                  <FieldLabel htmlFor="header-search" className="sr-only">Search</FieldLabel>

                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <SearchIcon className="w-4 h-4" />
                    </InputGroupAddon>

                    <InputGroupInput
                      ref={inputRef}
                      id="header-search"
                      type="text"
                      value={searchQuery}
                      placeholder="Search... @users, #tags.."
                      onKeyDown={handleKeyDown}
                      onChange={handleInputChange}
                      error={!!error}
                      className="text-base md:text-sm"
                    />

                    <InputGroupAddon align="inline-end" className="hidden md:flex">
                      <Kbd>Esc</Kbd>
                    </InputGroupAddon>
                  </InputGroup>
                </Field>

                <Button
                  size={"icon"}
                  variant={"destructive"}
                  onClick={handleClose}
                  className="p-1 md:hidden"
                >
                  <XIcon />
                </Button>
              </div>

              {/* Results Container */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex-1 px-2 py-4 border-t bg-background overflow-y-auto md:px-6 md:py-4"
              >
                {/* Searching */}
                {loading && (
                  <div className="flex items-center justify-center h-full gap-2 p-4">
                    <Loader2 size={16} className="animate-spin" />

                    <span className="text-sm text-muted-foreground">
                      Searching...
                    </span>
                  </div>
                )}

                {/* Error */}
                {error && !loading && (
                  <div className="px-4 py-4 text-sm text-destructive">
                    {error.message}
                  </div>
                )}

                {/* Results or Default View */}
                <>
                  <SearchResults loading={loading} results={results} error={error} handleClose={handleClose} />
                  <SearchDefault searchQuery={searchQuery} />

                  {/* No results */}
                  {!loading &&
                    !error &&
                    results.length === 0 &&
                    searchQuery && (
                    <div className="flex items-center justify-center h-full p-4 text-sm text-muted-foreground text-center">
                      No results found
                    </div>
                  )}
                </>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
