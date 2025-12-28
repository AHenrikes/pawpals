"use client";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useState, useEffect } from "react";
import { Button } from "@repo/ui/button";
import { usePathname } from "next/navigation";

type NavLinkProp = { href: string; label: string };

export default function Header() {
  const [userEmail, setUserEmail] = useState<string>("User");
  const { isLoggedIn, loading, error } = useSession();
  const supabase = useSupabaseClient();
  const currentPath = usePathname()

  const btn: NavLinkProp = currentPath === "/sign-in" ? 
  { href: "/sign-up", label: "Sign up" } : { href: "/sign-in", label: "Sign in" };

  const navLinks: NavLinkProp[] = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/community", label: "Community" },
  ];

  useEffect(() => {
    if (isLoggedIn) {
      const fetchUser = async () => {
        const { data } = await supabase.auth.getUser();
        setUserEmail(data?.user?.email ?? "User");
      };
      fetchUser();
    }
  }, [isLoggedIn, supabase]);

  if (loading) { return null }
  if (error) { console.error("Header auth error:", error) }
  

  if (!isLoggedIn) {
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

          <Link id="headerLogo" href="/">
            <h1>PAWPALS</h1>
          </Link>
          
          <Button asChild size="sm" variant="outline">
            <Link href={btn.href}>{btn.label}</Link>
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header>
      <div id="userHeader" className="flex items-center gap-1">
        <h1>
          <Link id="headerLogo" href="/dashboard">
            PAWPALS
          </Link>
        </h1>

        <span className="text-sm">Hey, {userEmail}!</span>
      </div>
    </header>
  );
}
