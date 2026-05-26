"use client";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  TypographyH3,
  TypographySmall,
  TypographyXSmall,
} from "@repo/ui/typography";
import { Button } from "@repo/ui/button";
import Link from "next/link";
import {
  House,
  Menu,
  PawPrint,
  UsersRound,
  MessageCircleQuestion,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  {
    id: "home",
    href: AUTH_ROUTES.PUBLIC_HOME,
    label: "Home",
    icon: House,
    description: "Start here",
  },
  {
    id: "about",
    href: AUTH_ROUTES.ABOUT,
    label: "About",
    icon: MessageCircleQuestion,
    description: "What PawPals is",
  },
  // {
  //   id: "community",
  //   href: AUTH_ROUTES.COMMUNITY,
  //   label: "Community",
  //   icon: UsersRound,
  //   description: "Meet the pack",
  // },
  {
    id: "contactUs",
    href: AUTH_ROUTES.CONTACT_US,
    label: "Contact us",
    icon: UsersRound,
    description: "Get in touch",
  },
];

export default function PublicHeader() {
  const [mobileNav, setMobileNav] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileNav(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileNav) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNav]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto max-w-screen-2xl">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link
            href={AUTH_ROUTES.PUBLIC_HOME}
            className="flex items-center gap-2"
          >
            <PawPrint className="h-8 w-8 text-primary" />
            <TypographyH3 className="m-0">PAWPALS</TypographyH3>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden gap-6 md:flex">
            {navLinks.map((link) => (
              <Link key={link.id} href={link.href}>
                <Button
                  variant={pathname === link.href ? "default" : "ghost"}
                  className="gap-2"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Auth Links - Desktop */}
          <Link className="hidden md:block" href={AUTH_ROUTES.SIGN_IN}>
            <Button variant="outline">Sign In</Button>
          </Link>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileNav(!mobileNav)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mobileNav ? "close" : "open"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {mobileNav ? <X /> : <Menu />}
              </motion.div>
            </AnimatePresence>
          </Button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileNav && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden border-t md:hidden"
            >
              <div className="flex flex-col justify-between min-h-[calc(100svh-64px)] py-6 px-2 sm:px-4">
                <div className="space-y-1">
                  {navLinks.map((link, i) => (
                    <motion.div
                      key={link.id}
                      initial={{ x: -16, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.07, duration: 0.2 }}
                    >
                      <Link href={link.href}>
                        <Button
                          variant={pathname === link.href ? "default" : "ghost"}
                          className="w-full justify-start gap-3 h-14"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                            <link.icon className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col items-start">
                            <TypographySmall>{link.label}</TypographySmall>
                            <TypographyXSmall className="text-muted-foreground">
                              {link.description}
                            </TypographyXSmall>
                          </div>
                        </Button>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ x: -16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: navLinks.length * 0.07, duration: 0.2 }}
                  className="border-t pt-4 mt-2 flex flex-col gap-2"
                >
                  <Link href={AUTH_ROUTES.SIGN_IN}>
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
