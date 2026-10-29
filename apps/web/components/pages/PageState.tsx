"use client";

import Link from "next/link";
import { Button } from "@repo/ui/button";
import { ArrowRightIcon, HouseIcon, SearchXIcon } from "lucide-react";

type PageStateProps = {
  title?: string;
  description?: string;
  error?: boolean;
  onRetry?: () => void;
};

export default function PageState({
  title = "This page couldn't be found",
  description = "The link may be broken, or the page may have moved.",
  error = false,
  onRetry,
}: PageStateProps) {
  return (
    <main className="container flex min-h-svh items-center justify-center px-4 py-24">
      <section className="glass-panel relative w-full max-w-2xl overflow-hidden rounded-4xl p-8 text-center sm:p-12">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-20 size-64 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <SearchXIcon aria-hidden="true" className="size-8" />
        </div>
        <p className="relative mb-3 text-sm font-semibold tracking-[0.2em] text-primary uppercase">
          {error ? "Something went wrong" : "404 · Page not found"}
        </p>
        <h1 className="relative font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
          {title}
        </h1>
        <p className="relative mx-auto mt-4 max-w-md text-text-muted">
          {description}
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          {onRetry && (
            <Button onClick={onRetry}>
              Try again <ArrowRightIcon aria-hidden="true" />
            </Button>
          )}
          <Button asChild variant={onRetry ? "outline" : "default"}>
            <Link href="/">
              <HouseIcon aria-hidden="true" /> Go home
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
