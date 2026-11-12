import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FinishSwatch } from "@/components/ui/FinishSwatch";
import { FINISHES } from "@/lib/products/finishes";
import type { MetalType } from "@/types";

const FEATURED_PRODUCTS = [
  {
    id: "splashback",
    index: "01",
    name: "Splashbacks",
    description:
      "Our best-loved piece. A single sheet of hand-aged copper, brass or zinc behind the hob or basin, cut to the millimetre.",
    startingPrice: 95,
    image: "/textures/northumberland/feature.jpg",
    finish: "Northumberland",
  },
  {
    id: "worktop",
    index: "02",
    name: "Worktops",
    description:
      "Wrapped metal worktops with folded returns, upstands and sink cut-outs, previewed in 3D and flattened into a cut file.",
    startingPrice: 350,
    image: "/textures/antique-brass/feature.jpg",
    finish: "Antique Brass",
  },
] as const;

const COMING_SOON = [
  { name: "Bar Tops", note: "Pubs, restaurants and home bars" },
  { name: "Wall Panels", note: "Feature walls and cladding" },
  { name: "Metal Signage", note: "Engraved, laser cut and 3D effect" },
  { name: "Table Tops", note: "Dining and coffee tables" },
];

const METAL_ORDER: { metal: MetalType; label: string; note: string }[] = [
  { metal: "copper", label: "Copper", note: "Warm, living, verdigris-kissed" },
  { metal: "brass", label: "Brass", note: "Golden, bronzed, quietly grand" },
  { metal: "zinc", label: "Zinc", note: "Soft grey, Parisian bar-top calm" },
  { metal: "steel", label: "Steel", note: "Blackened and industrial" },
  { metal: "corten", label: "Corten", note: "Weathered rust, deliberately" },
];

const STEPS = [
  {
    n: "i",
    title: "Choose a finish",
    body: "Pick from our named, hand-aged patinas. Each is mapped onto the model so you can see how light falls across it.",
  },
  {
    n: "ii",
    title: "Set your size",
    body: "Enter exact dimensions. Anything over a single sheet is split into panels that we age together so they match.",
  },
  {
    n: "iii",
    title: "Request your quote",
    body: "See the price as you go. When you're happy, send it to the workshop and we'll be in touch to confirm the details.",
  },
];

