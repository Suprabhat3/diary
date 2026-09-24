import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AFTER_AUTH_PATH, isAppPath, isAuthPath } from "@/lib/auth/paths";
import { hasSessionCookie } from "@/lib/auth/session-cookie";

/**
 * Optimistic redirect from cookie presence only.
 *
 * A missing cookie sends someone away from the app. A present cookie sends
 * them away from the auth screens. The cookie is not verified here — every
 * read still goes through `getSession()` in the data layer.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = hasSessionCookie((name) => request.cookies.get(name));

  if (!signedIn && isAppPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (signedIn && isAuthPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = AFTER_AUTH_PATH;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
