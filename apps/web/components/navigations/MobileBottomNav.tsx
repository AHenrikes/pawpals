"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  HomeIcon,
  MenuIcon,
  PlusIcon,
  SettingsIcon,
  LogOutIcon,
  MessageCircleIcon,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/drawer";
import { toast } from "@repo/ui/sonner";
import { useUser } from "@/providers/UserProvider";
import { LockScreen } from "@/lib/helpers/lockBody";
import { CreateFursonaPanelModal } from "@/components/modals/CreateFursonaPanelModal";
import { useCurrentPath } from "@/hooks/usePath";
import FursonaAvatar from "@/components/avatar-icons/FursonaAvatar";
import SearchProfileDialog from "@/components/modals/search/SearchProfileDialog";

const tabClass =
  "flex min-h-14 min-w-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium text-text-muted transition-colors focus-visible:outline-2 focus-visible:outline-primary";

export default function MobileBottomNav() {
  const pathname = useCurrentPath();
  const hideNavigation =
    pathname.startsWith("/@") ||
    pathname.startsWith("/messages/") ||
    pathname.startsWith("/settings");

  const {
    currentFursona,
    fursonas,
    fetchFursonas,
    switchCurrentFursona,
    refresh,
    signOut,
  } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [switching, startTransition] = useTransition();

  LockScreen(createOpen);

  if (hideNavigation) return null;

  const switchFursona = (id: string) => {
    if (id === currentFursona?.id) {
      setMenuOpen(false);
      return;
    }
    startTransition(async () => {
      try {
        await switchCurrentFursona(id);
        setMenuOpen(false);
      } catch {
        toast.error("Could not switch fursona.");
      }
    });
  };

  return (
    <>
      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex min-h-16 items-center justify-around border-t border-foreground/10 bg-background/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_28px_rgba(0,0,0,0.12)] backdrop-blur-xl md:hidden"
      >
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className={cn(tabClass, pathname === "/" && "text-primary")}
        >
          <HomeIcon aria-hidden="true" className="size-6" />
          <span>Home</span>
        </Link>

        <Link
          href="/messages"
          aria-current={pathname === "/messages" ? "page" : undefined}
          className={cn(tabClass, pathname === "/messages" && "text-primary")}
        >
          <MessageCircleIcon aria-hidden="true" className="size-6" />
          <span>Messages</span>
        </Link>

        <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
          <DrawerTrigger
            onClick={() => void fetchFursonas()}
            aria-label="Open account menu"
            aria-expanded={menuOpen}
            className={cn(tabClass, menuOpen && "text-primary")}
          >
            <MenuIcon aria-hidden="true" className="size-6" />
            <span>Menu</span>
          </DrawerTrigger>

          <DrawerContent className="pb-[env(safe-area-inset-bottom)] md:hidden">
            <DrawerHeader>
              <DrawerTitle>Account</DrawerTitle>
            </DrawerHeader>

            <div className="max-h-[55svh] space-y-2 overflow-y-auto px-4 pb-5">
              <p className="px-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                My fursonas
              </p>

              {fursonas.map((fursona) => (
                <button
                  key={fursona.id}
                  type="button"
                  disabled={switching}
                  onClick={() => switchFursona(fursona.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary",
                    fursona.id === currentFursona?.id &&
                      "bg-primary/15 text-primary",
                  )}
                >
                  <FursonaAvatar
                    size="sm"
                    name={fursona.display_name}
                    src={fursona.avatar_url}
                  />
                  <span className="truncate text-sm font-medium">
                    {fursona.display_name}
                  </span>
                </button>
              ))}

              {fursonas.length < 4 && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setCreateOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <PlusIcon className="size-5" />
                  Create fursona
                </button>
              )}

              <div className="h-px bg-foreground/10" />

              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"
              >
                <SettingsIcon className="size-5" />
                Settings
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  void signOut();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-destructive hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-destructive"
              >
                <LogOutIcon className="size-5" />
                Sign out
              </button>
            </div>
          </DrawerContent>
        </Drawer>
      </nav>

      <SearchProfileDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
      {createOpen &&
        createPortal(
          <div className="fixed inset-0 z-70 h-svh">
            <CreateFursonaPanelModal
              isOpen={createOpen}
              onClose={() => setCreateOpen(false)}
              onSuccess={() => void refresh()}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
