import { AUTH_ROUTES } from "@/lib/auth/routes"
import Link from "next/link"

const footerLinks = [
  {
    id: "privacy-policy",
    href: AUTH_ROUTES.PRIVACY_POLICY,
    label: "PRIVACY POLICY",
    style: "hover:text-headline",
    description: "How do we protect your data?"
  },

  {
    id: "terms-of-service",
    href: AUTH_ROUTES.TERMS_OF_SERVICE,
    label: "TERMS OF SERVICE",
    style: "hover:text-headline",
    description: "Read about our Terms of Service"
  },

  {
    id: "system-status",
    href: AUTH_ROUTES.SYSTEM_STATUS,
    label: "SYSTEM STATUS",
    style: "hover:text-green-400",
    description: "view more about our system uptime"
  }
];

export default function SignFooter() {
  return (
    <footer className="absolute bottom-0 left-0 hidden items-center justify-between w-full px-4 py-4 text-[0.62rem] tracking-[0.28em] lg:flex lg:px-8">
      <p className="text-label-md text-primary uppercase">
        © 2026 PawPall. All rights reserved.
      </p>

      <div className="text-label-md flex items-center text-text-muted gap-8">
        {footerLinks.map((li) => (
          <Link
            key={li.id}
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
