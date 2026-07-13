"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary. Renders inside the root layout, so Tailwind
 * brand tokens and the site chrome remain available. Catches errors thrown
 * during rendering of a route segment and offers recovery via `reset()`.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for diagnostics / monitoring.
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ht-cream px-6">
      <div className="w-full max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ht-gold/70">
          Something went wrong
        </p>
        <h1 className="mt-4 font-serif text-3xl font-bold text-ht-dark md:text-4xl">
          A spanner in the works
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ht-dark/60">
          We hit an unexpected snag while preparing your piece. Nothing has been
          lost — please try again, and our artisans will pick up where we left
          off.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-ht-gold px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-ht-gold/25 transition-all hover:bg-ht-gold/90 hover:shadow-xl hover:shadow-ht-gold/30"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-ht-dark/15 px-7 py-3 text-sm font-semibold text-ht-dark/70 transition-all hover:border-ht-dark/30 hover:text-ht-dark"
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-ht-gold/40 to-transparent" />
        </div>

        {error.digest && (
          <p className="mt-6 text-[11px] font-medium uppercase tracking-wider text-ht-dark/30">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
