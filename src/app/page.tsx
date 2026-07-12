import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroBackground } from "@/components/layout/HeroBackground";
import { PRODUCT_TYPES } from "@/lib/products/catalogue";

// Single source of truth: the product grid is derived from PRODUCT_TYPES in the
// catalogue so names, prices, and active-state can never drift from the code the
// pricing engine and configurator actually use.

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* ── Hero with flowing noise background ── */}
        <section className="relative overflow-hidden bg-ht-dark px-6 py-28 text-center md:py-36">
          <HeroBackground />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ht-gold/70">
              Bespoke Metal Creations
            </p>
            <h1 className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
              Configure Your Bespoke{" "}
              <span className="text-ht-gold">Metal Piece</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/60">
              Choose your product, select from our hand-aged artisan finishes,
              set your dimensions, and see your piece come to life in 3D — with
              instant pricing.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/configure/worktop"
                className="rounded-xl bg-ht-gold px-8 py-3.5 font-semibold text-white shadow-lg shadow-ht-gold/25 transition-all hover:bg-ht-gold/90 hover:shadow-xl hover:shadow-ht-gold/30"
              >
                Start Configuring
              </Link>
              <Link
                href="#products"
                className="rounded-xl border border-white/15 px-8 py-3.5 font-semibold text-white/70 transition-all hover:border-white/30 hover:text-white"
              >
                View Products
              </Link>
            </div>
          </div>
          {/* Bottom gradient fade into cream */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ht-cream to-transparent" />
        </section>

        {/* ── Gold divider accent ── */}
        <div className="flex justify-center py-2">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-ht-gold/40 to-transparent" />
        </div>

        {/* ── Product Grid ── */}
        <section id="products" className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-serif text-2xl font-semibold text-ht-dark">
            Choose Your Product
          </h2>
          <p className="mt-2 max-w-xl text-sm text-ht-dark/50">
            Each piece is hand-finished by our artisans in Newcastle upon Tyne.
            Select a product to begin configuring.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCT_TYPES.map((product, i) => (
              <div
                key={product.id}
                className="group relative animate-[fadeSlideIn_0.5s_ease_both]"
                style={{ animationDelay: `${150 + i * 80}ms` }}
              >
                {product.isActive ? (
                  <Link
                    href={`/configure/${product.id}`}
                    className="block overflow-hidden rounded-xl border border-ht-gold/20 bg-white p-6 shadow-sm transition-all duration-300 hover:border-ht-gold/50 hover:shadow-lg hover:-translate-y-1"
                  >
                    {/* Animated gradient swatch */}
                    <div className="relative mb-4 h-40 overflow-hidden rounded-lg bg-gradient-to-br from-ht-copper/20 to-ht-brass/20">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-ht-gold/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{ animation: "shimmerSlide 3s ease-in-out infinite" }}
                      />
                    </div>
                    <h3 className="font-serif text-lg font-semibold">
                      {product.namePlural}
                    </h3>
                    <p className="mt-1 text-sm text-ht-dark/60">
                      {product.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-ht-gold">
                        From &pound;{product.startingPrice}
                      </p>
                      <span className="text-xs font-medium text-ht-gold/0 transition-colors group-hover:text-ht-gold">
                        Configure &rarr;
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div className="block rounded-xl border border-gray-200 bg-white/60 p-6 opacity-60">
                    <div className="mb-4 h-40 rounded-lg bg-gray-100" />
                    <h3 className="font-serif text-lg font-semibold">
                      {product.namePlural}
                    </h3>
                    <p className="mt-1 text-sm text-ht-dark/60">
                      {product.description}
                    </p>
                    <p className="mt-3 text-sm font-medium text-gray-400">
                      Coming Soon
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
