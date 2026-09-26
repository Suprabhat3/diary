import { ClearSignupCookie } from "@/components/auth/clear-signup-cookie";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Motif } from "@/components/theme/motif";
import { getActiveTheme } from "@/lib/themes/active";

export default async function TodayPage() {
  const active = await getActiveTheme();

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-6 text-center pad-safe-top pad-safe-bottom">
      <ClearSignupCookie />
      <Motif id={active.theme.id} />
      <p className="font-ui text-xs uppercase tracking-[0.2em] text-ink-faint">
        {active.theme.label}
      </p>
      <h1 className="font-display text-4xl text-balance text-ink">{active.greeting}</h1>
      <p className="max-w-xs text-balance text-ink-muted">{active.theme.emptyPrompt}</p>
      <SignOutButton />
    </main>
  );
}
