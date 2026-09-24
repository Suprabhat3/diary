import { redirect } from "next/navigation";

import { AuthHeader } from "@/components/auth/auth-header";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getSession } from "@/lib/data/session";

export default async function ForgotPasswordPage() {
  const session = await getSession();
  if (session) redirect("/today");

  return (
    <>
      <AuthHeader
        title="Reset password"
        description="We'll email you a link. It expires in one hour."
      />
      <ForgotPasswordForm />
    </>
  );
}
