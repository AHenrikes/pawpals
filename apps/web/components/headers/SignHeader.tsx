"use client"
import { AUTH_ROUTES } from "@/lib/auth/routes";
import Link from "next/link";

export default function SignHeader() {
  return (
    <header className="absolute top-0 left-0 w-full h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link
        href={AUTH_ROUTES.HOME}
        className="text-headline-md text-primary uppercase"
      >
        Pawpal
      </Link>

      <Link
        href="#"
        className="text-body-lg uppercase"
      >
        Help
      </Link>
    </header>
  )
}
