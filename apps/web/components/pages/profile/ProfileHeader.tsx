import { Button } from "@repo/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { Searchbar } from "../../dialogs/search/Searchbar";
import { useRouter } from "next/navigation";
import HeaderAvatar from "../../avatars/HeaderAvatar";
import { DropdownMenu } from "@repo/ui/dropdown-menu";

export default function ProfileHeader() {
  const router = useRouter();

  return (
    <div className="absolute top-0 left-0 flex justify-between items-center w-full h-16 px-2 bg-linear-to-b from-background via-transparent to-transparent backdrop-blur-blur z-30 md:px-6">
      <Button
        size={"icon-lg"}
        variant={"outline"}
        onClick={() => router.back()}
        className="p-1 text-text-muted hover:text-text"
      >
        <ArrowLeftIcon size={24} />
      </Button>

      <div className="flex items-center gap-2">
        <Searchbar />

        <DropdownMenu>
          <HeaderAvatar />
        </DropdownMenu>
      </div>
    </div>
  );
}
