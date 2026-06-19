"use client";

import Link from "next/link";
import { useState, useMemo, useTransition } from "react";
import { Button } from "@repo/ui/button";
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
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { TypographyH4, TypographySmall } from "@repo/ui/typography";
import { Searchbar } from "@/components/searchbar/Searchbar";
import { useIsCurrentPath, useCurrentPath } from "@/hooks/useCurrentPath";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

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
  const router = useRouter();

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

        // Wait for menu to close
        setTimeout(() => {
          setIsFursonaListOpen(false);
        }, 350)
      }
    });
  };

  const displayName = useMemo(() => {
    if (currentFursona?.display_name) {
      return currentFursona.display_name;
    }

    return "Account";
  }, [currentFursona?.display_name]);

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

  const handleSignOut = async () => {
    await signOut();
    router.push(AUTH_ROUTES.SIGN_IN);
    router.refresh();
  };

  const count = fursonas.length;

  return (
    <header className="sticky top-0 w-full h-16 border-b border-popover bg-background backdrop-blur z-40">
      <div className="mx-auto flex h-full w-full items-center justify-between px-2 md:px-6">
        <div className="flex gap-1 items-center">
          <SidebarTrigger className="border-none" />
          <Link href={AUTH_ROUTES.HOME}>
            <TypographyH4 className="text-primary">PAWPALS</TypographyH4>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Searchbar />

          <DropdownMenu open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
            <Collapsible
              open={isFursonaListOpen}
              onOpenChange={handleFursonaListOpen}
            >
              {loading ? (
                <Skeleton className="h-8 w-8 rounded-full" />
              ) : (
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant={"none"}
                    className="p-0 focus-visible:ring-0"
                  >
                    <Avatar size="sm">
                      <AvatarImage
                        src={`${currentFursona?.avatar_url}`}
                        alt={displayName}
                      />
                      <AvatarFallback>
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
              )}

              <DropdownMenuContent align="end" className="w-60 select-none">
                <DropdownMenuGroup className="flex items-center gap-1">
                  <DropdownMenuItem
                    asChild
                    className="flex w-full rounded-none"
                  >
                    <Link href={`/@${currentFursona?.username}`}>
                      <Avatar size="default">
                        <AvatarImage
                          src={`${currentFursona?.avatar_url}`}
                          alt={displayName}
                        />
                        <AvatarFallback>
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>

                      <TypographySmall>{displayName}</TypographySmall>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup className="pb-1">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>

                  {accountMenuGroup.map((li) => {
                    const Icon = li.icon;

                    return (
                      <DropdownMenuItem key={li.label} asChild>
                        <Link href={li.href}>
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
                      <p className="sr-only">Switch Fursona</p>
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
                                href={ isCurrentProfile ? `/@${elem.username}` : currentPath }
                                onClick={() => void handleSwitchFursona(elem.id) }
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

                      {count < 3 && (
                        <DropdownMenuItem asChild className="mt-2">
                          <Button
                            variant={"outline"}
                            onClick={() => setCreateFursonaOpen(true)}
                            className="h-8 w-full my-2 rounded-full"
                          >
                            <PlusIcon className="h-4 w-4" />
                            Create Fursona
                          </Button>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuGroup>
                  </CollapsibleContent>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuSub>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="h-8 w-full my-2 rounded-full"
                  >
                    <div>
                      <span>Sign out</span>
                    </div>
                  </Button>
                </DropdownMenuSub>
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
