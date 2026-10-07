"use client";

import { AUTH_ROUTES } from "@/lib/constants/auth";
import { TypographyH1, TypographyP } from "@repo/ui/typography";
import Link from "next/link";

export default function AuthHeader() {
  return (
    <header className="container px-2 mx-auto">
      <div className="flex items-center justify-between h-20">
        <Link href={AUTH_ROUTES.PUBLIC_HOME}>
          <TypographyH1 className="uppercase text-primary">
            Pawpals
          </TypographyH1>
        </Link>

        <Link href={AUTH_ROUTES.HELP}>
          <TypographyP className="uppercase text-text-muted hover:text-text">
            Help
          </TypographyP>
        </Link>
      </div>
    </header>
  );
}
