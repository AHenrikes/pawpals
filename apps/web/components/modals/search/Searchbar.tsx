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
        variant="ghost"
        onClick={() => setOpen(true)}
        className={cn(
          "gradientBG px-2 py-1 space-x-2",
          `${open ? "hidden" : ""}`,
        )}
      >
        <SearchIcon />
        <Kbd className="hidden md:block">Ctl+k</Kbd>
      </Button>

      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
