import type { ReactNode } from "react";

const controlClass =
  "h-11 w-full rounded-card border border-line bg-surface-raised px-3 text-ink outline-none placeholder:text-ink-faint";

export function TextField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-ui text-sm text-ink">
        {label}
      </label>
      {children}
      {hint ? <p className="text-sm text-ink-muted">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function textControlClass(invalid = false) {
  return invalid ? `${controlClass} border-danger` : controlClass;
}

export const selectClass = controlClass;
