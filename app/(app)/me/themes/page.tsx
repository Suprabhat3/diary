import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { PageFrame } from "@/components/layout/page-frame";
import { ThemeGallery } from "@/components/profile/theme-gallery";
import { civilNow } from "@/lib/date/civil";
import { ensureProfile } from "@/lib/data/profile";
import { resolveTheme } from "@/lib/themes/resolve";
import { wearableThemes } from "@/lib/themes/registry";
import { WEAR_COOKIE } from "@/lib/themes/wear";

export default async function ThemesPage() {
  const profile = await ensureProfile();
  if (!profile) redirect("/sign-in");

  const today = civilNow(profile.timezone);
  const automatic = resolveTheme(
    {
      birthdayMonth: profile.birthdayMonth,
      birthdayDay: profile.birthdayDay,
      themeMode: "auto",
      lockedThemeId: null,
      holidayCalendars: profile.holidayCalendars,
    },
    today,
  );
  const worn = (await cookies()).get(WEAR_COOKIE)?.value ?? null;

  return (
    <PageFrame>
      <Link href="/me" className="font-ui text-sm text-ink-muted">
        Me
      </Link>
      <h1 className="mt-2 font-display text-4xl text-ink">Themes</h1>
      <p className="mt-2 text-ink-muted">
        Preview a look, wear it for this visit, or lock it so the diary stays that way.
      </p>
      <div className="mt-6">
        <ThemeGallery
          themes={wearableThemes()}
          name={profile.displayName}
          lockedId={profile.themeMode === "locked" ? profile.lockedThemeId : null}
          wornId={profile.themeMode === "locked" ? null : worn}
          automaticId={automatic.id}
        />
      </div>
    </PageFrame>
  );
}
