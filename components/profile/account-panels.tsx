"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { TextField, textControlClass } from "@/components/auth/text-field";
import { Button } from "@/components/ui/button";
import { deleteAccountAction } from "@/lib/actions/account";
import {
  exportJsonAction,
  exportMarkdownAction,
  importDiaryAction,
  previewImportAction,
} from "@/lib/actions/backup";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage } from "@/lib/auth/errors";
import { DELETE_PHRASE } from "@/lib/account/phrase";

function downloadBase64(filename: string, mime: string, base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function PasswordPanel({ email, hasPassword }: { email: string; hasPassword: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!hasPassword) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl text-ink">Password</h2>
        <p className="text-ink-muted">You sign in with Google. A reset email can add a password to this same account.</p>
        {note ? <p className="text-sm text-ink-muted">{note}</p> : null}
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="font-ui"
          disabled={pending}
          onClick={() => {
            setPending(true);
            setError(null);
            void authClient
              .requestPasswordReset({ email, redirectTo: "/reset-password" })
              .then((result) => {
                setPending(false);
                if (result.error) {
                  setError(authErrorMessage(result.error, "Couldn't send the email."));
                  return;
                }
                setNote("Check your email for a link to choose a password.");
              });
          }}
        >
          {pending ? "Sending…" : "Email me a password link"}
        </Button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-2xl text-ink">Password</h2>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setNote(null);
          setPending(true);
          const formElement = event.currentTarget;
          const form = new FormData(formElement);
          void authClient
            .changePassword({
              currentPassword: String(form.get("current") ?? ""),
              newPassword: String(form.get("next") ?? ""),
              revokeOtherSessions: true,
            })
            .then((result) => {
              setPending(false);
              if (result.error) {
                setError(authErrorMessage(result.error, "Couldn't change the password."));
                return;
              }
              setNote("Password changed. Other sessions were signed out.");
              formElement.reset();
            });
        }}
      >
        <TextField id="current" label="Current password">
          <input id="current" name="current" type="password" autoComplete="current-password" className={textControlClass()} />
        </TextField>
        <TextField id="next" label="New password" hint="At least 8 characters.">
          <input id="next" name="next" type="password" autoComplete="new-password" minLength={8} className={textControlClass()} />
        </TextField>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        {note ? <p className="text-sm text-ink-muted">{note}</p> : null}
        <Button type="submit" className="font-ui" disabled={pending}>
          {pending ? "Saving…" : "Change password"}
        </Button>
      </form>
    </section>
  );
}

export function GooglePanel({ linked }: { linked: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-2xl text-ink">Google</h2>
      {linked ? (
        <p className="text-ink-muted">Google is linked to this account.</p>
      ) : (
        <>
          <p className="text-ink-muted">Link Google so you can sign in either way. It has to be the same email.</p>
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="font-ui"
            disabled={pending}
            onClick={() => {
              setPending(true);
              setError(null);
              void authClient
                .linkSocial({ provider: "google", callbackURL: "/me/account" })
                .then((result) => {
                  if (result.error) {
                    setPending(false);
                    setError(authErrorMessage(result.error, "Couldn't start Google linking."));
                  }
                });
            }}
          >
            {pending ? "Opening Google…" : "Link Google"}
          </Button>
        </>
      )}
    </section>
  );
}

export function BackupPanel() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [fileJson, setFileJson] = useState<unknown>(null);
  const [preview, setPreview] = useState<{
    pages: number;
    collisions: number;
    future: number;
    invalid: number;
    displayName: string;
  } | null>(null);
  const [overwrite, setOverwrite] = useState(false);

  async function download(kind: "json" | "markdown") {
    setError(null);
    setPending(kind);
    const result = kind === "json" ? await exportJsonAction() : await exportMarkdownAction();
    setPending(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    downloadBase64(result.filename, result.mime, result.base64);
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-2xl text-ink">Backup</h2>
      <p className="text-ink-muted">
        JSON can be imported back into Diary. Markdown is a zip of one file per day, for reading.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="font-ui" disabled={pending !== null} onClick={() => void download("json")}>
          {pending === "json" ? "Preparing…" : "Export JSON"}
        </Button>
        <Button type="button" variant="outline" className="font-ui" disabled={pending !== null} onClick={() => void download("markdown")}>
          {pending === "markdown" ? "Preparing…" : "Export Markdown"}
        </Button>
      </div>

      <label className="mt-2 font-ui text-sm text-ink" htmlFor="import-file">
        Import a Diary JSON backup
      </label>
      <input
        id="import-file"
        type="file"
        accept="application/json,.json"
        className="text-sm text-ink"
        onChange={(event) => {
          const file = event.target.files?.[0];
          setPreview(null);
          setFileJson(null);
          setError(null);
          setNote(null);
          if (!file) return;
          if (file.size > 12_000_000) {
            setError("That file is too large to import.");
            return;
          }
          void file.text().then(async (text) => {
            let json: unknown;
            try {
              json = JSON.parse(text);
            } catch {
              setError("That file isn't a Diary backup.");
              return;
            }
            setPending("preview");
            const result = await previewImportAction(json);
            setPending(null);
            if (!result.ok) {
              setError(result.message);
              return;
            }
            setFileJson(json);
            setPreview(result.preview);
          });
        }}
      />

      {preview ? (
        <div className="rounded-card border border-line bg-surface-raised p-4">
          <p className="text-ink">
            {preview.pages} {preview.pages === 1 ? "page" : "pages"}
            {preview.collisions > 0
              ? ` · ${preview.collisions} ${preview.collisions === 1 ? "date already has" : "dates already have"} a page`
              : ""}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Profile will be restored as {preview.displayName}.
            {preview.future > 0 ? ` ${preview.future} future dates will be skipped.` : ""}
            {preview.invalid > 0 ? ` ${preview.invalid} unreadable pages will be skipped.` : ""}
          </p>
          <label className="mt-3 flex min-h-11 items-center gap-3 text-ink">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(event) => setOverwrite(event.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            Overwrite existing pages
          </label>
          <Button
            type="button"
            className="mt-3 font-ui"
            disabled={pending === "import"}
            onClick={() => {
              if (!fileJson) return;
              setPending("import");
              setError(null);
              void importDiaryAction(fileJson, overwrite).then((result) => {
                setPending(null);
                if (!result.ok) {
                  setError(result.message);
                  return;
                }
                setNote(`Imported ${result.written}. Skipped ${result.skipped}.`);
                setPreview(null);
                setFileJson(null);
                router.refresh();
              });
            }}
          >
            {pending === "import" ? "Importing…" : "Import"}
          </Button>
        </div>
      ) : null}

      {note ? <p className="text-sm text-ink-muted">{note}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}

export function DeletePanel() {
  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <section className="flex flex-col gap-3 border-t border-line pt-6">
      <h2 className="font-display text-2xl text-ink">Delete account</h2>
      <p className="text-ink-muted">
        This deletes your profile, every page, and the sign-in. There is no way back.
      </p>
      <TextField id="delete-phrase" label={`Type “${DELETE_PHRASE}”`}>
        <input
          id="delete-phrase"
          value={phrase}
          onChange={(event) => setPhrase(event.target.value)}
          autoComplete="off"
          className={textControlClass()}
        />
      </TextField>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="destructive"
        className="font-ui"
        disabled={pending || phrase !== DELETE_PHRASE}
        onClick={() => {
          setPending(true);
          setError(null);
          void deleteAccountAction({ phrase }).then((result) => {
            setPending(false);
            if (result) setError(result.message);
          });
        }}
      >
        {pending ? "Deleting…" : "Delete everything"}
      </Button>
    </section>
  );
}
