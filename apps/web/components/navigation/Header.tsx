"use client";

import Link from "next/link";
import { useState, useMemo, Fragment } from "react";
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
import { Settings, User, ArrowDownUp, PlusIcon } from "lucide-react";
import { CreateFursonaPanelModal } from "@/components/dialogs/CreateFursonaPanelModal";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { AnimatePresence, motion } from "framer-motion";
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
import {
  TypographyH4,
  TypographySmall,
  TypographyXSmall,
} from "@repo/ui/typography";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Header() {
  const { user, fursonas, currentFursona, loading, signOut, refresh } = useUser();
  const [isFursonaListOpen, setIsFursonaListOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateFursonaOpen, setCreateFursonaOpen] = useState(false);
  const router = useRouter();

  const handleFursonaCreated = () => {
    refresh();
    setIsFursonaListOpen(false);
  };

  const displayName = useMemo(() => {
    if (currentFursona?.display_name) {
      return currentFursona.display_name;
    }

    return "Account";
  }, [currentFursona?.display_name]);

  const profileSubtitle =
    currentFursona?.username ?? user?.email ?? "No username";

  function handleMenuOpenChange(nextOpen: boolean) {
    setIsMenuOpen(nextOpen);

    if (!nextOpen) {
      setIsFursonaListOpen(false);
    }
  }

  const accountMenuGroup = [
    { href: `/${currentFursona?.username}`, label: "Fursona", icon: User },
    { href: AUTH_ROUTES.SETTINGS, label: "Settings", icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push(AUTH_ROUTES.SIGN_IN);
    router.refresh();
  };

  const count = fursonas.length;

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-popover bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-full w-full items-center justify-between px-2 md:px-6">
        <div className="flex gap-1 items-center">
          <SidebarTrigger className="border-none" />
          <Link href={AUTH_ROUTES.HOME}>
            <TypographyH4 className="text-primary">PAWPALS</TypographyH4>
          </Link>
        </div>

        <div>
          <DropdownMenu open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
            <Collapsible
              open={isFursonaListOpen}
              onOpenChange={setIsFursonaListOpen}
            >
              <DropdownMenuTrigger asChild>
                {loading ? (
                  <Skeleton className="h-8 w-8 rounded-full" />
                ) : (
                  <Button variant={"none"} className="p-0 focus-visible:ring-0">
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
                )}
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-60 select-none">
                <DropdownMenuGroup className="flex items-center gap-1">
                  <DropdownMenuItem
                    asChild
                    className="flex w-full rounded-none"
                  >
                    <Link href={`/${currentFursona?.username}`}>
                      <Avatar size="sm">
                        <AvatarImage
                          src={`${currentFursona?.avatar_url}`}
                          alt={displayName}
                        />
                        <AvatarFallback>
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>

                      <span className="flex flex-col">
                        <TypographySmall>{displayName}</TypographySmall>
                        <TypographyXSmall>{profileSubtitle}</TypographyXSmall>
                      </span>
                    </Link>
                  </DropdownMenuItem>

                  <CollapsibleTrigger asChild>
                    <Button
                      variant={"none"}
                      className="h-[52px] hover:bg-popover rounded-none"
                    >
                      <ArrowDownUp className="h-5 w-5" />
                      <span className="sr-only">Switch Fursona</span>
                    </Button>
                  </CollapsibleTrigger>
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

                <CollapsibleContent>
                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuLabel>My Fursonas</DropdownMenuLabel>

                    {fursonas.map((elem) => {
                      return (
                        <Fragment key={elem.id}>
                          <DropdownMenuItem>{elem.display_name}</DropdownMenuItem>
                        </Fragment>
                      );
                    })}

                    {count < 3 && (
                      <DropdownMenuItem>
                        <PlusIcon className="h-4 w-4" />
                        <Button
                          variant={"none"}
                          onClick={() => setCreateFursonaOpen(true)}
                          className="p-0 h-fit"
                        >
                          Create Fursona
                        </Button>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                </CollapsibleContent>

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
            transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
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
