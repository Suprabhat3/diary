import { existsSync } from "node:fs";
import { join } from "node:path";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import type { ThemeManifest } from "@/lib/themes/types";

import { ThemeArt } from "./theme-art";

function artFile(themeId: string, name: string): string | null {
  const file = join(process.cwd(), "public", "themes", themeId, name);
  return existsSync(file) ? `/themes/${themeId}/${name}` : null;
}

export async function ThemeShell({
  theme,
  children,
}: {
  theme: ThemeManifest;
  children: ReactNode;
}) {
  const pathname = (await headers()).get("x-diary-path") ?? "";

  return (
    <div
      data-motion={theme.motion}
      className="theme-enter relative flex min-h-full flex-1 flex-col"
    >
      <ThemeArt
        lightAvif={artFile(theme.id, "bg-light.avif")}
        darkAvif={artFile(theme.id, "bg-dark.avif")}
        lightWebp={artFile(theme.id, "bg-light.webp")}
        darkWebp={artFile(theme.id, "bg-dark.webp")}
        priority={pathname === "/today"}
      />
      {children}
    </div>
  );
}
