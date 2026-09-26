/** Where a signed-in person lands until the writing surface exists. */
export const AFTER_AUTH_PATH = "/today";

const APP_PREFIXES = ["/today", "/day", "/calendar", "/search", "/me"];

/**
 * Auth screens that should bounce a person who already has a session cookie.
 * Reset stays reachable so a reset link still works if a session is present.
 */
const AUTH_PREFIXES = ["/sign-in", "/sign-up", "/forgot-password"];

export function isAppPath(pathname: string): boolean {
  return APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAuthPath(pathname: string): boolean {
  return AUTH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Auth screens stay on the neutral paper theme, including password reset. */
export function isNeutralChromePath(pathname: string): boolean {
  return (
    isAuthPath(pathname) ||
    pathname === "/reset-password" ||
    pathname.startsWith("/reset-password/")
  );
}

/**
 * Only same-origin paths. A `next` value of `//evil.example` or a scheme
 * would otherwise walk someone off the site after sign-in.
 */
export function safeNextPath(value: string | string[] | undefined): string {
  const path = Array.isArray(value) ? value[0] : value;
  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    path.includes("://")
  ) {
    return AFTER_AUTH_PATH;
  }
  return path;
}
