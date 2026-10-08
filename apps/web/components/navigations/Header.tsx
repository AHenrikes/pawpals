import Link from "next/link";
import { SidebarTrigger } from "@/providers/SidebarProvider";
import { AUTH_ROUTES } from "@/lib/constants/auth";
import { TypographyH1 } from "@repo/ui/typography";
import { Searchbar } from "@/components/modals/search/Searchbar";
import HeaderAvatar from "../avatar-icons/HeaderAvatar";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b border-border/20 bg-background/75 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-2 md:px-6">
        <div className="flex gap-1 items-center">
          <SidebarTrigger className="border-none" />

          <Link href={AUTH_ROUTES.HOME}>
            <TypographyH1 className="text-lg text-text sm:text-xl md:text-2xl">
              PAWPALS
            </TypographyH1>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Searchbar />

          <HeaderAvatar />
        </div>
      </div>
    </header>
  );
}
