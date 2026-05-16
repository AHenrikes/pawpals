"use client";

import { useUser } from "@/providers/UserProvider";
import { Button } from "@repo/ui/button";
import { Separator } from "@repo/ui/separator" 
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { TypographyH2, TypographyLead, TypographySmall, TypographyXSmall } from "@repo/ui/typography";
import { CircleAlert } from "lucide-react";
import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import useSocial from "@/hooks/useSocial";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatNumbers(count: number): string {
  if (count < 1000) return `${count}`;

  const units = ['K', 'M', 'B', 'T'];
  const tier = Math.floor(Math.log10(count) / 3) - 1;

  const suffix = units[tier];
  const scale = Math.pow(1000, tier + 1);

  const scaled = count / scale;

  return `${scaled.toFixed(scaled % 1 === 0 ? 0 : 1)}${suffix}`;
}

export default function Profile() {
  const { currentFursona } = useUser();
  const { followingCount, followersCount, likesCount } = useSocial();

  const profileNav = [
    {href: "#", label: "POST"},
    {href: "#", label: "REPOST"},
    {href: "#", label: "ARCHIVE"},
    {href: "#", label: "LIKE"}
  ]

  return (
    <>
      {/* Banner */}
      <div className="relative w-full h-64 sm:h-96 md:h-[500px]">
        {(currentFursona?.banner_url) && (
          <Image 
            src={`${currentFursona?.banner_url}`}
            alt={`${currentFursona.display_name}s banner`}
            quality={100}
            fill
            className="object-cover z-10"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black z-20" />
        <div className="flex place-content-end p-2 sm:p-4 z-30">
          <Button variant="outline" size="sm" className="sm:size-auto">
            <CircleAlert className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      {/* Profile header section */}
      <section className="px-2 mb-4 sm:container sm:mx-auto md:px-4">
        <div className="relative -mt-16 sm:-mt-20 md:-mt-24 z-20">
          {/* Avatar */}
          <div className="flex items-center justify-between">
            <div>
              <Avatar size="lg" className="h-32 w-32 sm:h-36 sm:w-36 md:h-44 md:w-44 lg:h-48 lg:w-48 border-4 border-background shadow-lg flex-shrink-0">
                <AvatarImage src={`${currentFursona?.avatar_url}`} alt={currentFursona?.display_name} />
                <AvatarFallback>{getInitials(currentFursona?.display_name || "Profile")}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 mb-4">
                <TypographyH2 className="text-xl sm:text-2xl truncate">{currentFursona?.display_name || "Profile"}</TypographyH2>
                <TypographySmall className="text-muted-foreground">@{currentFursona?.username || "username"}</TypographySmall>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">Message</Button>
              <Button size="sm" className="flex-1 sm:flex-none">Follow</Button>
            </div>
          </div>

          {/* Profile info */}
          <div className="flex-1 w-full pb-0 space-y-6">
            <TypographyXSmall className="text-muted-foreground">
              {currentFursona?.bio || "Empty!"}
            </TypographyXSmall> 

            <div className="flex gap-3 sm:gap-6 justify-start">
              <div className="text-center">
                <TypographyLead className="font-bold text-lg sm:text-xl">{ formatNumbers(followingCount) }</TypographyLead>
                <TypographyXSmall className="text-muted-foreground text-xs">Following</TypographyXSmall>
              </div>

              <div className="text-center">
                <TypographyLead className="font-bold text-lg sm:text-xl">{ formatNumbers(followersCount) }</TypographyLead>
                <TypographyXSmall className="text-muted-foreground text-xs">Followers</TypographyXSmall>
              </div>

              <div className="text-center">
                <TypographyLead className="font-bold text-lg sm:text-xl">{ formatNumbers(likesCount) }</TypographyLead>
                <TypographyXSmall className="text-muted-foreground text-xs">Likes</TypographyXSmall>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sm:container sm:mx-auto">
        <div className="flex">
          <main className="flex-1">
            <header>
              <nav className="space-y-1 sm:space-y-2">
                <ul className="flex flex-wrap gap-2 sm:gap-0">
                  {profileNav.map(({href, label}, idx) => {
                    return (
                      <Fragment key={idx}>
                        <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
                          <Link href={href}>
                            {label}
                          </Link>
                        </Button>
                      </Fragment>
                    )
                  })}
                </ul>

                <Separator className="h-[.5px]" />
              </nav>
            </header>
          </main>
        </div>
      </section>

    </>
  );
}
