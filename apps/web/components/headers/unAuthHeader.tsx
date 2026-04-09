"use client";

import { AUTH_ROUTES } from "@/lib/auth/routes";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  House,
  Menu,
  PawPrint,
  UsersRound,
  MessageCircleQuestion,
  X,
} from "lucide-react";
import { Button } from "@repo/ui/button";

const navLinks = [
  {
    id: "home",
    href: AUTH_ROUTES.HOME,
    label: "Home",
    icon: House,
    description: "Start here",
  },
  {
    id: "about",
    href: AUTH_ROUTES.ABOUT,
    label: "About",
    icon: MessageCircleQuestion,
    description: "What PawPall is",
  },
  {
    id: "community",
    href: AUTH_ROUTES.COMMUNITY,
    label: "Community",
    icon: UsersRound,
    description: "Meet the pack",
  },
];

export default function UnAuthHeader() {
  const [mobileNav, setMobileNav] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!mobileNav) { return }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNav(false);
      }
    };

    globalThis.addEventListener("keydown", handleEscape);

    return () => { 
      document.body.style.overflow = previousOverflow; 
      globalThis.removeEventListener("keydown", handleEscape);
    };
  }, [mobileNav]);

  useEffect(() => { setMobileNav(false) }, [pathname]);

  const activeLinkClass = "text-text-foreground shadow-[0_14px_34px_rgba(18,8,26,0.12)]";

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-4 lg:px-8">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between rounded-full border border-white/10 bg-[hsl(var(--surface-variant)/0.72)] px-3 shadow-[0_22px_50px_rgba(18,8,26,0.16)] backdrop-blur-xl">
        <Link
          href={AUTH_ROUTES.HOME}
          className="flex items-center gap-3 rounded-full px-2 py-1 transition-transform hover:scale-[1.01]"
          aria-label="PawPall home"
        >
          <span className=" flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--surface-container-highest)/0.9)] text-[hsl(var(--primary-dim))] shadow-inner shadow-white/20">
            <PawPrint size={18} />
          </span>

          <span className="text-title-md uppercase">
            Pawpal

            {pathname === "/" ? (
              <p className="text-text-muted text-xs">/HOME</p>
            ) : (
              <p className="text-text-muted text-xs">{pathname}</p>
            )}
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.id}
                href={link.href}
                className={
                  `text-body-lg flex items-center gap-2 rounded-full px-4 py-2 transition-all 
                  ${isActive ? activeLinkClass : "text-muted-foreground border border-transparent hover:border hover:border-primary"}`
                }
              >
                <link.icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="none"
            size="sm"
            className="pawpal-cta hidden md:flex text-sm"
          >
            <Link href={AUTH_ROUTES.SIGN_IN}>Sign in</Link>
          </Button>

          <Button
            type="button"
            variant="none"
            size="icon"
            className="rounded-full md:hidden hover:bg-secondary"
            onClick={() => setMobileNav(true)}
            aria-expanded={mobileNav}
            aria-controls="primary-mobile-nav"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </Button>
        </div>
      </div>

      {mobileNav && (
        <div className="fixed inset-0 z-[60] md:hidden" id="primary-mobile-nav">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-[hsl(var(--background)/0.66)] backdrop-blur-sm"
            onClick={() => setMobileNav(false)}
          />

          <div className="absolute inset-x-4 top-20 rounded-[2rem] border border-white/10 bg-[hsl(var(--surface-container-low)/0.96)] p-4 shadow-[0_28px_80px_rgba(18,8,26,0.28)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--surface-container-highest)/0.9)] text-[hsl(var(--primary-dim))]">
                  <PawPrint size={18} />
                </span>

                <div>
                  <p className="font-display text-lg font-extrabold tracking-[0.2em] text-headline uppercase">
                    Pawpal
                  </p>
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                    navigate
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setMobileNav(false)}
                aria-label="Close navigation menu"
              >
                <X size={18} />
              </Button>
            </div>

            <div className="mt-4 grid gap-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    className={
                      `flex items-center justify-between rounded-[1.5rem] px-4 py-4 transition-all 
                      ${ isActive ? activeLinkClass : "text-muted-foreground border border-transparent hover:border hover:border-primary" }`
                    }
                  >
                    <span className="flex items-center gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--background)/0.7)] text-[hsl(var(--primary-dim))]">
                        <link.icon size={18} />
                      </span>

                      <span className="flex flex-col">
                        <span className="text-base font-semibold">
                          {link.label}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {link.description}
                        </span>
                      </span>
                    </span>

                    <ArrowRight size={16} className="text-muted-foreground" />
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-[1.5rem] bg-[hsl(var(--surface-container-highest)/0.65)] p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  Already have an account?
                </p>
                <p className="text-sm text-muted-foreground">
                  Jump back in from here.
                </p>
              </div>

              <Button asChild className="rounded-full px-5">
                <Link href={AUTH_ROUTES.SIGN_IN}>Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}