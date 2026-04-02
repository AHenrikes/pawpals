"use client"
import { AUTH_ROUTES } from "@/lib/auth/routes";
import Link from "next/link";

export default function SignHeader() {
  return (
    <header className="absolute top-0 left-0 w-full h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link
        href={AUTH_ROUTES.HOME}
        className="text-2xl font-bold text-primary md:text-3xl"
      >
        PAWPALL
      </Link>

      <Link
        href="#"
        className="text-md font-medium uppercase tracking-[0.36em]"
      >
        HELP
      </Link>
    </header>
  )
}
