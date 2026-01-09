'use client'
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { useSession } from "@/hooks/useSession"
import { usePathname } from "next/navigation";
import { Button } from "@repo/ui/button";
import Link from "next/link";

type NavLinkProp = { href: string; label: string };

export default function Aside() {
  const currentPath = usePathname();
  const { signOut  } = useSession();

  const navLinks: NavLinkProp[] = [
    {href: AUTH_ROUTES.HOME, label: "Home"},
    {href: AUTH_ROUTES.STORE, label: "Store"},
    {href: AUTH_ROUTES.PAWSPOT, label: "Pawspot"},
    {href: AUTH_ROUTES.SETTINGS, label: "Settings"}
  ]

  return (
    <aside id="aside" className="py-4">
      <nav className="flex flex-col justify-between h-full">
        <ul>
          {navLinks.map((link) => (
            <li key={link.label} className={link.href === currentPath ? 'current' : undefined}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>

        <Button onClick={ signOut } size="sm" variant="outline">
          Logout
        </Button>
      </nav>
    </aside>
  )
}
