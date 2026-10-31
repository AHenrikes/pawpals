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
import { usePageTransition } from "@/components/transitions/PageTransitionProvider";
import AvatarIcon from "../avatar-icons/AvatarIcon";

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { exitingPath, destinationPath } = usePageTransition();
  const isExitingToProfile = exitingPath !== null && destinationPath?.startsWith("/@");

  return (
    <div className="sticky top-0 w-full h-16 shrink-0 z-50">
      <motion.header
        initial={false}
        animate={isExitingToProfile ? { opacity: 0, y: -100 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "absolute inset-0 w-full border-b border-b-white/10 bg-background transition-colors md:shadow-lg md:shadow-black/5",
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
      </motion.header>
    </div>
  );
}
