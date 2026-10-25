"use client";

import Link from "next/link";
import { useUser } from "@/providers/UserProvider";
import { Searchbar } from "@/components/modals/search/Searchbar";
import { Button } from "@repo/ui/button";
import { TypographyH1, TypographyP } from "@repo/ui/typography";
import {
  ArrowRightIcon,
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";

export default function Dashboard() {
  const { currentFursona } = useUser();

  return (
    <main className="container flex min-h-[calc(100svh-4rem)] max-w-6xl items-center py-10 sm:py-16">
      <section className="glass-panel relative w-full overflow-hidden rounded-4xl p-6 sm:p-10 lg:p-14">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-24 size-72 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 left-1/3 size-80 rounded-full bg-fuchsia-500/10 blur-3xl"
        />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <SparklesIcon className="size-3.5" />
              Your community, your space
            </div>
            <TypographyH1 className="max-w-2xl text-4xl sm:text-5xl lg:text-6xl">
              Welcome{currentFursona ? `, ${currentFursona.display_name}` : ""}
              <span className="text-primary">.</span>
            </TypographyH1>
            <TypographyP className="mt-5 max-w-xl text-text-muted sm:text-lg">
              Discover new fursonas, share what makes yours unique, and grow a
              circle that feels like home.
            </TypographyP>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {currentFursona && (
                <Button asChild size="lg" className="h-11 px-5">
                  <Link href={`/@${currentFursona.username}`}>
                    View my profile <ArrowRightIcon />
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="lg" className="h-11 px-5">
                <Link href="/settings">
                  <SettingsIcon /> Customize profile
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="glass-control rounded-2xl p-5">
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <SearchIcon />
              </div>
              <h2 className="font-display text-lg font-semibold">
                Find your people
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Search the community by name or username.
              </p>
              <div className="mt-4">
                <Searchbar />
              </div>
            </div>
            <Link
              href="/settings"
              className="glass-control group rounded-2xl p-5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/30"
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <UsersIcon />
              </div>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">
                    Make it yours
                  </h2>
                  <p className="mt-1 text-sm text-text-muted">
                    Polish your profile and preferences.
                  </p>
                </div>
                <ArrowRightIcon className="size-5 text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
