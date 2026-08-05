"use client";

import Link from "next/link";
import { useState, useMemo, useTransition } from "react";
import { useUser } from "@/providers/UserProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { Skeleton } from "@repo/ui/skeleton";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@repo/ui/collapsible";
import { SidebarTrigger } from "@/providers/SidebarProvider";
import {
  Settings,
  User,
  PlusIcon,
  Check,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { CreateFursonaPanelModal } from "@/components/dialogs/CreateFursonaPanelModal";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "@repo/ui/sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import {
  TypographyH3,
  TypographyP,
  TypographySmall,
  TypographyXSmall,
} from "@repo/ui/typography";
import { Searchbar } from "@/components/dialogs/search/Searchbar";
import { useIsCurrentPath, useCurrentPath } from "@/hooks/useCurrentPath";
import { getInitials } from "@/utils/getInitials";
import HomeTabs from "./HomeTabs";

export default function Header() {
  const {
    fursonas,
    currentFursona,
    loading,
    signOut,
    refresh,
    fetchFursonas,
    switchCurrentFursona,
  } = useUser();
  const [isFursonaListOpen, setIsFursonaListOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateFursonaOpen, setCreateFursonaOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const isCurrentProfile = useIsCurrentPath(`@${currentFursona?.username}`);
  const currentPath = useCurrentPath();

  const handleFursonaCreated = () => {
    refresh();
    setIsFursonaListOpen(false);
  };

  const handleSwitchFursona = async (id: string) => {
    setSwitchingId(id);

    startTransition(async () => {
      try {
        await switchCurrentFursona(id);
        const newCurrentFursona = fursonas.find((f) => f.id === id);
        toast(`Switched to ${newCurrentFursona?.display_name ?? "fursona"}`);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to switch fursona";
        toast(msg);
      } finally {
        setSwitchingId(null);
        setIsMenuOpen(false);

        window.setTimeout(() => {
          setIsFursonaListOpen(false);
        }, 350);
      }
    });
  };

  const displayName = useMemo(() => {
    if (currentFursona?.display_name) {
      return currentFursona.display_name;
    }

    return "Account";
  }, [currentFursona?.display_name]);

  const username = useMemo(() => {
    if (currentFursona?.username) {
      return currentFursona.username;
    }

    return "Username";
  }, [currentFursona?.username]);

  function handleMenuOpenChange(nextOpen: boolean) {
    setIsMenuOpen(nextOpen);

    if (!nextOpen) {
      setIsFursonaListOpen(false);
    }
  }

  function handleFursonaListOpen(nextOpen: boolean) {
    setIsFursonaListOpen(nextOpen);
    if (nextOpen) {
      void fetchFursonas();
    }
  }

  const accountMenuGroup = [
    { href: `/@${currentFursona?.username}`, label: "Fursona", icon: User },
    { href: AUTH_ROUTES.SETTINGS, label: "Settings", icon: Settings },
  ];

  const count = fursonas.length;

  return (
    <header className="sticky top-0 w-full h-16 backdrop-blur-sm z-40">
      <div className="flex h-full w-full items-center justify-between px-2 mx-auto md:px-6">
        <div className="flex gap-1 items-center">
          <SidebarTrigger className="border-none" />

          <Link href={AUTH_ROUTES.HOME}>
            <TypographyH3 className="text-text">PAWPALS</TypographyH3>
          </Link>
        </div>

        <HomeTabs />

        <div className="flex items-center gap-2">
          <Searchbar />

          <DropdownMenu open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
            <Collapsible
              open={isFursonaListOpen}
              onOpenChange={handleFursonaListOpen}
              className="flex"
            >
              {loading ? (
                <Skeleton className="h-8 w-8 rounded-full" />
              ) : (
                <DropdownMenuTrigger>
                  <Avatar size="sm">
                    <AvatarImage
                      src={`${currentFursona?.avatar_url}`}
                      alt={displayName}
                    />

                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
              )}

              <DropdownMenuContent align="end" className="w-60 select-none">
                <DropdownMenuGroup className="flex items-center gap-1">
                  <DropdownMenuItem className="w-full">
                    <Link
                      href={`/@${currentFursona?.username}`}
                      className="flex items-center w-full gap-2"
                    >
                      <Avatar size="default">
                        <AvatarImage
                          src={`${currentFursona?.avatar_url}`}
                          alt={displayName}
                        />

                        <AvatarFallback>
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col">
                        <TypographySmall className="leading-none">
                          {displayName}
                        </TypographySmall>
                        <TypographyXSmall className="text-muted-foreground">
                          {username}
                        </TypographyXSmall>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup className="pb-1">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>

                  {accountMenuGroup.map((li) => {
                    const Icon = li.icon;

                    return (
                      <DropdownMenuItem key={li.label}>
                        <Link
                          href={li.href}
                          className="flex items-center w-full gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          {li.label}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <CollapsibleTrigger className="flex justify-between items-center w-full pr-2 hover:bg-popover">
                    <DropdownMenuLabel>My Fursonas</DropdownMenuLabel>

                    <span>
                      <ChevronDown className="h-4 w-4" />

                      <TypographyP className="sr-only">
                        Switch Fursona
                      </TypographyP>
                    </span>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <DropdownMenuGroup>
                      {fursonas.map((elem) => {
                        const isActive = elem.id === currentFursona?.id;

                        return (
                          <DropdownMenuItem key={elem.id}>
                            {isActive ? (
                              <span className="flex w-full items-center justify-between text-start font-semibold">
                                <TypographySmall>
                                  {elem.display_name}
                                </TypographySmall>

                                <Check className="h-4 w-4" />
                              </span>
                            ) : (
                              <Link
                                href={
                                  isCurrentProfile
                                    ? `/@${elem.username}`
                                    : currentPath
                                }
                                onClick={() =>
                                  void handleSwitchFursona(elem.id)
                                }
                                className={
                                  "flex w-full items-center justify-between text-start font-semibold"
                                }
                              >
                                <TypographySmall>
                                  {elem.display_name}
                                </TypographySmall>

                                {switchingId === elem.id && (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                              </Link>
                            )}
                          </DropdownMenuItem>
                        );
                      })}

                      {!loading && count < 3 ? (
                        <DropdownMenuItem
                          className="mt-2"
                          onClick={() => setCreateFursonaOpen(true)}
                        >
                          <PlusIcon className="h-4 w-4" />
                          Create Fursona
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuGroup>
                  </CollapsibleContent>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </Collapsible>
          </DropdownMenu>
        </div>
      </div>

      <AnimatePresence>
        {isCreateFursonaOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="absolute inset-0 h-svh"
          >
            <CreateFursonaPanelModal
              isOpen={isCreateFursonaOpen}
              onClose={() => setCreateFursonaOpen(false)}
              onSuccess={handleFursonaCreated}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
