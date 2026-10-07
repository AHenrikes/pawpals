"use client";

import { Button } from "@repo/ui/button";
import { ArrowLeftIcon, CircleAlertIcon } from "lucide-react";
import { Searchbar } from "../../modals/search/Searchbar";
import { useRouter } from "next/navigation";

export default function ProfileHeader() {
  const router = useRouter();

  return (
    <div className="container absolute inset-x-0 flex justify-between items-center h-16 mx-auto px-2 z-50">
      <Button
        size={"icon-lg"}
        variant={"outline"}
        onClick={() => router.back()}
        className="p-0.5 text-text-muted hover:text-text"
      >
        <ArrowLeftIcon />
      </Button>

      <div className="flex items-center gap-2">
        <Searchbar />

        <Button
          size={"icon-lg"}
          variant={"none"}
          className="text-text-muted hover:text-text"
        >
          <CircleAlertIcon />
        </Button>
      </div>
    </div>
  );
}
