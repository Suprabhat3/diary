export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-sm flex-1 flex-col justify-center px-6 py-12 text-center">
      <h1 className="font-display text-4xl text-ink">You are offline</h1>
      <p className="mt-3 text-ink-muted">
        Diary needs a connection to open a page or keep what you write. Come back when you are online.
      </p>
    </main>
  );
}
