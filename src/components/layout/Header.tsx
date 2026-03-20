import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-ht-gold/20 bg-ht-dark px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="font-serif text-xl font-bold tracking-wide text-ht-gold">
            HALMAN THOMPSON
          </span>
          <span className="hidden text-xs tracking-widest text-ht-gold/60 sm:inline">
            BESPOKE METAL CREATIONS
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-white/70">
          <Link href="/" className="hover:text-ht-gold transition-colors">
            Products
          </Link>
          <Link
            href="/configure/splashback"
            className="rounded-md bg-ht-gold/90 px-4 py-2 text-ht-dark font-medium hover:bg-ht-gold transition-colors"
          >
            Configure
          </Link>
        </nav>
      </div>
    </header>
  );
}
