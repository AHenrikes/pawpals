import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Button } from "@repo/ui/button";
import { EllipsisVerticalIcon } from "lucide-react";

const profileActions = [
  { label: "Share", key: "share" },
  { label: "Block", key: "block" },
  { label: "Report", key: "report" },
];

export default function ProfileCTA() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size={"icon"}
          variant={"outline"}
          className="p-1.5 text-text-muted hover:text-text"
        >
          <EllipsisVerticalIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="p-0 rounded-sm">
        <DropdownMenuGroup>
          {profileActions.map(({ label, key }) => (
            <DropdownMenuItem key={key} asChild className="flex flex-col">
              <Button
                size={"icon"}
                variant={"ghost"}
                className="w-full rounded-none"
              >
                {label}
              </Button>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
