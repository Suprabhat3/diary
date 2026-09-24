import { AuthHeader } from "@/components/auth/auth-header";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <>
      <AuthHeader
        title="Choose a new password"
        description="This replaces the old one. You'll sign in again afterwards."
      />
      <ResetPasswordForm token={token} invalid={false} />
    </>
  );
}
