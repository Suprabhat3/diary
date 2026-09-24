import { ClearSignupCookie } from "@/components/auth/clear-signup-cookie";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ensureProfile } from "@/lib/data/profile";
import { getSession } from "@/lib/data/session";

export default async function TodayPage() {
  const session = await getSession();
  const profile = await ensureProfile();
  const name = profile?.displayName || session?.user.name || "there";

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-6 text-center pad-safe-top pad-safe-bottom">
      <ClearSignupCookie />
      <p className="font-ui text-xs uppercase tracking-[0.2em] text-ink-faint">Today</p>
      <h1 className="font-display text-4xl text-ink">{name}</h1>
      <p className="max-w-xs text-balance text-ink-muted">
        You're signed in. The writing page comes next.
      </p>
      <SignOutButton />
    </main>
  );
}
