import { redirect } from "next/navigation";

import { AuthHeader } from "@/components/auth/auth-header";
import { SignInForm } from "@/components/auth/sign-in-form";
import { safeNextPath } from "@/lib/auth/paths";
import { getSession } from "@/lib/data/session";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  if (session && !params.error) redirect("/today");

  return (
    <>
      <AuthHeader
        title="Welcome back"
        description="Sign in to open today's page."
      />
      <SignInForm next={safeNextPath(params.next)} googleError={Boolean(params.error)} />
    </>
  );
}
