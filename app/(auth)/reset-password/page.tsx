import { AuthHeader } from "@/components/auth/auth-header";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";

  return (
    <>
      <AuthHeader
        title="Choose a new password"
        description="This replaces the old one. You'll sign in again afterwards."
      />
      <ResetPasswordForm token={token} invalid={Boolean(params.error)} />
    </>
  );
}
