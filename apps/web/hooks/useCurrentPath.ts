"use client";
import { usePathname } from "next/navigation";

export function useCurrentPath(path: string) {
  const currentPath = usePathname();

  if (currentPath === (path.startsWith("/") ? path : "/" + path)) {
    return true
  }

  return currentPath
}
