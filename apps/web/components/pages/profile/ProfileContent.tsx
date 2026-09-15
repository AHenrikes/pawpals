"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@repo/ui/lib/utils";
import { type FursonaProfile } from "@/types/fursona";
import { ProfileGallery } from "./Gallery";
import ProfilePostCards from "./ProfilePostCards";
import { SidebarProvider } from "@/providers/SidebarProvider";

const profileNav = [
  { label: "GALLERY", key: "gallery", special: undefined },
  { label: "POST", key: "post", special: undefined },
  { label: "REPOST", key: "repost", special: undefined },
  { label: "ARCHIVE", key: "archive", special: undefined },
  { label: "LIKE", key: "likes", special: undefined },
  { label: "ABOUT", key: "about", special: "hidden" },
] as const satisfies ReadonlyArray<{
  label: string;
  key: string;
  special?: string;
}>;

type ContentKey = (typeof profileNav)[number]["key"];

export default function ProfileContent({ fursona }: Readonly<{ fursona: FursonaProfile }>) {
  const [content, setContent] = useState<ContentKey>("gallery");
  const [direction, setDirection] = useState(0);

  const handleNavClick = (key: ContentKey) => {
    const oldIndex = profileNav.findIndex((n) => n.key === content);
    const newIndex = profileNav.findIndex((n) => n.key === key);
    setDirection(newIndex > oldIndex ? 1 : -1);
    setContent(key);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <SidebarProvider>
      <div className="container flex flex-col pt-6 mx-auto">
        {/* Nav */}
        <nav className="pb-4 border-b border-muted">
          <ul className="flex gap-2.5 overflow-x-auto scrollbar-hide">
            {profileNav.map(({ key, label, special }) => (
              <Button
                key={label}
                variant="ghost"
                className={cn(
                  "p-4 rounded-sm",
                  content === key ? "bg-primary hover:bg-primary-dim" : null,
                  special ? "lg:hidden" : null,
                )}
                onClick={() => handleNavClick(key)}
              >
                {label}
              </Button>
            ))}
          </ul>
        </nav>

        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.section
            key={content}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="grow space-y-4 min-h-[calc(100dvh-80px)] py-2 lg:overflow-y-auto scrollbar-hide md:py-4"
          >
            {content === "gallery" && <ProfileGallery username={fursona.id} />}

            {content === "post" && <ProfilePostCards fursonaId={fursona.id} />}

            {content === "archive" && <div>Archive coming soon</div>}

            {content === "likes" && <div>Likes coming soon</div>}

            {content === "about" && <div>Likes coming soon</div>}
          </motion.section>
        </AnimatePresence>
      </div>
    </SidebarProvider>
  );
}
