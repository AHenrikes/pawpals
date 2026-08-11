import Link from "next/link";
import { SidebarTrigger } from "@/providers/SidebarProvider";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { DropdownMenu } from "@repo/ui/dropdown-menu";
import { TypographyH3 } from "@repo/ui/typography";
import { Searchbar } from "@/components/dialogs/search/Searchbar";
import HomeTabs from "./HomeTabs";
import HeaderAvatar from "../avatars/HeaderAvatar";

export default function Header() {
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

          <DropdownMenu>
            <HeaderAvatar  />
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
