/**
 * Cookie names Better Auth uses for the session token.
 *
 * Proxy only checks that one of these is present. It must not import the auth
 * server or the database — a present cookie is not proof of a valid session.
 * Secure deployments prefix the name with `__Secure-`.
 */
export const SESSION_COOKIE_CANDIDATES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
] as const;

export function hasSessionCookie(
  get: (name: string) => { value: string } | undefined,
): boolean {
  return SESSION_COOKIE_CANDIDATES.some((name) => {
    const value = get(name)?.value;
    return typeof value === "string" && value.length > 0;
  });
}
