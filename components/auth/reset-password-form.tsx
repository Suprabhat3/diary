"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage } from "@/lib/auth/errors";

import { TextField, textControlClass } from "./text-field";

export function ResetPasswordForm({
  token,
  invalid,
}: {
  token: string;
  invalid: boolean;
}) {
  const [error, setError] = useState<string | null>(
    invalid || !token ? "This reset link is invalid or has expired." : null,
  );
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setError(null);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }

    setPending(true);
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setPending(false);

    if (result.error) {
      setError(authErrorMessage(result.error, "Couldn't update the password. Request a new link."));
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-ink">Password updated. Sign in with the new one.</p>
        <Button asChild className="font-ui">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TextField id="password" label="New password" hint="At least 8 characters.">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          disabled={!token}
          className={textControlClass()}
        />
      </TextField>
      <TextField id="confirm" label="Confirm password">
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          disabled={!token}
          className={textControlClass()}
        />
      </TextField>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="h-11 w-full font-ui" disabled={pending || !token}>
        {pending ? "Updating…" : "Update password"}
      </Button>
      <p className="text-center text-sm text-ink-muted">
        <Link href="/forgot-password" className="text-ink underline-offset-4 hover:underline">
          Request a new link
        </Link>
      </p>
    </form>
  );
}
