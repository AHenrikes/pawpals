import { useFollow } from "@/hooks/social/followers/useFollow";
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@repo/ui/dropdown-menu";
import {
  BanIcon,
  BookmarkIcon,
  EyeOffIcon,
  FlagIcon,
  Share2Icon,
  UserRoundMinusIcon,
  UserRoundPlusIcon,
  VolumeOffIcon,
} from "lucide-react";

export default function PostDropdown({
  contentId,
  userId,
}: Readonly<{ contentId: string; userId: string }>) {
  const { isFollowing, toggle } = useFollow(userId);

  if (contentId === null) return;

  const postActions = [
    {
      variant: undefined,
      actions: [
        {
          label: isFollowing ? "Unfollow" : "Follow",
          key: "follow",
          icon: isFollowing ? UserRoundMinusIcon : UserRoundPlusIcon,
          action: () => {
            void toggle();
          },
        },
      ],
    },

    {
      variant: undefined,
      actions: [
        {
          label: "Share",
          key: "share",
          icon: Share2Icon,
          action: () => {
            void toggle();
          },
        },
        {
          label: "Bookmark",
          key: "bookmark",
          icon: BookmarkIcon,
          action: () => {
            void toggle();
          },
        },
      ],
    },

    {
      variant: undefined,
      actions: [
        {
          label: "Hide post",
          key: "hide",
          icon: EyeOffIcon,
          action: () => {
            void toggle();
          },
        },
        {
          label: "Mute user",
          key: "mute",
          icon: VolumeOffIcon,
          action: () => {
            void toggle();
          },
        },
      ],
    },

    {
      variant: "destructive",
      actions: [
        {
          label: "Block user",
          key: "block",
          icon: BanIcon,
          action: () => {
            void toggle();
          },
        },
        {
          label: "Report post",
          key: "report",
          icon: FlagIcon,
          action: () => {
            void toggle();
          },
        },
      ],
    },
  ] as const;

  return (
    <DropdownMenuContent align="end" className="p-0 rounded-sm">
      {postActions.map(({ variant, actions }, groupIndex) => (
        <DropdownMenuGroup key={groupIndex}>
          {/* <DropdownMenuLabel>User</DropdownMenuLabel> */}
          {actions.map(({ label, key, icon: Icon, action }) => (
            <DropdownMenuItem
              key={key}
              asChild
              variant={variant}
              onClick={action}
            >
              <span>
                <Icon size={14} />
                {label}
              </span>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
        </DropdownMenuGroup>
      ))}
    </DropdownMenuContent>
  );
}
