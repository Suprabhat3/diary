import { redirect } from "next/navigation";

import { BottomNav } from "@/components/nav/bottom-nav";
import { ThemeShell } from "@/components/theme/theme-shell";
import { getSession } from "@/lib/data/session";
import { getRequestTheme } from "@/lib/themes/active";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const active = await getRequestTheme();

  return (
    <ThemeShell theme={active.theme}>
      <div className="flex min-h-full flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <BottomNav />
    </ThemeShell>
  );
}
