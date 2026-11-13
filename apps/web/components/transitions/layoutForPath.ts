// Keep this map aligned with the route groups in app/(private).
export type PrivateLayout = "app" | "return";

export function layoutForPath(pathname: string): PrivateLayout | null {
  if (pathname === "/" || pathname === "/messages") return "app";

  if (
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname.startsWith("/messages/") ||
    pathname.startsWith("/@") ||
    pathname.startsWith("/profile/")
  ) {
    return "return";
  }

  return null;
}

export function changesPrivateLayout(from: string, to: string): boolean {
  const source = layoutForPath(from);
  const destination = layoutForPath(to);
  return source !== null && destination !== null && source !== destination;
}

export function isProfilePath(pathname: string): boolean {
  return pathname.startsWith("/@") || pathname.startsWith("/profile/");
}

export function shouldTransition(from: string, to: string): boolean {
  if (
    from === to ||
    layoutForPath(from) === null ||
    layoutForPath(to) === null
  ) {
    return false;
  }

  return (
    changesPrivateLayout(from, to) || isProfilePath(from) || isProfilePath(to)
  );
}
