"use client";

import Link from "next/link";
import { useState } from "react";
import { SidebarTrigger } from "@/providers/SidebarProvider";
import { AUTH_ROUTES } from "@/lib/constants/auth";
import { TypographyH1 } from "@repo/ui/typography";
import { Searchbar } from "@/components/modals/search/Searchbar";
import { cn } from "@repo/ui/lib/utils";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { motion } from "framer-motion";
import AvatarIcon from "../avatar-icons/AvatarIcon";

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-b-white/10 bg-background transition-colors md:shadow-lg md:shadow-black/5",
        !searchOpen && "md:bg-background/65 md:backdrop-blur-2xl",
      )}
    >
      <div className="flex justify-between items-center h-16 px-2 gap-3 md:px-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-1 items-center"
        >
          <SidebarTrigger className="border-none" />

          <Link href={AUTH_ROUTES.HOME} className="hidden md:block">
            <TypographyH1 className="text-lg md:text-2xl">PAWPALS</TypographyH1>
          </Link>
        </motion.div>

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