export default function HomePage() {
  const activeFinishes = FINISHES.filter((f) => f.isActive);
  const finishCount = activeFinishes.length;

  return (
    <div className="flex min-h-screen flex-col bg-ht-cream">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="grain relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ht-dark">
        <Header variant="overlay" />

        {/* Texture field */}
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/textures/northumberland/feature.jpg"
            alt=""
            className="h-full w-full animate-[slowZoom_14s_var(--ease-out-expo)_both] object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-[linear-gradient(100deg,#1d1a16_0%,rgba(29,26,22,0.94)_32%,rgba(29,26,22,0.55)_62%,rgba(29,26,22,0.2)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ht-dark to-transparent" />
        </div>

        <div className="flex w-full flex-1 items-center px-6 pb-24 pt-32 sm:px-8">
          <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-2xl">
            <p className="animate-[riseIn_0.9s_var(--ease-out-expo)_both] text-[11px] font-semibold uppercase tracking-[0.35em] text-ht-gold-light/80">
              The Halman Thompson Visualiser
            </p>
            <h1 className="mt-6 animate-[riseIn_1s_var(--ease-out-expo)_0.08s_both] font-serif text-[44px] leading-[1.02] tracking-[-0.01em] text-white sm:text-6xl lg:text-[84px]">
              Living metal,
              <br />
              <em className="text-metal font-normal">made to measure.</em>
            </h1>
            <p className="mt-7 max-w-lg animate-[riseIn_1s_var(--ease-out-expo)_0.16s_both] text-base leading-relaxed text-white/65 sm:text-lg">
              Design your splashback or worktop in hand-aged copper, brass and
              zinc. See it in 3D, set it to the millimetre and get a price
              straight away.
            </p>
            <div className="mt-10 flex animate-[riseIn_1s_var(--ease-out-expo)_0.24s_both] flex-wrap items-center gap-3">
              <Link
                href="/configure/splashback"
                className="group inline-flex items-center gap-3 rounded-full bg-ht-gold-light px-7 py-4 text-sm font-semibold text-ht-dark transition-all duration-300 hover:bg-white"
              >
                Start with a splashback
                <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
              </Link>
              <Link
                href="/configure/worktop"
                className="inline-flex items-center rounded-full border border-white/20 px-7 py-4 text-sm font-semibold text-white/80 transition-all duration-300 hover:border-white/50 hover:text-white"
              >
                Design a worktop
              </Link>
            </div>
          </div>
          </div>
        </div>

        {/* Hero footer strip */}
        <div className="relative border-t border-white/10 px-6 sm:px-8">
          <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-white/10 [&>*:first-child]:pl-0">
            {[
              [`${finishCount}`, "Named finishes"],
              ["1:1", "Cut-ready dimensions"],
              ["5–8 wks", "Typical lead time"],
            ].map(([k, v]) => (
              <div key={v} className="px-3 py-5 sm:px-8 sm:py-6">
                <p className="font-serif text-2xl text-white sm:text-3xl">{k}</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/40 sm:text-[11px]">
                  {v}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Products ─────────────────────────────────────── */}
      <section id="products" className="scroll-mt-8 px-6 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ht-gold">
                Begin with a piece
              </p>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-ht-dark sm:text-5xl">
                What are we <em>making</em>?
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-ht-dark/55">
              Each piece is cut, aged and lacquered by hand in our Newcastle
              workshop. Choose one to open the visualiser.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {FEATURED_PRODUCTS.map((p) => (
              <Link
                key={p.id}
                href={`/configure/${p.id}`}
                className="group relative isolate flex min-h-[460px] flex-col justify-end overflow-hidden rounded-[28px] bg-ht-dark p-8 text-white sm:min-h-[540px] sm:p-10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt={`${p.finish} finish`}
                  loading="lazy"
                  className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-[1.6s] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ht-dark via-ht-dark/50 to-ht-dark/0" />
                <div className="absolute left-8 top-8 flex items-center gap-3 sm:left-10 sm:top-10">
                  <span className="font-serif text-sm italic text-white/70">{p.index}</span>
                  <span className="h-px w-8 bg-white/30" />
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur-md">
                    Shown in {p.finish}
                  </span>
                </div>
                <h3 className="font-serif text-4xl sm:text-5xl">{p.name}</h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                  {p.description}
                </p>
                <div className="mt-8 flex items-center justify-between border-t border-white/15 pt-5">
                  <p className="text-sm text-white/60">
                    From <span className="font-serif text-xl text-white">&pound;{p.startingPrice}</span>
                  </p>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 transition-all duration-500 group-hover:border-ht-gold-light group-hover:bg-ht-gold-light group-hover:text-ht-dark">
                    &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 grid gap-px overflow-hidden rounded-[20px] border border-ht-dark/[0.08] bg-ht-dark/[0.08] sm:grid-cols-2 lg:grid-cols-4">
            {COMING_SOON.map((c) => (
              <div key={c.name} className="bg-ht-cream px-6 py-6">
                <div className="flex items-center justify-between">
                  <p className="font-serif text-lg text-ht-dark/80">{c.name}</p>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ht-gold/80">
                    In the workshop
                  </span>
                </div>
                <p className="mt-1 text-xs text-ht-dark/45">{c.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Finishes library ─────────────────────────────── */}
      <section id="finishes" className="grain scroll-mt-8 bg-ht-dark px-6 py-24 text-white sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
            <div className="lg:sticky lg:top-12 lg:self-start">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ht-gold-light/80">
                The finishes
              </p>
              <h2 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">
                Named for counties.
                <br />
                <em className="text-white/60">Aged by hand.</em>
              </h2>
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/50">
                Our patinas are grown, not printed, so every sheet is one of a
                kind. The visualiser shows the character of each finish, and
                your piece will have its own.
              </p>
              <Link
                href="/configure/splashback"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-ht-gold-light transition-colors hover:text-white"
              >
                Try them on a splashback <span aria-hidden>&rarr;</span>
              </Link>
            </div>

            <div className="space-y-10">
              {METAL_ORDER.map(({ metal, label, note }) => {
                const list = activeFinishes.filter((f) => f.baseMetal === metal);
                if (!list.length) return null;
                return (
                  <div key={metal}>
                    <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
                      <h3 className="font-serif text-2xl">{label}</h3>
                      <p className="text-xs italic text-white/40">{note}</p>
                    </div>
                    <ul className="mt-5 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-5">
                      {list.map((f) => (
                        <li key={f.id} className="group">
                          <FinishSwatch
                            finish={f}
                            rounded="lg"
                            className="aspect-square w-full shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/10 transition-transform duration-500 group-hover:-translate-y-1"
                          />
                          <p className="mt-2.5 text-[13px] leading-tight text-white/85">{f.name}</p>
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-white/35">{f.subtitle}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="px-6 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ht-gold">
            How it works
          </p>
          <div className="mt-12 grid gap-12 md:grid-cols-3 md:gap-10">
            {STEPS.map((s) => (
              <div key={s.n} className="border-t border-ht-dark/15 pt-6">
                <p className="font-serif text-5xl italic text-ht-gold/70">{s.n}.</p>
                <h3 className="mt-5 font-serif text-2xl text-ht-dark">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ht-dark/55">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 flex flex-col items-start justify-between gap-6 rounded-[28px] bg-ht-stone px-8 py-10 sm:flex-row sm:items-center sm:px-12">
            <p className="max-w-xl font-serif text-2xl leading-snug text-ht-dark sm:text-3xl">
              Something more unusual in mind? <em>We make that too.</em>
            </p>
            <a
              href="tel:01912509853"
              className="inline-flex flex-shrink-0 items-center rounded-full bg-ht-dark px-7 py-4 text-sm font-semibold text-white transition-colors hover:bg-ht-bronze"
            >
              Call 0191 250 9853
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
