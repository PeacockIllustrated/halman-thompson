/**
 * Loading skeleton for the configurator route. Mirrors the split layout of the
 * live page — a 3D viewport pane and a configuration sidebar — so the transition
 * into the real UI is visually stable.
 */
export default function ConfigureLoading() {
  return (
    <div className="flex h-[100dvh] flex-col">
      {/* Header placeholder */}
      <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-ht-dark/[0.06] bg-white px-6">
        <div className="h-5 w-40 animate-pulse rounded bg-ht-dark/10" />
        <div className="h-8 w-24 animate-pulse rounded-lg bg-ht-dark/[0.06]" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Viewport pane */}
        <div className="relative flex h-[32vh] flex-shrink-0 items-center justify-center bg-gradient-to-br from-ht-cream to-ht-dark/[0.06] sm:h-[38vh] md:h-[42vh] lg:h-auto lg:flex-[3]">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-ht-gold/30 border-t-ht-gold" />
            <p className="mt-3 text-sm text-ht-dark/40">
              Preparing your configurator...
            </p>
          </div>
          {/* Corner chrome placeholders */}
          <div className="absolute left-3 top-3 h-6 w-44 animate-pulse rounded bg-ht-dark/[0.06] sm:left-4 sm:top-4" />
          <div className="absolute bottom-3 right-3 h-9 w-24 animate-pulse rounded-lg bg-ht-dark/[0.06] sm:bottom-4 sm:right-4" />
        </div>

        {/* Sidebar pane */}
        <div className="flex min-h-0 flex-1 flex-col gap-6 border-t border-ht-dark/[0.06] bg-white p-6 lg:flex-none lg:basis-[420px] lg:border-l lg:border-t-0">
          {/* Price block */}
          <div className="space-y-3">
            <div className="h-3 w-24 animate-pulse rounded bg-ht-dark/10" />
            <div className="h-9 w-36 animate-pulse rounded bg-ht-dark/10" />
          </div>

          {/* Finish swatches */}
          <div className="space-y-3">
            <div className="h-3 w-20 animate-pulse rounded bg-ht-dark/10" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-lg bg-gradient-to-br from-ht-copper/15 to-ht-brass/15"
                />
              ))}
            </div>
          </div>

          {/* Dimension controls */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-28 animate-pulse rounded bg-ht-dark/10" />
                <div className="h-9 w-full animate-pulse rounded-lg bg-ht-dark/[0.06]" />
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-auto h-12 w-full animate-pulse rounded-xl bg-ht-gold/20" />
        </div>
      </div>
    </div>
  );
}
