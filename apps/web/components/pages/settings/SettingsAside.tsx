"use client";

import AvatarWithName from "@/components/avatar-icons/AvatarWithName";
import HeaderSearchInput from "@/components/navigations/HeaderSearchInput";
import { useUser } from "@/providers/UserProvider";
import { cn } from "@repo/ui/lib/utils";
import {
  BellIcon,
  CircleUserRoundIcon,
  EyeIcon,
  LogOutIcon,
  PaletteIcon,
  UserRoundPenIcon,
} from "lucide-react";
import {
  searchSettings,
  settingsGroups,
  settingsSectionLabel,
  type SettingsSectionId,
} from "./settingsSearch";
import { Button } from "@repo/ui/button";

export type EditProfileSection = SettingsSectionId | null;

const sectionIcons = {
  account: CircleUserRoundIcon,
  profile: UserRoundPenIcon,
  privacy: EyeIcon,
  notifications: BellIcon,
  appearance: PaletteIcon,
};

type Props = {
  activeSection: EditProfileSection;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSectionChange: (section: EditProfileSection) => void;
  onSearchResult: (section: SettingsSectionId, anchor: string) => void;
  mobileNavigation?: boolean;
  inactive?: boolean;
  hiddenOnMobile?: boolean;
};

export default function SettingsAside({
  activeSection,
  searchQuery,
  onSearchQueryChange,
  onSectionChange,
  onSearchResult,
  mobileNavigation = false,
  inactive = false,
  hiddenOnMobile = false,
}: Readonly<Props>) {
  const { signOut } = useUser();
  const searching = searchQuery.trim().length > 0;
  const results = searchSettings(searchQuery);

  return (
    <aside
      inert={inactive}
      className={cn(
        "h-full min-h-0 shrink-0 flex-col overflow-y-auto border-r border-border/40 bg-surface-low px-4 pb-5 pt-6 md:w-64 md:px-5 lg:w-72",
        hiddenOnMobile ? "hidden md:flex" : "flex",
        mobileNavigation && "w-full md:w-64 lg:w-72",
      )}
    >
      <div className="mb-5 rounded-xl border border-border/40 bg-surface p-2">
        <AvatarWithName size="sm" showUserName={false} />
      </div>

      <div className="mb-5 hidden md:block">
        <HeaderSearchInput
          value={searchQuery}
          onChange={onSearchQueryChange}
          placeholder="Search settings"
          mobileOnly={false}
        />
      </div>

      <nav
        aria-label="Settings sections"
        className="flex flex-1 flex-col gap-6"
      >
        {searching ? (
          <div>
            <p className="mb-2 px-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-text-muted">
              Search results
            </p>
            {results.length ? (
              <ul className="space-y-1" aria-label="Settings search results">
                {results.map((result) => {
                  const Icon = sectionIcons[result.section];
                  return (
                    <li key={result.anchor}>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          onSearchResult(result.section, result.anchor)
                        }
                        className="flex min-h-12 w-full justify-start items-center gap-3 rounded-sm px-3 py-2 text-left hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        <Icon
                          className="mt-0.5 size-5 shrink-0 text-text-muted"
                          aria-hidden="true"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-text">
                            {result.title}
                          </span>
                          <span className="block text-xs text-text-muted">
                            {settingsSectionLabel(result.section)}
                          </span>
                        </span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-3 text-sm text-text-muted">No settings found.</p>
            )}
          </div>
        ) : (
          settingsGroups.map((group) =>
            group.items.length > 0 ? (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-text-muted">
                  {group.label}
                </p>

                <ul className="space-y-1.5">
                  {group.items.map(({ id, label }) => {
                    const Icon = sectionIcons[id];
                    return (
                      <li key={id}>
                        <Button
                          variant="ghost"
                          onClick={() => onSectionChange(id)}
                          aria-current={
                            activeSection === id ? "page" : undefined
                          }
                          className={cn(
                            "flex min-h-12 w-full justify-start items-center gap-3 rounded-sm px-3 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                            activeSection === id
                              ? "bg-primary/15 font-semibold text-text ring-1 ring-primary/30"
                              : "text-text-muted hover:bg-secondary hover:text-text",
                          )}
                        >
                          <Icon
                            className="size-5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{label}</span>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null,
          )
        )}
        <div className="mt-auto border-t border-border/40 pt-4">
          <Button
            variant="destructive"
            onClick={() => void signOut()}
            className="flex min-h-12 w-full justify-start items-center gap-3 rounded-sm px-3 bg-transparent text-sm font-medium text-destructive hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive"
          >
            <LogOutIcon className="size-5" aria-hidden="true" />
            Log out
          </Button>
        </div>
      </nav>
    </aside>
  );
}
