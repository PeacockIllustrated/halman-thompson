/**
 * Route-level loading UI. Shown while a route segment's server work resolves.
 * Subtle, on-brand: a warm cream field with the HT gold spinner.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ht-cream">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-ht-gold/30 border-t-ht-gold" />
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.3em] text-ht-dark/40">
          Loading
        </p>
      </div>
    </div>
  );
}
