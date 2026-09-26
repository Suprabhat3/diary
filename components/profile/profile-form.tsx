"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { TextField, selectClass, textControlClass } from "@/components/auth/text-field";
import { Button } from "@/components/ui/button";
import { updateProfileAction } from "@/lib/actions/profile";

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

export function ProfileForm({
  displayName,
  timezone,
  birthdayMonth,
  birthdayDay,
  birthdayYear,
  holidayCalendars,
}: {
  displayName: string;
  timezone: string;
  birthdayMonth: number | null;
  birthdayDay: number | null;
  birthdayYear: number | null;
  holidayCalendars: string[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [zone, setZone] = useState(timezone);
  const zones =
    typeof Intl !== "undefined" && "supportedValuesOf" in Intl
      ? Intl.supportedValuesOf("timeZone")
      : ["UTC"];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const month = optionalNumber(form.get("birthdayMonth"));
    const day = optionalNumber(form.get("birthdayDay"));
    const year = optionalNumber(form.get("birthdayYear"));
    if (Number.isNaN(month) || Number.isNaN(day) || Number.isNaN(year)) {
      setPending(false);
      setError("That birthday isn't a real date.");
      return;
    }

    const result = await updateProfileAction({
      displayName: String(form.get("displayName") ?? ""),
      timezone: String(form.get("timezone") ?? ""),
      birthdayMonth: month,
      birthdayDay: day,
      birthdayYear: year,
      holidayCalendars: form.getAll("holiday").map(String),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <TextField id="displayName" label="Name">
        <input
          id="displayName"
          name="displayName"
          defaultValue={displayName}
          autoComplete="nickname"
          className={textControlClass()}
        />
      </TextField>

      <TextField id="timezone" label="Timezone" hint="Today follows this clock.">
        <input
          id="timezone"
          name="timezone"
          list="timezones"
          value={zone}
          onChange={(event) => setZone(event.target.value)}
          className={textControlClass()}
        />
        <datalist id="timezones">
          {zones.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <button
          type="button"
          className="mt-1 text-left font-ui text-sm text-brand"
          onClick={() => setZone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC")}
        >
          Use this device
        </button>
      </TextField>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-ui text-sm text-ink">Birthday</legend>
        <p className="text-sm text-ink-muted">Month and day are enough. Year is optional, and is never used as an age.</p>
        <div className="grid grid-cols-3 gap-2">
          <select name="birthdayMonth" defaultValue={birthdayMonth ?? ""} className={selectClass} aria-label="Birth month">
            <option value="">Month</option>
            {MONTHS.map((label, index) => (
              <option key={label} value={index + 1}>
                {label}
              </option>
            ))}
          </select>
          <select name="birthdayDay" defaultValue={birthdayDay ?? ""} className={selectClass} aria-label="Birth day">
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
          <input
            name="birthdayYear"
            inputMode="numeric"
            placeholder="Year"
            aria-label="Birth year, optional"
            defaultValue={birthdayYear ?? ""}
            className={textControlClass()}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-ui text-sm text-ink">Holiday themes</legend>
        <p className="text-sm text-ink-muted">Off unless you turn a calendar on. You can use both.</p>
        <label className="flex min-h-11 items-center gap-3 text-ink">
          <input
            type="checkbox"
            name="holiday"
            value="international"
            defaultChecked={holidayCalendars.includes("international")}
            className="size-4 accent-[var(--accent)]"
          />
          International
        </label>
        <label className="flex min-h-11 items-center gap-3 text-ink">
          <input
            type="checkbox"
            name="holiday"
            value="india"
            defaultChecked={holidayCalendars.includes("india")}
            className="size-4 accent-[var(--accent)]"
          />
          India
        </label>
      </fieldset>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {saved ? <p className="text-sm text-ink-muted">Saved.</p> : null}

      <Button type="submit" className="font-ui" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

function optionalNumber(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}
