import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@repo/ui/dropdown-menu";
import { Button } from "@repo/ui/button";

const profileActions = [
  { label: "Share", key: "share" },
  { label: "Block", key: "block" },
  { label: "Report", key: "report" },
];

export default function ProfileDropdown() {
  return (
    <DropdownMenuContent align="end" className="p-0 rounded-sm">
      <DropdownMenuGroup>
        {profileActions.map(({ label, key }) => (
          <DropdownMenuItem key={key} asChild className="flex flex-col">
            <Button
              size={"iconPair"}
              variant={"ghost"}
              className="w-full rounded-none"
            >
              {label}
            </Button>
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}
