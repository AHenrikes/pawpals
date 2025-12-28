'use client'
import { useSession } from "@/hooks/useSession"
import { usePathname } from "next/navigation";
import { Button } from "@repo/ui/button";
import Link from "next/link";

type NavLinkProp = { href: string; label: string };

export default function Aside() {
  const currentPath = usePathname();
  const { signOut  } = useSession();

  const navLinks: NavLinkProp[] = [
    {href: "/dashboard", label: "Home"},
    {href: "/inbox", label: "Inbox"},
    {href: "/store", label: "Store"},
    {href: "Map", label: "Map"},
    {href: "Settings", label: "Settings"}
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

        <Button onClick={signOut} size="sm" variant="outline">
          Logout
        </Button>
      </nav>
    </aside>
  )
}