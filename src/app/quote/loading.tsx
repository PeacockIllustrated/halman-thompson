/**
 * Loading skeleton for the quote page. Mirrors the centred, two-column
 * summary + form layout of the live page.
 */
export default function QuoteLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header placeholder */}
      <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-ht-dark/[0.06] bg-white px-6">
        <div className="h-5 w-40 animate-pulse rounded bg-ht-dark/10" />
        <div className="h-8 w-24 animate-pulse rounded-lg bg-ht-dark/[0.06]" />
      </div>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <div className="mb-6 h-4 w-40 animate-pulse rounded bg-ht-dark/[0.06]" />
        <div className="h-9 w-56 animate-pulse rounded bg-ht-dark/10" />

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Configuration summary card */}
          <div className="rounded-xl border border-ht-dark/10 bg-white p-6">
            <div className="h-6 w-40 animate-pulse rounded bg-ht-dark/10" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-20 animate-pulse rounded bg-ht-dark/[0.06]" />
                  <div className="h-4 w-24 animate-pulse rounded bg-ht-dark/10" />
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-ht-dark/10 pt-4">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 animate-pulse rounded bg-ht-dark/[0.06]" />
                <div className="h-7 w-24 animate-pulse rounded bg-ht-dark/10" />
              </div>
            </div>
          </div>

          {/* Quote form card */}
          <div className="rounded-xl border border-ht-dark/10 bg-white p-6">
            <div className="h-6 w-44 animate-pulse rounded bg-ht-dark/10" />
            <div className="mt-5 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-ht-dark/10" />
                  <div className="h-10 w-full animate-pulse rounded-lg bg-ht-dark/[0.06]" />
                </div>
              ))}
              <div className="h-12 w-full animate-pulse rounded-xl bg-ht-gold/20" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
