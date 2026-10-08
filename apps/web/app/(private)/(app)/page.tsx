"use client";

import Link from "next/link";
import { useUser } from "@/providers/UserProvider";
import { Searchbar } from "@/components/modals/search/Searchbar";
import { Button } from "@repo/ui/button";
import { TypographyH1, TypographyP } from "@repo/ui/typography";

export default function Dashboard() {
  const { currentFursona } = useUser();

  return (
    <main className="container flex min-h-[calc(100svh-4rem)] max-w-4xl flex-col items-center justify-center gap-6 py-12 text-center sm:gap-8">
      <div className="space-y-2">
        <TypographyH1 className="text-3xl sm:text-4xl lg:text-5xl">
          Welcome{currentFursona ? `, ${currentFursona.display_name}` : ""}
        </TypographyH1>
        <TypographyP className="text-text-muted">
          Find other fursonas, build your profile, and grow your circle.
        </TypographyP>
      </div>

      <div className="flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
        <Searchbar />
        {currentFursona && (
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/@${currentFursona.username}`}>View my profile</Link>
          </Button>
        )}
      </div>
    </main>
  );
}
