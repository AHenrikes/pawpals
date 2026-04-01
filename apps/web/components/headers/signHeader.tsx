"use client"
import { AUTH_ROUTES } from "@/lib/auth/routes";
import Link from "next/link";

export default function SignHeader() {
  return (
    <header className="absolute top-0 left-0 flex justify-between items-center w-full h-20 px-4">
      <Link
        href={AUTH_ROUTES.HOME}
        className="text-primary text-3xl duration-200 hover:delay-150 hover:text-"
      >
        PAWPAL
      </Link>

      <div className="flex gap-4 items-center">
        <Link
          href="#"
          className="text-gray-400 duration-200 hover:delay-150 hover:text-gray-200"
        >
          HELP
        </Link>
      </div> 
    </header>
  )
}
