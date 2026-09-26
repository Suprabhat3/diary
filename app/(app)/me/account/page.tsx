import Link from "next/link";
import { redirect } from "next/navigation";

import { PageFrame } from "@/components/layout/page-frame";
import { BackupPanel, DeletePanel, GooglePanel, PasswordPanel } from "@/components/profile/account-panels";
import { listLinkedProviders } from "@/lib/data/account";
import { getSession } from "@/lib/data/session";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const providers = await listLinkedProviders();

  return (
    <PageFrame>
      <Link href="/me" className="font-ui text-sm text-ink-muted">
        Me
      </Link>
      <h1 className="mt-2 font-display text-4xl text-ink">Account</h1>
      <p className="mt-2 text-ink-muted">{session.user.email}</p>

      <div className="mt-8 flex flex-col gap-10">
        <PasswordPanel email={session.user.email} hasPassword={providers.includes("credential")} />
        <GooglePanel linked={providers.includes("google")} />
        <BackupPanel />
        <DeletePanel />
      </div>
    </PageFrame>
  );
}
