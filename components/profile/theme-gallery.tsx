"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Motif } from "@/components/theme/motif";
import { lockThemeAction, unlockThemeAction, wearThemeAction } from "@/lib/actions/profile";
import { themeGreeting } from "@/lib/themes/greeting";
import type { ThemeId, ThemeManifest } from "@/lib/themes/types";

export function ThemeGallery({
  themes,
  name,
  lockedId,
  wornId,
  automaticId,
}: {
  themes: ThemeManifest[];
  name: string;
  lockedId: string | null;
  wornId: string | null;
  automaticId: ThemeId;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<ThemeId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const shown = themes.find((theme) => theme.id === preview) ?? null;

  async function run(key: string, action: () => Promise<{ ok: true } | { ok: false; message: string }>) {
    setError(null);
    setPending(key);
    const result = await action();
    setPending(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {lockedId ? (
        <div className="rounded-card border border-line bg-surface-raised p-4">
          <p className="text-ink">A theme is locked, so the whole diary wears it.</p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 font-ui"
            disabled={pending === "unlock"}
            onClick={() => void run("unlock", () => unlockThemeAction())}
          >
            {pending === "unlock" ? "Unlocking…" : "Return to the year"}
          </Button>
        </div>
      ) : wornId ? (
        <div className="rounded-card border border-line bg-surface-raised p-4">
          <p className="text-ink">Wearing a theme for this visit.</p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 font-ui"
            disabled={pending === "unlock"}
            onClick={() => void run("unlock", () => unlockThemeAction())}
          >
            {pending === "unlock" ? "Returning…" : "Return to the year"}
          </Button>
        </div>
      ) : null}

      {shown ? (
        <div data-theme={shown.id} className="rounded-page border border-line bg-surface p-5">
          <Motif id={shown.id} />
          <p className="mt-3 font-ui text-xs uppercase tracking-[0.18em] text-ink-faint">{shown.label}</p>
          <p className="mt-2 font-display text-3xl text-ink">{themeGreeting(shown, name, 20)}</p>
          <p className="mt-2 text-ink-muted">{shown.emptyPrompt}</p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {themes.map((theme) => {
          const locked = lockedId === theme.id;
          const worn = !lockedId && wornId === theme.id;
          const automatic = !lockedId && !wornId && automaticId === theme.id;
          return (
            <li key={theme.id} className="rounded-card border border-line bg-surface-raised p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl text-ink">{theme.label}</h2>
                  <p className="text-sm text-ink-muted">
                    {locked ? "Locked" : worn ? "Wearing now" : automatic ? "Today's automatic theme" : theme.emptyPrompt}
                  </p>
                </div>
                <Motif id={theme.id} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="font-ui" onClick={() => setPreview(theme.id)}>
                  Preview
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="font-ui"
                  disabled={lockedId !== null || pending === `wear-${theme.id}`}
                  onClick={() => void run(`wear-${theme.id}`, () => wearThemeAction(theme.id))}
                >
                  Wear for this visit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="font-ui"
                  disabled={locked || pending === `lock-${theme.id}`}
                  onClick={() => void run(`lock-${theme.id}`, () => lockThemeAction(theme.id))}
                >
                  {locked ? "Locked" : "Always use this"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
