import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { PageFrame } from "@/components/layout/page-frame";
import { ProfileForm } from "@/components/profile/profile-form";
import { ensureProfile } from "@/lib/data/profile";
import { getSession } from "@/lib/data/session";

export default async function MePage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const profile = await ensureProfile();
  if (!profile) redirect("/sign-in");

  return (
    <PageFrame>
      <h1 className="font-display text-4xl text-ink">Me</h1>
      <p className="mt-2 text-ink-muted">{session.user.email}</p>

      <nav className="mt-6 flex flex-col gap-2 font-ui text-sm">
        <Link href="/me/themes" className="text-brand">
          Themes
        </Link>
        <Link href="/me/account" className="text-brand">
          Account, backup, delete
        </Link>
      </nav>

      <div className="mt-8">
        <ProfileForm
          displayName={profile.displayName}
          timezone={profile.timezone}
          birthdayMonth={profile.birthdayMonth}
          birthdayDay={profile.birthdayDay}
          birthdayYear={profile.birthdayYear}
          holidayCalendars={profile.holidayCalendars}
        />
      </div>

      <section className="mt-10 border-t border-line pt-6">
        <h2 className="font-display text-2xl text-ink">On your phone</h2>
        <p className="mt-2 text-ink-muted">
          Android can install Diary from the browser menu. On iPhone, open Share and choose Add to Home
          Screen. The installed app needs a connection to read and write.
        </p>
      </section>

      <div className="mt-8">
        <SignOutButton />
      </div>
    </PageFrame>
  );
}
