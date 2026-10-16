"use client";

import { Button } from "@repo/ui/button";
import { ArrowLeftIcon, CircleAlertIcon } from "lucide-react";
import { Searchbar } from "../modals/search/Searchbar";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@repo/ui/lib/utils";

export default function ReturnHeader() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header
      className={cn(
        "absolute top-0 w-full transition-colors z-50",
        searchOpen ? "bg-background" : "bg-transparent",
      )}
    >
      <div className="flex justify-between items-center h-16 px-2 md:px-4">
        <Button
          size="icon-sm"
          variant={"outline"}
          onClick={() => router.back()}
          aria-label="Go back"
          className="text-text-muted rounded-full hover:text-text"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Searchbar onOpenChange={setSearchOpen} />

          <Button
            size="icon"
            variant={"none"}
            aria-label="Page information"
            className="text-text-muted hover:text-text"
          >
            <CircleAlertIcon aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  );
}
