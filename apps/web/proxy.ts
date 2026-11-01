import { updateSession } from "@repo/supabase/proxy";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const sessionResponse = await updateSession(request);
  if (sessionResponse.status >= 300 && sessionResponse.status < 400) {
    return sessionResponse;
  }

  let aliasResponse: NextResponse | null = null;
  if (pathname.startsWith("/profile/")) {
    const username = pathname.replace("/profile/", "");
    const destination = request.nextUrl.clone();
    destination.pathname = `/@${username}`;
    aliasResponse = NextResponse.redirect(destination);
  }

  if (pathname.startsWith("/@")) {
    const username = pathname.slice(2);
    const destination = request.nextUrl.clone();
    destination.pathname = `/profile/${username}`;
    aliasResponse = NextResponse.rewrite(destination, { request });
  }

  if (!aliasResponse) return sessionResponse;
  for (const cookie of sessionResponse.cookies.getAll()) {
    aliasResponse.cookies.set(cookie);
  }
  return aliasResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/api/media/:path*",
  ],
};
