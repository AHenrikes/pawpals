"use client";

import { SearchIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@repo/ui/input-group";
import { cn } from "@repo/ui/lib/utils";

export default function HeaderSearchInput({
  value,
  onChange,
  placeholder,
  mobileOnly = true,
  className,
}: Readonly<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  mobileOnly?: boolean;
  className?: string;
}>) {
  return (
    <InputGroup
      className={cn(
        "h-9 overflow-hidden rounded-full border-border transition-[border-color] duration-300 focus-within:border-primary/50",
        mobileOnly ? "md:hidden" : "w-full",
        className,
      )}
    >
      <InputGroupAddon className="bg-background p-2 text-text-muted">
        <SearchIcon aria-hidden="true" className="size-5" />
      </InputGroupAddon>

      <InputGroupInput
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "bg-background p-0 text-text",
          mobileOnly ? "min-w-40" : "min-w-0",
        )}
      />
    </InputGroup>
  );
}
