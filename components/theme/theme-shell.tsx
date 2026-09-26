import type { ReactNode } from "react";

import type { ThemeManifest } from "@/lib/themes/types";

import { ThemeArt } from "./theme-art";

export function ThemeShell({
  theme,
  children,
}: {
  theme: ThemeManifest;
  children: ReactNode;
}) {
  return (
    <div
      data-motion={theme.motion}
      className="theme-enter relative flex min-h-full flex-1 flex-col"
    >
      <ThemeArt />
      {children}
    </div>
  );
}
