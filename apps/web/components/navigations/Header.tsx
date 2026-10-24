"use client";

import Link from "next/link";
import { useState } from "react";
import { SidebarTrigger } from "@/providers/SidebarProvider";
import { AUTH_ROUTES } from "@/lib/constants/auth";
import { TypographyH1 } from "@repo/ui/typography";
import { Searchbar } from "@/components/modals/search/Searchbar";
import { cn } from "@repo/ui/lib/utils";
import AvatarIcon from "../avatar-icons/AvatarIcon";

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 w-full border-b border-b-border/20 transition-colors z-50",
        searchOpen ? "bg-background" : "bg-background/75",
      )}
    >
      <div className="flex items-center justify-between h-16 px-2 md:px-4">
        <div className="flex gap-1 items-center">
          <SidebarTrigger className="border-none" />

          <Link href={AUTH_ROUTES.HOME} className="hidden md:block">
            <TypographyH1 className="text-lg text-text sm:text-xl md:text-2xl">
              PAWPALS
            </TypographyH1>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Searchbar onOpenChange={setSearchOpen} />

          <AvatarIcon />
        </div>
      </div>
    </header>
  );
}
