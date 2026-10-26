"use client";

import Link from "next/link";
import { useState } from "react";
import { SidebarTrigger } from "@/providers/SidebarProvider";
import { AUTH_ROUTES } from "@/lib/constants/auth";
import { TypographyH1 } from "@repo/ui/typography";
import { Searchbar } from "@/components/modals/search/Searchbar";
import { cn } from "@repo/ui/lib/utils";
import AvatarIcon from "../avatar-icons/AvatarIcon";
import { ThemeSwitcher } from "./ThemeSwitcher";

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-b-white/10 shadow-lg shadow-black/5 transition-colors",
        searchOpen ? "bg-background" : "bg-background/65 backdrop-blur-2xl",
      )}
    >
      <div className="flex justify-between items-center h-16 px-2 gap-3 md:px-4">
        <div className="flex gap-1 items-center">
          <SidebarTrigger className="border-none" />

          <Link href={AUTH_ROUTES.HOME} className="hidden md:block">
            <TypographyH1 className="text-lg text-text sm:text-xl md:text-2xl">
              PAWPALS
            </TypographyH1>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Searchbar onOpenChange={setSearchOpen} />
          <ThemeSwitcher />
          <div className="rounded-full ring-2 ring-white/10 transition hover:ring-primary/50">
            <AvatarIcon />
          </div>
        </div>
      </div>
    </header>
  );
}
