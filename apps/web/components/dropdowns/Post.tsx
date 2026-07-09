import { DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem } from "@repo/ui/dropdown-menu";
import { Button } from "@repo/ui/button";
import { BanIcon, FlagIcon, SendIcon } from "lucide-react";

  const postActions = [
    {label: "Share", key: "share", icon: SendIcon},
    {label: "Block", key: "block", icon: BanIcon},
    {label: "Report", key: "report", icon: FlagIcon}
  ]

export default function PostDropdown() {
  return (
    <DropdownMenuContent align="end" className="p-0 rounded-sm">
      <DropdownMenuGroup>
        {postActions.map(({ label, key, icon }) => { 
          const Icon = icon;

          return (
            <DropdownMenuItem
              key={key}
              asChild
            >
              <Button
                size={"iconPair"}
                variant={"ghost"}
                className="w-full justify-start px-2 rounded-none"
              >
                <Icon size={14} />
                {label}
              </Button>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  )
}
