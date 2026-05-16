"use client"
import { usePathname } from "next/navigation";

export function useCurrentPath(path: string): boolean {
  const currentPath = usePathname();

  return currentPath === (path.startsWith("/") ? path: "/" + path);
}
