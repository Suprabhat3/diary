import { redirect } from "next/navigation";

import { AuthHeader } from "@/components/auth/auth-header";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getSession } from "@/lib/data/session";

export default async function SignUpPage() {
  const session = await getSession();
  if (session) redirect("/today");

  return (
    <>
      <AuthHeader
        title="Create your diary"
        description="One account. One page a day. Just for you."
      />
      <SignUpForm />
    </>
  );
}
