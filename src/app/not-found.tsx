import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ht-cream">
      <div className="text-center">
        <h1 className="font-serif text-4xl font-bold text-ht-dark">404</h1>
        <p className="mt-2 text-ht-dark/60">Page not found</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-ht-gold px-6 py-2 text-sm font-medium text-ht-dark hover:bg-ht-gold/90"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
