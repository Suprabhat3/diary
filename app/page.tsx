import { Button } from "@/components/ui/button";

/**
 * Phase 0 placeholder.
 *
 * It exists to prove the foundation end to end: the token contract resolves,
 * the shadcn bridge is themed, and both fonts load. Phase 3 replaces this
 * route with a redirect to today's page.
 */
export default function Page() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-ui text-xs uppercase tracking-[0.2em] text-ink-faint">
        Phase 0 · Foundation
      </p>

      <h1 className="font-display text-4xl text-ink">Diary</h1>

      <p className="max-w-xs text-balance text-ink-muted">
        A private daily diary. One page per day, just for you.
      </p>

      <div className="flex items-center gap-3">
        <span className="size-3 rounded-full bg-brand" />
        <span className="font-ui text-sm text-ink-muted">
          theme tokens resolving
        </span>
      </div>

      <Button variant="outline" className="font-ui" disabled>
        Nothing to open yet
      </Button>
    </main>
  );
}
