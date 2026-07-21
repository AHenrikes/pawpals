import { Button } from "@repo/ui/button";
import { Kbd } from "@repo/ui/kbd";
import { Separator } from "@repo/ui/separator";
import {
  TypographyMuted,
  TypographyP,
  TypographyXSmall,
} from "@repo/ui/typography";
import { ArrowRightIcon, HistoryIcon } from "lucide-react";

interface Props {
  searchQuery: string;
}

export default function SearchDefault({ searchQuery }: Readonly<Props>) {
  return (
    <>
      {!searchQuery && (
        <div className="flex flex-col h-full gap-6 md:flex-row">
          {/* History Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <TypographyMuted className="text-xs md:text-sm">
                History
              </TypographyMuted>

              <Button
                size={"icon"}
                variant={"ghost"}
                className="py-1 px-2 text-muted-foreground"
              >
                <TypographyXSmall>Clear</TypographyXSmall>
                <HistoryIcon size={14} />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-pulse">
              <div className="space-y-4">
                <div className="h-7 w-full md:w-44 bg-muted rounded" />
                <div className="h-7 w-full md:w-44 bg-muted rounded" />
                <div className="h-7 w-full md:w-44 bg-muted rounded" />
                <div className="h-7 w-full md:w-44 bg-muted rounded" />
              </div>

              <div className="space-y-4">
                <div className="h-7 w-full md:w-44 bg-muted rounded" />
                <div className="h-7 w-full md:w-44 bg-muted rounded" />
                <div className="h-7 w-full md:w-44 bg-muted rounded" />
                <div className="h-7 w-full md:w-44 bg-muted rounded" />
              </div>
            </div>
          </div>

          <Separator
            orientation="horizontal"
            className="hidden w-px md:block"
          />

          {/* Users Section */}
          <div className="space-y-3 md:flex-1">
            <div className="flex justify-between items-center">
              <TypographyMuted className="text-xs md:text-sm">
                Users
              </TypographyMuted>
              <Button
                size={"icon"}
                variant={"ghost"}
                className="p-1 text-muted-foreground"
              >
                <ArrowRightIcon size={16} />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-3 md:space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={`user-col1-${i}`}
                    className="flex gap-2 animate-pulse"
                  >
                    <div className="h-14 w-14 md:h-12 md:w-12 bg-muted rounded-full shrink-0" />

                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-3/4 md:h-4 bg-muted rounded" />
                      <div className="h-5 w-1/2 md:h-4 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 md:space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={`user-col2-${i}`}
                    className="flex gap-2 animate-pulse"
                  >
                    <div className="h-14 w-14 md:h-12 md:w-12 bg-muted rounded-full shrink-0" />

                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-3/4 md:h-4 bg-muted rounded" />
                      <div className="h-5 w-1/2 md:h-4 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator
            orientation="horizontal"
            className="hidden w-px lg:block"
          />

          {/* Tags Section */}
          <div className="space-y-3 md:hidden lg:block lg:w-60">
            <TypographyMuted className="text-xs md:text-sm">
              #Tags
            </TypographyMuted>

            <div className="flex flex-col animate-pulse gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={`tag-${i}`} className="h-7 bg-muted rounded" />
              ))}
            </div>
          </div>

          <Separator
            orientation="horizontal"
            className="hidden w-px xl:block"
          />

          {/* How to Search */}
          <div className="space-y-3 md:hidden xl:block xl:w-85">
            <TypographyMuted className="text-xs md:text-sm">
              How to search:
            </TypographyMuted>

            <div className="text-muted-foreground space-y-2">
              <TypographyP className="text-xs md:text-sm">
                <Kbd className="text-xs">@</Kbd> search for username
              </TypographyP>
              <TypographyP className="text-xs md:text-sm">
                <Kbd className="text-xs">#</Kbd> search for tags
              </TypographyP>
              <TypographyP className="text-xs md:text-sm">
                <Kbd className="text-xs">/</Kbd> search for pages
              </TypographyP>
              <TypographyP className="text-xs md:text-sm">
                <Kbd className="text-xs">!</Kbd> placeholder{" "}
              </TypographyP>
              <TypographyP className="text-xs md:text-sm">
                <Kbd className="text-xs">:</Kbd> placeholder{" "}
              </TypographyP>
              <TypographyP className="text-xs md:text-sm">
                <Kbd className="text-xs">[ ]</Kbd> placeholder{" "}
              </TypographyP>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
