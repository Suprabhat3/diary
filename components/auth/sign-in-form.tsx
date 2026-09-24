"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage } from "@/lib/auth/errors";
import { writeSignupCookie } from "@/lib/auth/signup-cookie";
import {
  isIanaTimezone,
  serializeSignupDetails,
} from "@/lib/auth/signup-details";

import { TextField, textControlClass } from "./text-field";

function rememberDetectedTimezone() {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  writeSignupCookie(
    serializeSignupDetails({
      displayName: null,
      timezone: isIanaTimezone(detected) ? detected : "UTC",
      birthdayMonth: null,
      birthdayDay: null,
      birthdayYear: null,
    }),
  );
}

export function SignInForm({
  next,
  googleError,
}: {
  next: string;
  googleError: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(
    googleError ? "Google sign-in didn't finish. Try again." : null,
  );
  const [pending, setPending] = useState<"email" | "google" | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending("email");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: next,
    });

    if (result.error) {
      setPending(null);
      setError(authErrorMessage(result.error, "Couldn't sign in. Try again."));
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function onGoogle() {
    setError(null);
    setPending("google");
    rememberDetectedTimezone();
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: next,
      errorCallbackURL: "/sign-in",
    });
    if (result.error) {
      setPending(null);
      setError(authErrorMessage(result.error, "Couldn't reach Google. Try again."));
    }
  }

  const busy = pending !== null;

  return (
    <div className="flex flex-col gap-6">
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
        <TextField id="password" label="Password">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            className={textControlClass()}
          />
        </TextField>
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="font-ui text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Forgot password
          </Link>
        </div>
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="h-11 w-full font-ui" disabled={busy}>
          {pending === "email" ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full font-ui"
        disabled={busy}
        onClick={onGoogle}
      >
        {pending === "google" ? "Opening Google…" : "Continue with Google"}
      </Button>

      <p className="text-center text-sm text-ink-muted">
        New here?{" "}
        <Link href="/sign-up" className="text-ink underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
