"use client";

import AvatarWithName from "@/components/avatar-icons/AvatarWithName";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { CircleUserRoundIcon, UserRoundPenIcon } from "lucide-react";

export type EditProfileSection = "account" | "profile" | null;

const sections = [
  {
    id: "account" as const,
    label: "My account",
    description: "Private account details",
    Icon: CircleUserRoundIcon,
  },
  {
    id: "profile" as const,
    label: "Profile",
    description: "Your public fursona",
    Icon: UserRoundPenIcon,
  },
];

type EditProfileAsideProps = {
  activeSection: EditProfileSection;
  onSectionChange: (section: EditProfileSection) => void;
  mobileNavigation?: boolean;
};

export default function SettingsAside({
  activeSection,
  onSectionChange,
  mobileNavigation = false,
}: Readonly<EditProfileAsideProps>) {
  return (
    <aside
      className={cn(
        "h-dvh shrink-0 p-4 bg-surface/35 border-b border-white/10 backdrop-blur-2xl md:w-60 md:border-r md:border-b-0 md:p-6 lg:w-72",
        mobileNavigation && "w-1/2 border-r",
      )}
    >
      <AvatarWithName />

      <div className="my-5 h-px w-full bg-border/40" />

      <nav aria-label="Profile settings">
        <ul className="flex flex-col gap-2">
          {sections.map(({ id, label, description, Icon }) => {
            const isActive = activeSection === id;
            return (
              <li key={id} className="min-w-0 flex-1 md:flex-none">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onSectionChange(id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "h-auto min-h-16 w-full justify-start gap-3 rounded-xl px-3 py-3 text-left",
                    isActive
                      ? "border border-primary/25 bg-primary/15 text-foreground shadow-sm shadow-primary/10 hover:bg-primary/20"
                      : "text-text-muted hover:bg-secondary hover:text-text",
                  )}
                >
                  <Icon className="size-6" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {label}
                    </span>
                    <span
                      className={cn(
                        "hidden truncate text-[0.68rem] font-normal md:block",
                        "text-text-muted",
                      )}
                    >
                      {description}
                    </span>
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
