// Skeleton shown while a profile page streams in — navigating to a profile
// previously froze on the current page until the server finished. Pure
// shapes, no text, so it needs no i18n.
export default function ProfileLoading() {
  return (
    <div className="relative z-10 min-h-screen">
      <div className="h-16" />
      <main className="max-w-4xl mx-auto px-6 py-14">
        <section className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
          <div className="h-28 w-28 rounded-full bg-[var(--color-surface-raised)] animate-pulse shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-56 rounded-md bg-[var(--color-surface-raised)] animate-pulse" />
            <div className="h-4 w-36 rounded-md bg-[var(--color-surface-raised)] animate-pulse" />
            <div className="h-4 w-72 max-w-full rounded-md bg-[var(--color-surface-raised)] animate-pulse" />
          </div>
        </section>

        <section className="mt-12 space-y-3">
          <div className="h-4 w-28 rounded-md bg-[var(--color-surface-raised)] animate-pulse" />
          <div className="h-4 w-full rounded-md bg-[var(--color-surface-raised)] animate-pulse" />
          <div className="h-4 w-5/6 rounded-md bg-[var(--color-surface-raised)] animate-pulse" />
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="h-28 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] animate-pulse"
            />
          ))}
        </section>
      </main>
    </div>
  );
}
