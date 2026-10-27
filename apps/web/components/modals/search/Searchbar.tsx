"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@repo/ui/input-group";
import { SearchIcon } from "lucide-react";
import { type FocusEvent, useEffect, useId, useRef, useState } from "react";
import { Field, FieldLabel } from "@repo/ui/field";
import { Popover, PopoverAnchor } from "@repo/ui/popover";
import SearchModal from "./SearchModal";
import { LockScreen } from "@/lib/helpers/lockBody";

interface SearchbarProps {
  readonly onOpenChange?: (open: boolean) => void;
}

export function Searchbar({ onOpenChange }: SearchbarProps) {
  const inputId = useId();
  const fieldRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const open = isHovered || isFocused;

  useEffect(() => {
    onOpenChange?.(open);
  }, [onOpenChange, open]);

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  LockScreen(open);

  const clearOpenTimer = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  };

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearCloseTimer();
    clearOpenTimer();
    openTimer.current = setTimeout(() => {
      openTimer.current = null;
      setIsHovered(true);
    }, 350);
  };

  const handleModalMouseEnter = () => {
    clearCloseTimer();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    clearOpenTimer();
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setIsHovered(false);
      if (!isFocused) setSearchQuery("");
    }, 150);
  };

  const handleClose = () => {
    clearOpenTimer();
    clearCloseTimer();
    setIsHovered(false);
    setIsFocused(false);
    setSearchQuery("");
    inputRef.current?.blur();
  };

  const isSearchElement = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;

    return (
      fieldRef.current?.contains(target) ||
      Boolean(target.closest('[data-slot="popover-content"]'))
    );
  };

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (isSearchElement(event.relatedTarget)) return;

    setIsFocused(false);
    if (!isHovered) setSearchQuery("");
  };

  return (
    <Popover open={open}>
      <PopoverAnchor asChild>
        <Field
          ref={fieldRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocusCapture={() => {
            clearOpenTimer();
            setIsFocused(true);
          }}
          onBlurCapture={handleBlur}
        >
          <FieldLabel htmlFor={inputId} className="sr-only">
            Search Pawpals
          </FieldLabel>

          <InputGroup className="glass-control h-9 w-10 overflow-hidden border-border rounded-full transition-[background-color,border-color] duration-300 hover:border-primary focus-within:border-primary/50">
            <InputGroupAddon className="p-2 bg-background text-text-muted">
              <SearchIcon aria-hidden="true" className="size-5" />
            </InputGroupAddon>

            <InputGroupInput
              ref={inputRef}
              id={inputId}
              type="search"
              value={searchQuery}
              placeholder="Search..."
              autoComplete="off"
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  handleClose();
                }
              }}
              className="min-w-40 p-0 text-text bg-background backdrop-blur-none"
            />
          </InputGroup>
        </Field>
      </PopoverAnchor>

      <SearchModal
        open={open}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onMouseEnter={handleModalMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocusCapture={() => setIsFocused(true)}
        onBlurCapture={handleBlur}
        onClose={handleClose}
      />
    </Popover>
  );
}
