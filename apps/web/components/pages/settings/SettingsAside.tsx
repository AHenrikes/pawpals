"use client";

import AvatarWithName from "@/components/avatar-icons/AvatarWithName";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { CircleUserRoundIcon, UserRoundPenIcon } from "lucide-react";

export type EditProfileSection = "account" | "profile";

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
};

export default function SettingsAside({
  activeSection,
  onSectionChange,
}: Readonly<EditProfileAsideProps>) {
  return (
    <aside className="space-y-4 border-b border-border/20 p-4 pt-18 md:w-56 md:shrink-0 md:border-r md:border-b-0 lg:w-72">
      <AvatarWithName />

      <div className="w-full h-0.5 bg-muted" />

      <nav aria-label="Profile settings">
        <ul className="flex gap-2 md:flex-col">
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
                    "h-auto w-full justify-start gap-3 px-3 py-7 rounded-md text-left",
                    isActive
                      ? "bg-accent text-white hover:bg-secondary"
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
                        isActive ? "text-white/70" : "text-text-muted",
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
