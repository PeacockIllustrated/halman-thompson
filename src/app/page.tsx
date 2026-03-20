import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const PRODUCT_CATEGORIES = [
  {
    id: "splashback",
    name: "Splashbacks",
    description: "Kitchen & bathroom splashbacks in aged copper, brass, and zinc",
    startingPrice: 95,
    active: true,
  },
  {
    id: "worktop",
    name: "Worktops",
    description: "Handcrafted metal worktops & countertops with returns, upstands, and artisan finishes",
    startingPrice: 350,
    active: true,
  },
  {
    id: "bar_top",
    name: "Bar Tops",
    description: "Statement bar tops for pubs, restaurants, and home bars",
    startingPrice: 320,
    active: false,
  },
  {
    id: "wall_panel",
    name: "Wall Panels",
    description: "Feature wall cladding and decorative panels",
    startingPrice: 150,
    active: false,
  },
  {
    id: "signage",
    name: "Metal Signage",
    description: "Engraved, laser cut, and 3D effect brass and zinc signs",
    startingPrice: 120,
    active: false,
  },
  {
    id: "table_top",
    name: "Table Tops",
    description: "Dining and coffee table surfaces in artisan metals",
    startingPrice: 250,
    active: false,
  },
] as const;

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-ht-dark px-6 py-20 text-center">
          <h1 className="font-serif text-4xl font-bold text-ht-gold md:text-5xl">
            Configure Your Bespoke Metal Piece
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
            Choose your product, select from our hand-aged artisan finishes, set
            your dimensions, and see your piece come to life in 3D — with instant
            pricing.
          </p>
        </section>

        {/* Product Grid */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-serif text-2xl font-semibold text-ht-dark">
            Choose Your Product
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCT_CATEGORIES.map((cat) => (
              <div key={cat.id} className="group relative">
                {cat.active ? (
                  <Link
                    href={`/configure/${cat.id}`}
                    className="block rounded-xl border border-ht-gold/20 bg-white p-6 shadow-sm transition-all hover:border-ht-gold/50 hover:shadow-md"
                  >
                    <div className="mb-4 h-40 rounded-lg bg-gradient-to-br from-ht-copper/20 to-ht-brass/20" />
                    <h3 className="font-serif text-lg font-semibold">
                      {cat.name}
                    </h3>
                    <p className="mt-1 text-sm text-ht-dark/60">
                      {cat.description}
                    </p>
                    <p className="mt-3 text-sm font-medium text-ht-gold">
                      From &pound;{cat.startingPrice}
                    </p>
                  </Link>
                ) : (
                  <div className="block rounded-xl border border-gray-200 bg-white/60 p-6 opacity-60">
                    <div className="mb-4 h-40 rounded-lg bg-gray-100" />
                    <h3 className="font-serif text-lg font-semibold">
                      {cat.name}
                    </h3>
                    <p className="mt-1 text-sm text-ht-dark/60">
                      {cat.description}
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
