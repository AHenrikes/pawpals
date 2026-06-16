"use client";

import { usePathname } from "next/navigation";

/**
 * Check if the given path is the current path
 * @param path - The path to check against (with or without leading slash)
 * @returns true if the path matches the current pathname
 */
export function useIsCurrentPath(path: string): boolean {
  const currentPath = usePathname();
  const normalizedPath = path.startsWith("/") ? path : "/" + path;
  return currentPath === normalizedPath;
}

/**
 * Get the current pathname
 * @returns The current pathname from the router
 */
export function useCurrentPath(): string {
  return usePathname();
}
