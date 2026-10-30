"use client";

import { Button } from "@repo/ui/button";
import { ArrowLeftIcon, CircleAlertIcon } from "lucide-react";
import { Searchbar } from "../modals/search/Searchbar";
import { usePageTransition } from "@/components/transitions/PageTransitionProvider";
import { useState } from "react";
import { cn } from "@repo/ui/lib/utils";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useCurrentPath } from "@/hooks/usePath";
import { TypographyH1 } from "@repo/ui/typography";
import { useReturnHeader } from "./ReturnHeaderProvider";
import { motion } from "framer-motion";

function getUsername(pathname: string): boolean {
  if (pathname.startsWith("/@")) {
    return true;
  }

  return false;
}

export default function ReturnHeader() {
  const { back } = usePageTransition();
  const pathname = useCurrentPath();
  const profilePage = getUsername(pathname);
  const { override } = useReturnHeader();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header
      className={cn(
        "top-0 w-full border-white/10 shadow-black/5 transition-colors z-50",
        profilePage
          ? "absolute bg-linear-to-b from-background to-transparent"
          : "fixed border-b bg-background md:bg-background/65 md:shadow-lg md:backdrop-blur-2xl",
        searchOpen ? "bg-background" : null,
      )}
    >
      <div className="flex justify-between items-center h-16 px-2 gap-4 md:px-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2"
        >
          <Button
            size="icon-sm"
            variant={"outline"}
            onClick={override?.onBack ?? back}
            aria-label={override ? "Previous" : "Go back"}
            className="glass-control rounded-full text-text-muted hover:text-text"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-5" />
          </Button>

          <TypographyH1 className="hidden text-lg md:block md:text-2xl">
            {useCurrentPath().slice(1)}
          </TypographyH1>
        </motion.div>

        <div className="flex items-center gap-2">
          <Searchbar onOpenChange={setSearchOpen} />
          <ThemeSwitcher />

          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            aria-label="Page information"
            className="p-1 text-text-muted hover:text-text hover:cursor-pointer"
          >
            <CircleAlertIcon aria-hidden="true" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
