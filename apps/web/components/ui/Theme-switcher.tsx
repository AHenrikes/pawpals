"use client";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = 16;
  const currentTheme = theme === "system" ? resolvedTheme : theme;

  const setCurrentTheme = () => {
    if (currentTheme === "light") {
      return (
        <Sun key="light" size={ICON_SIZE} className="text-muted-foreground" />
      );
    } else if (currentTheme === "dark") {
      return (
        <Moon key="dark" size={ICON_SIZE} className="text-muted-foreground" />
      );
    } else {
      return (
        <Laptop
          key="system"
          size={ICON_SIZE}
          className="text-muted-foreground"
        />
      );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {setCurrentTheme()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme}>
          <DropdownMenuRadioItem
            value="light"
            onClick={() => setTheme("light")}
          >
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" onClick={() => setTheme("dark")}>
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="system"
            onClick={() => setTheme("system")}
          >
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { ThemeSwitcher };
