"use client";

import { usePathname } from "next/navigation";

export function useCurrentPath() {
  return usePathname();
}

export function useIsCurrentPath(path: string): boolean {
  const currentPath = useCurrentPath();
  const normalizedPath = path.startsWith("/") ? path : "/" + path;

  return currentPath === normalizedPath;
}
