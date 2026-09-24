export function AuthHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-8 text-center">
      <p className="font-ui text-xs uppercase tracking-[0.2em] text-ink-faint">
        Diary
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink">{title}</h1>
      <p className="mt-3 text-balance text-ink-muted">{description}</p>
    </header>
  );
}
