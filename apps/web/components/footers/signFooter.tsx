import { AUTH_ROUTES } from "@/lib/auth/routes"
import Link from "next/link"

export default function SignFooter() {
  const links = [
    {href: AUTH_ROUTES.PRIVACY_POLICY, label: "PRIVACY POLICY", style: "hover:text-headline"},
    {href: AUTH_ROUTES.TERMS_OF_SERVICE, label: "TERMS OF SERVICE", style: "hover:text-headline"},
    {href: AUTH_ROUTES.SYSTEM_STATUS, label: "SYSTEM STATUS", style: "hover:text-green-400"}
  ]

  return (
    <footer className="absolute bottom-0 left-0 hidden items-center justify-between w-full px-4 py-4 text-[0.62rem] tracking-[0.28em] lg:flex lg:px-8">
      <p className="text-sm uppercase text-primary">
        © 2026 PawPall. All rights reserved.
      </p>

      <div className="flex items-center text-text-muted gap-8 text-xs">
        {links.map((li, idx) => (
          <Link
            key={idx}
            href={li.href}
            className={li.style}
          >
            { li.label }
          </Link>
        ))}
      </div>
    </footer>
  )
}