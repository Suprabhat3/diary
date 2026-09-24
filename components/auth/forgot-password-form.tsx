"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage } from "@/lib/auth/errors";

import { TextField, textControlClass } from "./text-field";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });

    setPending(false);
    if (result.error) {
      setError(
        authErrorMessage(result.error, "Couldn't send the reset email. Try again in a moment."),
      );
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-ink">
          If an account exists for that email, a reset link is on its way. It expires in one hour.
        </p>
        <Link href="/sign-in" className="font-ui text-sm text-ink underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TextField id="email" label="Email">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={textControlClass()}
        />
      </TextField>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="h-11 w-full font-ui" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-ink-muted">
        <Link href="/sign-in" className="text-ink underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
