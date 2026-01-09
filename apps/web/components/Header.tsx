"use client";
import Link from "next/link";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@repo/ui/button";

type NavLinkProp = { href: string; label: string };

export function Header() {
  const currentPath = usePathname()
  const btn: NavLinkProp = currentPath === AUTH_ROUTES.SIGNIN ? 

  { href: AUTH_ROUTES.SIGNUP, label: "Sign up" } : { href: AUTH_ROUTES.SIGNIN, label: "Sign in" };

  const navLinks: NavLinkProp[] = [
    { href: AUTH_ROUTES.HOME, label: "Home" },
    { href: AUTH_ROUTES.ABOUT, label: "About" },
    { href: AUTH_ROUTES.COMMUNITY, label: "Community" },
  ];

  return (
    <header>
      <div id="header">
        <nav>
          <ul>
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link id="headerLogo" href={AUTH_ROUTES.HOME}>
          <h1>PAWPALS</h1>
        </Link>
        
        <Button asChild size="sm" variant="outline">
          <Link href={btn.href}>{btn.label}</Link>
        </Button>
      </div>
    </header>
  );
}

export function AuthHeader() {
  const [userEmail, setUserEmail] = useState<string>("User");
  const supabase = useSupabaseClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data?.user?.email ?? "User");
    };

    fetchUser();
  }, [supabase]);

  return (
    <header>
      <div id="userHeader" className="flex items-center gap-1">
        <h1>
          <Link id="headerLogo" href={AUTH_ROUTES.HOME}>
            PAWPALS
          </Link>
        </h1>

        <span className="text-sm">Hey, {userEmail}!</span>
      </div>
    </header>
  );
}
