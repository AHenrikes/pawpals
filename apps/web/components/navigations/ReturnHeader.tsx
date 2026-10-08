"use client";

import { Button } from "@repo/ui/button";
import { ArrowLeftIcon, CircleAlertIcon } from "lucide-react";
import { Searchbar } from "../modals/search/Searchbar";
import { useRouter } from "next/navigation";

export default function ReturnHeader() {
  const router = useRouter();

  return (
    <header className="container absolute inset-x-0 z-50 flex h-16 items-center justify-between">
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
        <Searchbar />

        <Button
          size="icon"
          variant={"none"}
          aria-label="Page information"
          className="text-text-muted hover:text-text"
        >
          <CircleAlertIcon aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
