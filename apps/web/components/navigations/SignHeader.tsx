"use client";

import { AUTH_ROUTES } from "@/lib/constants/auth";
import { TypographyH1, TypographyP } from "@repo/ui/typography";
import Link from "next/link";

export default function AuthHeader() {
  return (
    <header className="container">
      <div className="flex h-16 items-center justify-between sm:h-20">
        <Link href={AUTH_ROUTES.SIGN_IN}>
          <TypographyH1 className="text-xl uppercase text-primary sm:text-2xl">
            Pawpals
          </TypographyH1>
        </Link>

        <Link href={AUTH_ROUTES.SIGN_UP}>
          <TypographyP className="uppercase text-text-muted hover:text-text">
            HELP
          </TypographyP>
        </Link>
      </div>
    </header>
  );
}
