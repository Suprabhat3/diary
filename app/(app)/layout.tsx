import { redirect } from "next/navigation";

import { ThemeShell } from "@/components/theme/theme-shell";
import { getSession } from "@/lib/data/session";
import { getActiveTheme } from "@/lib/themes/active";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const active = await getActiveTheme();

  return <ThemeShell theme={active.theme}>{children}</ThemeShell>;
}
