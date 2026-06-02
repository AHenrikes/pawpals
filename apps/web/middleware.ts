import { updateSession } from "@repo/supabase/proxy";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/profile/')) {
    const username = pathname.replace('/profile/', '');
    return NextResponse.redirect(new URL(`/@${username}`, request.url));
  }

  if (pathname.startsWith("/@")) {
    const username = pathname.slice(2);
    return NextResponse.rewrite(new URL(`/profile/${username}`, request.url));
  }

  return await updateSession(request);
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
    String.raw`/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)`,
  ],
};
