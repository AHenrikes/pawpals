"use client";

import { Button } from "@repo/ui/button";
import { SearchIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import SearchDialog from "./SearchDialog";
import { cn } from "@/lib/helpers/utils";
import { Kbd } from "@repo/ui/kbd";

export function Searchbar() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  return (
    <>
      <Button
        size="icon-lg"
        variant="none"
        onClick={() => setOpen(true)}
        className={cn(
          "flex justify-center items-center text-text-muted rounded-sm hover:text-text",
          `${open ? "hidden" : ""}`,
        )}
      >
        <SearchIcon />
      </Button>

      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
