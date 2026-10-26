"use client";

import { Button } from "@repo/ui/button";
import { ArrowLeftIcon, CircleAlertIcon } from "lucide-react";
import { Searchbar } from "../modals/search/Searchbar";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@repo/ui/lib/utils";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useCurrentPath } from "@/hooks/usePath";
import { TypographyH1 } from "@repo/ui/typography";

function getUsername(pathname: string): boolean {
  if (pathname.startsWith("/@")) {
    return true;
  }

  return false;
}

export default function ReturnHeader() {
  const router = useRouter();
  const profilePage = getUsername(useCurrentPath());
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header
      className={cn(
        "top-0 w-full border-white/10 shadow-black/5 transition-colors z-50",
        profilePage ? "absolute" : "fixed bg-background/65 border-b shadow-lg backdrop-blur-2xl",
        searchOpen ? "bg-background" : null,
      )}
    >
      <div className="flex justify-between items-center h-16 px-2 gap-4 md:px-4">
        <div className="flex gap-3">
          <Button
            size="icon-sm"
            variant={"outline"}
            onClick={() => router.back()}
            aria-label="Go back"
            className="glass-control rounded-full text-text-muted hover:text-text"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-5" />
          </Button>

          <TypographyH1 className="hidden text-3xl sm:block sm:text-2xl">
            {useCurrentPath().slice(1)}
          </TypographyH1>
        </div>

        <div className="flex items-center gap-2">
          <Searchbar onOpenChange={setSearchOpen} />
          <ThemeSwitcher />

          <Button
            size="icon"
            variant={"none"}
            aria-label="Page information"
            className="text-text-muted hover:bg-surface/60 hover:text-text"
          >
            <CircleAlertIcon aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  );
}
