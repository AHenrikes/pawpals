import { AUTH_ROUTES } from "@/lib/constants/auth";
import { TypographySmall } from "@repo/ui/typography";
import Link from "next/link";

const footerLinks = [
  {
    id: "privacy-policy",
    href: AUTH_ROUTES.PRIVACY_POLICY,
    label: "PRIVACY POLICY",
    style: "hover:text-headline",
    description: "How do we protect your data?",
  },

  {
    id: "terms-of-service",
    href: AUTH_ROUTES.TERMS_OF_SERVICE,
    label: "TERMS OF SERVICE",
    style: "hover:text-headline",
    description: "Read about our Terms of Service",
  },

  {
    id: "system-status",
    href: AUTH_ROUTES.SYSTEM_STATUS,
    label: "SYSTEM STATUS",
    style: "hover:text-green-400",
    description: "view more about our system uptime",
  },
];

export default function AuthFooter() {
  return (
    <footer className="container py-5 select-none">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <TypographySmall className="uppercase text-center tracking-widest text-primary md:text-left">
          © 2026 PawPals. All rights reserved.
        </TypographySmall>

        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 tracking-widest text-text-muted md:justify-between lg:justify-start">
          {footerLinks.map((li) => (
            <Link
              key={li.id}
              href={li.href}
              className={`text-xs ${li.style} text-center`}
            >
              {li.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
