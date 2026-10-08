"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { useProfileSearch } from "@/hooks/core/fursonas/useProfileSearch";
import { LockScreen } from "@/lib/helpers/lockBody";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import SearchResults from "./SearchResults";

export interface ProfileSearchResult {
  type: "fursona";
  data: import("@/types/fursona").FursonaSearch;
}

export default function ProfileSearchDialog({
  open,
  onClose,
}: Readonly<{ open: boolean; onClose: () => void }>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const term = query.replace(/^@/, "").trim();
  const { results, loading, error } = useProfileSearch(term);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  LockScreen(open);
  if (!open) return null;

  const close = () => {
    setQuery("");
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-center bg-black/50 p-4 pt-20"
      onClick={close}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Search profiles"
        className="h-fit w-full max-w-xl space-y-4 rounded-lg border bg-background p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <SearchIcon className="size-5 text-text-muted" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search fursonas by name or @username"
            aria-label="Search fursonas"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={close}
            aria-label="Close search"
          >
            <XIcon />
          </Button>
        </div>

        {loading && (
          <div className="flex justify-center p-6">
            <Loader2Icon className="animate-spin" />
          </div>
        )}
        {error && (
          <p className="text-sm text-destructive">Unable to search profiles.</p>
        )}
        {!loading && !error && term.length > 0 && (
          <SearchResults
            loading={false}
            error={null}
            results={results.map((data) => ({ type: "fursona", data }))}
            handleClose={close}
          />
        )}
        {!loading && term.length > 0 && results.length === 0 && (
          <p className="p-6 text-center text-sm text-text-muted">
            No profiles found.
          </p>
        )}
      </section>
    </div>,
    document.body,
  );
}
