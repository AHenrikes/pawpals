"use client"
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { TypographyH1, TypographyP } from "@repo/ui/typography";
import Link from "next/link";

export default function SignHeader() {
  return (
    <header className="container absolute left-0 top-0 right-0 px-2 mx-auto">
      <div className="flex items-center justify-between h-20">
        <Link href={ AUTH_ROUTES.HOME }>
          <TypographyH1 className="uppercase text-primary">
            Pawpal
          </TypographyH1>
        </Link>

        <Link href={ AUTH_ROUTES.HELP }>
          <TypographyP className="uppercase text-text-muted hover:text-text">
            Help
          </TypographyP>
        </Link>
      </div>
    </header>
  )
}
