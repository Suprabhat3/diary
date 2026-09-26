"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage } from "@/lib/auth/errors";
import { clearSignupCookie, writeSignupCookie } from "@/lib/auth/signup-cookie";
import {
  isIanaTimezone,
  normalizeBirthday,
  normalizeDisplayName,
  serializeSignupDetails,
  type SignupDetails,
} from "@/lib/auth/signup-details";

import { TextField, selectClass, textControlClass } from "./text-field";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function optionalNumber(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function detailsFromForm(
  form: FormData,
  requireName: boolean,
): { details: SignupDetails } | { error: string } {
  const displayName = normalizeDisplayName(String(form.get("displayName") ?? ""));
  if (requireName && !displayName) {
    return { error: "Add the name you'd like to be greeted by." };
  }
  if (String(form.get("displayName") ?? "").trim() && !displayName) {
    return { error: "Add the name you'd like to be greeted by." };
  }

  const timezone = String(form.get("timezone") ?? "").trim();
  if (!isIanaTimezone(timezone)) {
    return { error: "Enter a timezone like Asia/Kolkata." };
  }

  const month = optionalNumber(form.get("birthdayMonth"));
  const day = optionalNumber(form.get("birthdayDay"));
  const year = optionalNumber(form.get("birthdayYear"));
  if (Number.isNaN(month) || Number.isNaN(day) || Number.isNaN(year)) {
    return { error: "That birthday isn't a real date." };
  }

  const birthday = normalizeBirthday(month, day, year);
  if (!birthday.ok) return { error: birthday.message };

  return {
    details: {
      displayName,
      timezone,
      birthdayMonth: birthday.birthdayMonth,
      birthdayDay: birthday.birthdayDay,
      birthdayYear: birthday.birthdayYear,
    },
  };
}

export function SignUpForm() {
  const router = useRouter();
  const [timezone, setTimezone] = useState(() => {
    if (typeof window === "undefined") return "UTC";
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return detected && isIanaTimezone(detected) ? detected : "UTC";
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"email" | "google" | null>(null);

  function storeDetails(form: HTMLFormElement, requireName: boolean): SignupDetails | null {
    const parsed = detailsFromForm(new FormData(form), requireName);
    if ("error" in parsed) {
      setError(parsed.error);
      return null;
    }
    writeSignupCookie(serializeSignupDetails(parsed.details));
    return parsed.details;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }

    const details = storeDetails(form, true);
    if (!details?.displayName) return;

    setPending("email");
    const result = await authClient.signUp.email({
      name: details.displayName,
      email: String(data.get("email") ?? "").trim(),
      password,
      callbackURL: "/today",
    });

    if (result.error) {
      setPending(null);
      setError(authErrorMessage(result.error, "Couldn't create the account. Try again."));
      return;
    }

    clearSignupCookie();
    router.push("/today");
    router.refresh();
  }

  async function onGoogle(event: React.MouseEvent<HTMLButtonElement>) {
    setError(null);
    const form = event.currentTarget.form;
    if (!form) return;
    const details = storeDetails(form, false);
    if (!details) return;

    setPending("google");
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/today",
      errorCallbackURL: "/sign-in",
    });
    if (result.error) {
      setPending(null);
      setError(authErrorMessage(result.error, "Couldn't reach Google. Try again."));
    }
  }

  const busy = pending !== null;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <TextField id="displayName" label="Name" hint="Used when the diary greets you.">
        <input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          required
          maxLength={80}
          className={textControlClass()}
        />
      </TextField>
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
      <TextField id="password" label="Password" hint="At least 8 characters.">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
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
          className={textControlClass()}
        />
      </TextField>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="font-ui text-sm text-ink">Birthday</legend>
        <p className="text-sm text-ink-muted">
          Optional. Month and day are enough — the year is never used to guess your age.
        </p>
        <div className="grid grid-cols-[1fr_5rem_5.5rem] gap-2">
          <select
            id="birthdayMonth"
            name="birthdayMonth"
            defaultValue=""
            aria-label="Birthday month"
            className={selectClass}
          >
            <option value="">Month</option>
            {MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
          <select
            id="birthdayDay"
            name="birthdayDay"
            defaultValue=""
            aria-label="Birthday day"
            className={selectClass}
          >
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
          <input
            id="birthdayYear"
            name="birthdayYear"
            type="text"
            inputMode="numeric"
            autoComplete="bday-year"
            placeholder="Year"
            aria-label="Birthday year"
            maxLength={4}
            className={textControlClass()}
          />
        </div>
      </fieldset>

      <TextField
        id="timezone"
        label="Timezone"
        hint="Detected from this device. This decides which page is today."
      >
        <input
          id="timezone"
          name="timezone"
          type="text"
          required
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          className={textControlClass()}
        />
      </TextField>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="h-11 w-full font-ui" disabled={busy}>
        {pending === "email" ? "Creating account…" : "Create account"}
      </Button>
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
        Already have an account?{" "}
        <Link href="/sign-in" className="text-ink underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
