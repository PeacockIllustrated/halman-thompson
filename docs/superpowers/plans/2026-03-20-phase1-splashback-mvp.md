# Phase 1: Splashback Configurator MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working 3D splashback configurator where users select an HT artisan finish, set dimensions, see a photorealistic 3D preview with real-time pricing, and submit a quote request.

**Architecture:** Next.js 15 App Router with a client-side Three.js/R3F 3D viewport driven by a Zustand store. Pricing is calculated server-side via an API route using pure-function logic. Static finish/product data is hardcoded for MVP (no Supabase dependency yet). The configurator page is a split layout: 3D viewport (60%) + config sidebar (40%).

**Tech Stack:** Next.js 15, React 19, TypeScript (strict), Three.js + @react-three/fiber + @react-three/drei, Zustand 5, Tailwind CSS 4, Radix UI, pnpm

**Key docs:**
- `CLAUDE.md` — Project overview, brand guidelines, architecture
- `docs/PRODUCT_SPEC.md` — Full feature specification
- `docs/ARCHITECTURE.md` — Three.js scene graph, shader details, API design
- `docs/DATA_MODEL.md` — Types, database schema, seed data
- `docs/HALMAN_THOMPSON_CONTEXT.md` — Client business context
- `src/types/index.ts` — All TypeScript types (already exists)
- `src/stores/configurator.ts` — Zustand store (already exists)

**Brand colours (from CLAUDE.md):**
- Primary dark: `#1a1a2e`, Gold accent: `#b8860b`, Copper: `#b87333`, Brass: `#cd9b1d`, Zinc: `#8a8d8f`, Warm bg: `#faf7f2`

---

## File Structure

### Existing Files (do not recreate)
- `package.json` — Dependencies defined
- `tsconfig.json` — Path aliases configured (`@/*`)
- `next.config.ts` — Image patterns + transpilePackages
- `.env.example` — Environment variable template
- `.gitignore` — Standard ignores
- `src/types/index.ts` — All shared TypeScript types
- `src/stores/configurator.ts` — Zustand configurator store

### Files to Create

**Config / Bootstrap:**
- `postcss.config.mjs` — PostCSS config for Tailwind CSS 4
- `eslint.config.mjs` — ESLint 9 flat config for Next.js
- `src/app/globals.css` — Tailwind imports + HT brand tokens
- `src/app/layout.tsx` — Root layout with fonts + metadata
- `src/app/not-found.tsx` — 404 page

**Utilities:**
- `src/lib/utils/cn.ts` — `clsx` + `tailwind-merge` helper

**Data Layer:**
- `src/lib/products/finishes.ts` — Static finish registry (all 20 HT finishes)
- `src/lib/products/catalogue.ts` — Product type definitions (splashback active)
- `src/lib/products/constraints.ts` — Dimension validation functions
- `src/lib/pricing/engine.ts` — Pure-function pricing calculator

**API Routes:**
- `src/app/api/pricing/calculate/route.ts` — POST endpoint for price calculation

**UI Primitives:**
- `src/components/ui/button.tsx` — Styled button component
- `src/components/ui/slider.tsx` — Radix slider with HT styling
- `src/components/ui/input.tsx` — Numeric input component

**Layout:**
- `src/components/layout/Header.tsx` — Site header with HT branding
- `src/components/layout/Footer.tsx` — Minimal footer

**3D Engine:**
- `src/components/three/MetalSheet.tsx` — Parametric box geometry with edge bevel
- `src/components/three/MetalMaterial.tsx` — PBR material using procedural textures
- `src/components/three/SceneEnvironment.tsx` — HDRI lighting + contact shadow
- `src/components/three/PanelLines.tsx` — Multi-panel split line overlays
- `src/components/three/DimensionLabels.tsx` — On-model dimension annotations
- `src/components/configurator/ProductViewer.tsx` — Canvas wrapper + error boundary + loading state

**Configurator Components:**
- `src/components/configurator/FinishSelector.tsx` — Finish swatches with metal-type tabs
- `src/components/configurator/DimensionControls.tsx` — Width/height sliders + thickness dropdown
- `src/components/configurator/PriceDisplay.tsx` — Live price + breakdown tooltip
- `src/components/configurator/ConfigSummary.tsx` — Current config summary
- `src/components/configurator/ConfigSidebar.tsx` — Tabbed sidebar orchestrating all controls
- `src/components/configurator/QuoteForm.tsx` — Quote request form with validation

**Pages:**
- `src/app/page.tsx` — Landing page with product type grid
- `src/app/configure/[productType]/page.tsx` — Main configurator view
- `src/app/quote/page.tsx` — Quote summary + form

---

## Task 1: Project Bootstrap — Git Init + Install Dependencies

**Files:**
- Modify: `.gitignore` (verify)
- No new files — just commands

- [ ] **Step 1: Initialise git repository**

```bash
cd C:/Users/peaco/Documents/halman-thompson-app
git init
```

- [ ] **Step 2: Install dependencies with pnpm**

```bash
pnpm install
```

Expected: `pnpm-lock.yaml` created, `node_modules/` populated, no errors.

- [ ] **Step 3: Verify installation**

```bash
pnpm ls --depth 0
```

Expected: All packages from `package.json` listed (next, react, three, zustand, etc.)

- [ ] **Step 4: Initial commit**

```bash
git add -A
git commit -m "chore: initial project scaffolding with types and store"
```

---

## Task 2: Config Files — Tailwind, PostCSS, ESLint

**Files:**
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `src/app/globals.css`
- Create: `src/lib/utils/cn.ts`

- [ ] **Step 1: Create PostCSS config for Tailwind CSS 4**

```javascript
// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

- [ ] **Step 2: Create ESLint flat config**

```javascript
// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
```

- [ ] **Step 3: Create globals.css with Tailwind + HT brand tokens**

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-ht-dark: #1a1a2e;
  --color-ht-gold: #b8860b;
  --color-ht-copper: #b87333;
  --color-ht-brass: #cd9b1d;
  --color-ht-zinc: #8a8d8f;
  --color-ht-cream: #faf7f2;
  --color-ht-teal: #4e7e8c;

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Playfair Display", ui-serif, Georgia, serif;
}

body {
  background-color: var(--color-ht-cream);
  color: var(--color-ht-dark);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 4: Create cn() utility**

```typescript
// src/lib/utils/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Verify lint passes**

```bash
pnpm lint
```

Expected: No errors (may warn about missing pages — that's fine).

- [ ] **Step 6: Commit**

```bash
git add postcss.config.mjs eslint.config.mjs src/app/globals.css src/lib/utils/cn.ts
git commit -m "chore: add Tailwind CSS 4, ESLint, and utility config"
```

---

## Task 3: App Shell — Root Layout + Landing Page

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/not-found.tsx`
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/Footer.tsx`

- [ ] **Step 1: Create root layout**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Halman Thompson | Bespoke Metal Configurator",
  description:
    "Configure your bespoke copper, brass, and zinc splashbacks, worktops, and signage with our interactive 3D visualiser.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-ht-cream text-ht-dark antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create Header component**

```tsx
// src/components/layout/Header.tsx
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
```

- [ ] **Step 3: Create Footer component**

```tsx
// src/components/layout/Footer.tsx
export function Footer() {
  return (
    <footer className="border-t border-ht-gold/10 bg-ht-dark px-6 py-8 text-white/50">
      <div className="mx-auto max-w-7xl text-center text-sm">
        <p>
          &copy; {new Date().getFullYear()} Halman Thompson Ltd. All rights
          reserved.
        </p>
        <p className="mt-1 text-xs">
          Bespoke Metal Creations &middot; Newcastle upon Tyne &middot; 0191 250
          9853
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Create landing page with product type grid**

The landing page shows a grid of product categories. For MVP, only "Splashbacks" is clickable; others show "Coming Soon".

```tsx
// src/app/page.tsx
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
    description: "Bespoke metal worktops and countertops",
    startingPrice: 280,
    active: false,
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
```

- [ ] **Step 5: Create 404 page**

```tsx
// src/app/not-found.tsx
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
```

- [ ] **Step 6: Run dev server and verify landing page renders**

```bash
pnpm dev
```

Open http://localhost:3000 — verify:
- Header with HT branding renders
- Hero section visible
- Product grid shows 6 cards (only Splashbacks clickable)
- Footer renders
- Tailwind styles applied correctly (dark header, cream background, gold accents)

- [ ] **Step 7: Commit**

```bash
git add src/app/ src/components/layout/
git commit -m "feat: add app shell with landing page and product type grid"
```

---

## Task 4: Data Layer — Finish Registry + Product Catalogue

**Files:**
- Create: `src/lib/products/finishes.ts`
- Create: `src/lib/products/catalogue.ts`
- Create: `src/lib/products/constraints.ts`

- [ ] **Step 1: Create finish registry**

All 20 HT finishes with placeholder texture URLs. Prices from `docs/DATA_MODEL.md` seed data.

```typescript
// src/lib/products/finishes.ts
import type { Finish, MetalType } from "@/types";

export const FINISHES: Finish[] = [
  {
    id: "northumberland",
    slug: "northumberland",
    name: "Northumberland",
    subtitle: "Aged copper with verdigris accents",
    baseMetal: "copper",
    description:
      "Our signature aged copper finish with beautiful verdigris accents. Each piece is hand-aged to create a unique, one-of-a-kind patina.",
    priceModifier: 1.4,
    isAged: true,
    lacquerDefault: "matte",
    availableThicknesses: [0.7, 0.9, 1.2, 1.5],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-copper.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-copper.jpg",
    galleryImages: [],
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "hertfordshire",
    slug: "hertfordshire",
    name: "Hertfordshire",
    subtitle: "Deep aged copper",
    baseMetal: "copper",
    description: "A deep, richly aged copper with warm undertones.",
    priceModifier: 1.3,
    isAged: true,
    lacquerDefault: "matte",
    availableThicknesses: [0.7, 0.9, 1.2, 1.5],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-copper.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-copper.jpg",
    galleryImages: [],
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "ayrshire",
    slug: "ayrshire",
    name: "Ayrshire",
    subtitle: "Dappled copper with verdigris specs",
    baseMetal: "copper",
    description:
      "A distinctive dappled copper with scattered verdigris speckling.",
    priceModifier: 1.6,
    isAged: true,
    lacquerDefault: "matte",
    availableThicknesses: [0.7, 0.9, 1.2, 1.5],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-copper.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-copper.jpg",
    galleryImages: [],
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "cheshire",
    slug: "cheshire",
    name: "Cheshire",
    subtitle: "Rich aged copper",
    baseMetal: "copper",
    description: "A warm, richly aged copper with deep amber tones.",
    priceModifier: 1.4,
    isAged: true,
    lacquerDefault: "matte",
    availableThicknesses: [0.7, 0.9, 1.2, 1.5],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-copper.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-copper.jpg",
    galleryImages: [],
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "natural-copper",
    slug: "natural-copper",
    name: "Natural Copper",
    subtitle: "Untreated solid copper",
    baseMetal: "copper",
    description: "Pure, untreated solid copper with its natural warm glow.",
    priceModifier: 1.0,
    isAged: false,
    lacquerDefault: "matte",
    availableThicknesses: [0.7, 0.9, 1.2, 1.5],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-copper.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-copper.jpg",
    galleryImages: [],
    sortOrder: 5,
    isActive: true,
  },
  {
    id: "brushed-copper",
    slug: "brushed-copper",
    name: "Brushed Copper",
    subtitle: "Brushed finish copper",
    baseMetal: "copper",
    description: "Copper with a fine directional brushed finish.",
    priceModifier: 1.0,
    isAged: false,
    lacquerDefault: "matte",
    availableThicknesses: [0.7, 0.9, 1.2, 1.5],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-copper.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-copper.jpg",
    galleryImages: [],
    sortOrder: 6,
    isActive: true,
  },
  {
    id: "lightly-burnished-copper",
    slug: "lightly-burnished-copper",
    name: "Lightly Burnished Copper",
    subtitle: "Subtle warmth",
    baseMetal: "copper",
    description: "Copper with a subtle burnished warmth.",
    priceModifier: 1.0,
    isAged: false,
    lacquerDefault: "matte",
    availableThicknesses: [0.7, 0.9, 1.2, 1.5],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-copper.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-copper.jpg",
    galleryImages: [],
    sortOrder: 7,
    isActive: true,
  },
  {
    id: "antique-burnished-copper",
    slug: "antique-burnished-copper",
    name: "Antique Burnished Copper",
    subtitle: "Deep burnished tone",
    baseMetal: "copper",
    description: "Deeply burnished copper with antique character.",
    priceModifier: 1.2,
    isAged: true,
    lacquerDefault: "matte",
    availableThicknesses: [0.7, 0.9, 1.2, 1.5],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-copper.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-copper.jpg",
    galleryImages: [],
    sortOrder: 8,
    isActive: true,
  },
  {
    id: "antique-brushed-copper",
    slug: "antique-brushed-copper",
    name: "Antique Brushed Copper",
    subtitle: "Brushed with patina",
    baseMetal: "copper",
    description: "Brushed copper with an antique patina overlay.",
    priceModifier: 1.1,
    isAged: true,
    lacquerDefault: "matte",
    availableThicknesses: [0.7, 0.9, 1.2, 1.5],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-copper.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-copper.jpg",
    galleryImages: [],
    sortOrder: 9,
    isActive: true,
  },
  {
    id: "somerset",
    slug: "somerset",
    name: "Somerset",
    subtitle: "Stained glass effect brass",
    baseMetal: "brass",
    description:
      "A stunning stained-glass-like effect on solid brass. HT's most distinctive brass finish.",
    priceModifier: 1.6,
    isAged: true,
    lacquerDefault: "matte",
    availableThicknesses: [0.7, 0.9, 1.2, 1.5],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-brass.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-brass.jpg",
    galleryImages: [],
    sortOrder: 10,
    isActive: true,
  },
  {
    id: "wiltshire",
    slug: "wiltshire",
    name: "Wiltshire",
    subtitle: "Classic aged brass",
    baseMetal: "brass",
    description: "A classic, evenly aged brass with timeless appeal.",
    priceModifier: 1.4,
    isAged: true,
    lacquerDefault: "matte",
    availableThicknesses: [0.7, 0.9, 1.2, 1.5],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-brass.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-brass.jpg",
    galleryImages: [],
    sortOrder: 11,
    isActive: true,
  },
  {
    id: "berkshire",
    slug: "berkshire",
    name: "Berkshire",
    subtitle: "Rich bronzed brass",
    baseMetal: "brass",
    description: "A richly bronzed brass with deep, warm tones.",
    priceModifier: 1.5,
    isAged: true,
    lacquerDefault: "matte",
    availableThicknesses: [0.7, 0.9, 1.2, 1.5],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-brass.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-brass.jpg",
    galleryImages: [],
    sortOrder: 12,
    isActive: true,
  },
  {
    id: "cambridgeshire",
    slug: "cambridgeshire",
    name: "Cambridgeshire",
    subtitle: "Mill brass finish",
    baseMetal: "brass",
    description: "A mill-finished brass with industrial refinement.",
    priceModifier: 1.3,
    isAged: true,
    lacquerDefault: "matte",
    availableThicknesses: [0.7, 0.9, 1.2, 1.5],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-brass.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-brass.jpg",
    galleryImages: [],
    sortOrder: 13,
    isActive: true,
  },
  {
    id: "natural-brass",
    slug: "natural-brass",
    name: "Natural Brass",
    subtitle: "Untreated solid brass",
    baseMetal: "brass",
    description: "Pure, untreated solid brass with a classic golden glow.",
    priceModifier: 1.0,
    isAged: false,
    lacquerDefault: "matte",
    availableThicknesses: [0.7, 0.9, 1.2, 1.5],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-brass.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-brass.jpg",
    galleryImages: [],
    sortOrder: 14,
    isActive: true,
  },
  {
    id: "antique-brass",
    slug: "antique-brass",
    name: "Antique Brass",
    subtitle: "Classic antique tone",
    baseMetal: "brass",
    description: "Brass with a classic antique patina.",
    priceModifier: 1.5,
    isAged: true,
    lacquerDefault: "matte",
    availableThicknesses: [0.7, 0.9, 1.2, 1.5],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-brass.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-brass.jpg",
    galleryImages: [],
    sortOrder: 15,
    isActive: true,
  },
  {
    id: "antique-brushed-brass",
    slug: "antique-brushed-brass",
    name: "Antique Brushed Brass",
    subtitle: "Brushed with antique patina",
    baseMetal: "brass",
    description: "Brushed brass with an antique patina overlay.",
    priceModifier: 1.5,
    isAged: true,
    lacquerDefault: "matte",
    availableThicknesses: [0.7, 0.9, 1.2, 1.5],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-brass.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-brass.jpg",
    galleryImages: [],
    sortOrder: 16,
    isActive: true,
  },
  {
    id: "lightly-aged-zinc",
    slug: "lightly-aged-zinc",
    name: "Lightly Aged Zinc",
    subtitle: "Subtle zinc patina",
    baseMetal: "zinc",
    description: "Zinc with a subtle, lightly aged patina.",
    priceModifier: 1.3,
    isAged: true,
    lacquerDefault: "matte",
    availableThicknesses: [0.7, 0.9, 1.2],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-zinc.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-zinc.jpg",
    galleryImages: [],
    sortOrder: 17,
    isActive: true,
  },
  {
    id: "antique-zinc",
    slug: "antique-zinc",
    name: "Antique Zinc",
    subtitle: "Deep zinc patina",
    baseMetal: "zinc",
    description: "Zinc with a deep, richly developed antique patina.",
    priceModifier: 1.4,
    isAged: true,
    lacquerDefault: "matte",
    availableThicknesses: [0.7, 0.9, 1.2],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-zinc.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-zinc.jpg",
    galleryImages: [],
    sortOrder: 18,
    isActive: true,
  },
  {
    id: "blackened-steel",
    slug: "blackened-steel",
    name: "Blackened Steel",
    subtitle: "Dark industrial finish",
    baseMetal: "steel",
    description: "Steel with a dramatic blackened industrial finish.",
    priceModifier: 1.8,
    isAged: true,
    lacquerDefault: "matte",
    availableThicknesses: [0.9, 1.2, 1.5, 2.0],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-steel.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-steel.jpg",
    galleryImages: [],
    sortOrder: 19,
    isActive: true,
  },
  {
    id: "corten-weathered",
    slug: "corten-weathered",
    name: "Corten Steel",
    subtitle: "Rustic weathered steel",
    baseMetal: "corten",
    description:
      "Weathered corten steel with its iconic rust-orange patina.",
    priceModifier: 1.8,
    isAged: true,
    lacquerDefault: "matte",
    availableThicknesses: [0.9, 1.2, 1.5, 2.0],
    maxSheetWidth: 2000,
    maxSheetHeight: 1000,
    textures: {
      albedo: "/textures/placeholder-steel.jpg",
      normal: "/textures/placeholder-normal.jpg",
      roughness: "/textures/placeholder-roughness.jpg",
      metalness: "/textures/placeholder-metalness.jpg",
      realWorldWidthMm: 500,
      realWorldHeightMm: 500,
    },
    swatchImageUrl: "/textures/placeholder-steel.jpg",
    galleryImages: [],
    sortOrder: 20,
    isActive: true,
  },
];

/** Get all active finishes */
export function getActiveFinishes(): Finish[] {
  return FINISHES.filter((f) => f.isActive);
}

/** Get finishes filtered by base metal */
export function getFinishesByMetal(metal: MetalType): Finish[] {
  return FINISHES.filter((f) => f.isActive && f.baseMetal === metal);
}

/** Find a finish by its ID */
export function getFinishById(id: string): Finish | undefined {
  return FINISHES.find((f) => f.id === id);
}

/** Find a finish by its slug */
export function getFinishBySlug(slug: string): Finish | undefined {
  return FINISHES.find((f) => f.slug === slug);
}

/** Get unique metal types that have active finishes */
export function getAvailableMetals(): MetalType[] {
  const metals = new Set(FINISHES.filter((f) => f.isActive).map((f) => f.baseMetal));
  return Array.from(metals);
}
```

- [ ] **Step 2: Create product type catalogue**

```typescript
// src/lib/products/catalogue.ts
import type { ProductTypeConfig } from "@/types";

export const PRODUCT_TYPES: ProductTypeConfig[] = [
  {
    id: "splashback",
    name: "Splashback",
    namePlural: "Splashbacks",
    description:
      "Kitchen and bathroom splashbacks in aged copper, brass, zinc, and steel.",
    heroImage: "/images/splashback-hero.jpg",
    startingPrice: 95,
    defaultWidth: 900,
    defaultHeight: 600,
    minWidth: 100,
    maxWidth: 4000,
    minHeight: 100,
    maxHeight: 2000,
    availableThicknesses: [0.7, 0.9, 1.2, 1.5],
    defaultThickness: 0.9,
    allowedMetals: ["copper", "brass", "zinc", "steel", "corten"],
    allowedMountingTypes: ["none", "drilled_holes", "adhesive", "screw_fixings"],
    allowedFabricationMethods: ["flat_sheet"],
    labourMultiplier: 1.0,
    hasTextInput: false,
    hasLogoUpload: false,
    modelType: "flat_sheet",
    sortOrder: 1,
    isActive: true,
    phase: 1,
  },
  {
    id: "worktop",
    name: "Worktop",
    namePlural: "Worktops",
    description: "Bespoke metal worktops and countertops.",
    heroImage: "/images/worktop-hero.jpg",
    startingPrice: 280,
    defaultWidth: 1200,
    defaultHeight: 600,
    minWidth: 200,
    maxWidth: 6000,
    minHeight: 200,
    maxHeight: 1200,
    availableThicknesses: [0.9, 1.2, 1.5],
    defaultThickness: 1.2,
    allowedMetals: ["copper", "brass", "zinc"],
    allowedMountingTypes: ["none", "adhesive"],
    allowedFabricationMethods: ["flat_sheet"],
    labourMultiplier: 1.3,
    hasTextInput: false,
    hasLogoUpload: false,
    modelType: "surface_sheet",
    sortOrder: 2,
    isActive: false,
    phase: 2,
  },
  {
    id: "bar_top",
    name: "Bar Top",
    namePlural: "Bar Tops",
    description: "Statement bar tops for pubs, restaurants, and home bars.",
    heroImage: "/images/bar-top-hero.jpg",
    startingPrice: 320,
    defaultWidth: 1500,
    defaultHeight: 600,
    minWidth: 300,
    maxWidth: 6000,
    minHeight: 200,
    maxHeight: 1200,
    availableThicknesses: [0.9, 1.2, 1.5],
    defaultThickness: 1.2,
    allowedMetals: ["copper", "brass", "zinc"],
    allowedMountingTypes: ["none", "adhesive"],
    allowedFabricationMethods: ["flat_sheet"],
    labourMultiplier: 1.3,
    hasTextInput: false,
    hasLogoUpload: false,
    modelType: "surface_sheet",
    sortOrder: 3,
    isActive: false,
    phase: 2,
  },
  {
    id: "wall_panel",
    name: "Wall Panel",
    namePlural: "Wall Panels",
    description: "Feature wall cladding and decorative panels.",
    heroImage: "/images/wall-panel-hero.jpg",
    startingPrice: 150,
    defaultWidth: 1200,
    defaultHeight: 800,
    minWidth: 100,
    maxWidth: 4000,
    minHeight: 100,
    maxHeight: 2000,
    availableThicknesses: [0.7, 0.9, 1.2],
    defaultThickness: 0.9,
    allowedMetals: ["copper", "brass", "zinc", "steel", "corten"],
    allowedMountingTypes: ["none", "adhesive", "screw_fixings"],
    allowedFabricationMethods: ["flat_sheet"],
    labourMultiplier: 1.0,
    hasTextInput: false,
    hasLogoUpload: false,
    modelType: "flat_sheet",
    sortOrder: 4,
    isActive: false,
    phase: 2,
  },
  {
    id: "signage",
    name: "Metal Sign",
    namePlural: "Metal Signage",
    description: "Engraved, laser cut, and 3D effect brass and zinc signs.",
    heroImage: "/images/signage-hero.jpg",
    startingPrice: 120,
    defaultWidth: 400,
    defaultHeight: 300,
    minWidth: 50,
    maxWidth: 2000,
    minHeight: 50,
    maxHeight: 1000,
    availableThicknesses: [0.9, 1.2, 1.5],
    defaultThickness: 1.2,
    allowedMetals: ["brass", "zinc", "copper"],
    allowedMountingTypes: ["none", "drilled_holes", "stake_frame", "wire_hanging"],
    allowedFabricationMethods: ["engraved", "laser_cut", "3d_effect", "etched"],
    labourMultiplier: 2.0,
    hasTextInput: true,
    hasLogoUpload: true,
    modelType: "plaque",
    sortOrder: 5,
    isActive: false,
    phase: 3,
  },
  {
    id: "table_top",
    name: "Table Top",
    namePlural: "Table Tops",
    description: "Dining and coffee table surfaces in artisan metals.",
    heroImage: "/images/table-top-hero.jpg",
    startingPrice: 250,
    defaultWidth: 1000,
    defaultHeight: 600,
    minWidth: 300,
    maxWidth: 3000,
    minHeight: 300,
    maxHeight: 1500,
    availableThicknesses: [0.9, 1.2, 1.5],
    defaultThickness: 1.2,
    allowedMetals: ["copper", "brass", "zinc"],
    allowedMountingTypes: ["none", "adhesive"],
    allowedFabricationMethods: ["flat_sheet"],
    labourMultiplier: 1.2,
    hasTextInput: false,
    hasLogoUpload: false,
    modelType: "table_surface",
    sortOrder: 6,
    isActive: false,
    phase: 2,
  },
];

/** Get a product type config by ID */
export function getProductType(id: string): ProductTypeConfig | undefined {
  return PRODUCT_TYPES.find((p) => p.id === id);
}

/** Get all active product types */
export function getActiveProductTypes(): ProductTypeConfig[] {
  return PRODUCT_TYPES.filter((p) => p.isActive);
}
```

- [ ] **Step 3: Create dimension constraints**

```typescript
// src/lib/products/constraints.ts
import type { ProductTypeConfig } from "@/types";

const MAX_SINGLE_SHEET_WIDTH = 2000;
const MAX_SINGLE_SHEET_HEIGHT = 1000;

/** Clamp a dimension value within product constraints */
export function clampWidth(value: number, product: ProductTypeConfig): number {
  return Math.max(product.minWidth, Math.min(product.maxWidth, Math.round(value)));
}

export function clampHeight(value: number, product: ProductTypeConfig): number {
  return Math.max(product.minHeight, Math.min(product.maxHeight, Math.round(value)));
}

/** Check if dimensions require multi-panel fabrication */
export function requiresMultiPanel(width: number, height: number): boolean {
  return width > MAX_SINGLE_SHEET_WIDTH || height > MAX_SINGLE_SHEET_HEIGHT;
}

/** Validate that a thickness is available for the given product */
export function isValidThickness(
  thickness: number,
  product: ProductTypeConfig
): boolean {
  return product.availableThicknesses.includes(thickness);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/products/
git commit -m "feat: add finish registry, product catalogue, and dimension constraints"
```

---

## Task 5: Pricing Engine + API Route

**Files:**
- Create: `src/lib/pricing/engine.ts`
- Create: `src/app/api/pricing/calculate/route.ts`

- [ ] **Step 1: Create pricing engine (pure functions)**

This is the core pricing logic. All prices in GBP. Formula from `CLAUDE.md`:
`Price = f(metal_type, finish_complexity, area_mm2, thickness, product_type_labour, mounting_type)`

```typescript
// src/lib/pricing/engine.ts
import type {
  MetalType,
  MountingType,
  PriceBreakdown,
  PricingRequest,
  PricingResponse,
} from "@/types";
import { getFinishById } from "@/lib/products/finishes";
import { getProductType } from "@/lib/products/catalogue";

/** Base price per m² by metal type (£) */
const BASE_PRICE_PER_M2: Record<MetalType, number> = {
  copper: 180,
  brass: 160,
  zinc: 120,
  steel: 90,
  corten: 110,
};

/** Thickness surcharge (£ per m²) — relative to baseline 0.9mm */
const THICKNESS_SURCHARGE_PER_M2: Record<number, number> = {
  0.7: -10,
  0.9: 0,
  1.2: 25,
  1.5: 50,
  2.0: 80,
};

/** Mounting preparation costs (£ flat) */
const MOUNTING_COSTS: Record<MountingType, number> = {
  none: 0,
  drilled_holes: 15,
  adhesive: 5,
  stake_frame: 45,
  wire_hanging: 20,
  screw_fixings: 15,
};

/** Multi-panel surcharge per additional panel (£) */
const MULTI_PANEL_SURCHARGE = 50;

/** Delivery costs */
const DELIVERY_BASE = 15;
const DELIVERY_PALLET_SURCHARGE = 50;
const PALLET_THRESHOLD_MM = 1300;

/** VAT rate */
const VAT_RATE = 0.2;

export function calculatePrice(request: PricingRequest): PricingResponse {
  const finish = getFinishById(request.finishId);
  const product = getProductType(request.productType);

  if (!finish || !product) {
    return {
      totalPrice: 0,
      currency: "GBP",
      breakdown: emptyBreakdown(),
      isEstimate: false,
      requiresManualQuote: true,
    };
  }

  // Area in m²
  const areaM2 = (request.width * request.height) / 1_000_000;

  // Base material cost
  const baseMaterial = areaM2 * BASE_PRICE_PER_M2[finish.baseMetal];

  // Finish surcharge (based on priceModifier — 1.0 = no surcharge)
  const finishSurcharge = baseMaterial * (finish.priceModifier - 1);

  // Thickness surcharge
  const thicknessSurchargeRate = THICKNESS_SURCHARGE_PER_M2[request.thickness] ?? 0;
  const thicknessSurcharge = areaM2 * thicknessSurchargeRate;

  // Labour cost (product-specific multiplier on base)
  const labourBase = baseMaterial * 0.15; // 15% of material cost as base labour
  const labourCost = labourBase * product.labourMultiplier;

  // Mounting prep
  const mountingPrep = MOUNTING_COSTS[request.mountingType] ?? 0;

  // Multi-panel surcharge
  const multiPanelSurcharge =
    request.panelCount > 1 ? (request.panelCount - 1) * MULTI_PANEL_SURCHARGE : 0;

  // Delivery estimate
  const needsPallet =
    request.width > PALLET_THRESHOLD_MM ||
    request.height > PALLET_THRESHOLD_MM;
  const deliveryEstimate =
    DELIVERY_BASE + (needsPallet ? DELIVERY_PALLET_SURCHARGE : 0);

  // Subtotal
  const subtotal =
    baseMaterial +
    finishSurcharge +
    thicknessSurcharge +
    labourCost +
    mountingPrep +
    multiPanelSurcharge +
    deliveryEstimate;

  // VAT
  const vat = subtotal * VAT_RATE;

  // Total
  const total = subtotal + vat;

  const breakdown: PriceBreakdown = {
    baseMaterial: round2(baseMaterial),
    finishSurcharge: round2(finishSurcharge),
    thicknessSurcharge: round2(thicknessSurcharge),
    labourCost: round2(labourCost),
    mountingPrep: round2(mountingPrep),
    multiPanelSurcharge: round2(multiPanelSurcharge),
    deliveryEstimate: round2(deliveryEstimate),
    subtotal: round2(subtotal),
    vat: round2(vat),
    total: round2(total),
  };

  return {
    totalPrice: breakdown.total,
    currency: "GBP",
    breakdown,
    isEstimate: false,
    requiresManualQuote: false,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function emptyBreakdown(): PriceBreakdown {
  return {
    baseMaterial: 0,
    finishSurcharge: 0,
    thicknessSurcharge: 0,
    labourCost: 0,
    mountingPrep: 0,
    multiPanelSurcharge: 0,
    deliveryEstimate: 0,
    subtotal: 0,
    vat: 0,
    total: 0,
  };
}
```

- [ ] **Step 2: Create pricing API route**

```typescript
// src/app/api/pricing/calculate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { calculatePrice } from "@/lib/pricing/engine";
import type { PricingRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PricingRequest;

    // Basic validation
    if (
      !body.productType ||
      !body.finishId ||
      !body.width ||
      !body.height ||
      !body.thickness
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (body.width <= 0 || body.height <= 0 || body.thickness <= 0) {
      return NextResponse.json(
        { error: "Dimensions must be positive" },
        { status: 400 }
      );
    }

    const result = calculatePrice(body);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Price calculation failed" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Verify pricing API works**

```bash
# Start dev server (if not running), then in another terminal:
curl -X POST http://localhost:3000/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{"productType":"splashback","finishId":"northumberland","width":900,"height":600,"thickness":0.9,"mountingType":"none","panelCount":1}'
```

Expected: JSON response with `totalPrice`, `currency: "GBP"`, and full `breakdown` object.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pricing/ src/app/api/
git commit -m "feat: add pricing engine and API route"
```

---

## Task 6: UI Primitives — Button, Slider, Input

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/slider.tsx`
- Create: `src/components/ui/input.tsx`

- [ ] **Step 1: Create Button component**

```tsx
// src/components/ui/button.tsx
"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ht-gold/50 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-ht-gold text-ht-dark hover:bg-ht-gold/90":
              variant === "primary",
            "bg-ht-dark text-white hover:bg-ht-dark/90":
              variant === "secondary",
            "border border-ht-gold/30 text-ht-dark hover:bg-ht-gold/10":
              variant === "outline",
            "text-ht-dark hover:bg-ht-dark/5": variant === "ghost",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
```

- [ ] **Step 2: Create Slider component (wrapping Radix)**

```tsx
// src/components/ui/slider.tsx
"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils/cn";

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  unit?: string;
  className?: string;
}

export function Slider({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  label,
  unit = "mm",
  className,
}: SliderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-ht-dark">{label}</span>
          <span className="tabular-nums text-ht-dark/60">
            {value}
            {unit}
          </span>
        </div>
      )}
      <SliderPrimitive.Root
        className="relative flex h-5 w-full touch-none select-none items-center"
        value={[value]}
        onValueChange={([v]) => onValueChange(v)}
        min={min}
        max={max}
        step={step}
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-ht-dark/10">
          <SliderPrimitive.Range className="absolute h-full bg-ht-gold" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-4 w-4 cursor-grab rounded-full border-2 border-ht-gold bg-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ht-gold/50 active:cursor-grabbing" />
      </SliderPrimitive.Root>
    </div>
  );
}
```

- [ ] **Step 3: Create numeric Input component**

```tsx
// src/components/ui/input.tsx
"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  unit?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, unit, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="text-sm font-medium text-ht-dark">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              "h-10 w-full rounded-md border border-ht-dark/20 bg-white px-3 text-sm tabular-nums text-ht-dark placeholder:text-ht-dark/40 focus:border-ht-gold focus:outline-none focus:ring-1 focus:ring-ht-gold/50",
              unit && "pr-10",
              className
            )}
            {...props}
          />
          {unit && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ht-dark/40">
              {unit}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = "Input";
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add UI primitives — Button, Slider, Input"
```

---

## Task 7: 3D Engine — Parametric Metal Sheet + Scene

**Files:**
- Create: `src/components/three/MetalSheet.tsx`
- Create: `src/components/three/MetalMaterial.tsx`
- Create: `src/components/three/SceneEnvironment.tsx`
- Create: `src/components/three/PanelLines.tsx`
- Create: `src/components/three/DimensionLabels.tsx`
- Create: `src/components/configurator/ProductViewer.tsx`

Note: Three.js components require visual verification, not unit tests. Use the dev server to verify rendering.

- [ ] **Step 1: Create MetalMaterial component**

Procedural PBR material using Three.js `MeshStandardMaterial` with per-metal colour mapping. In production, this will use loaded texture maps — for MVP, we use procedural colours that represent each metal type.

```tsx
// src/components/three/MetalMaterial.tsx
"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { MetalType } from "@/types";

/** Approximate visual colour per metal type for procedural preview */
const METAL_COLORS: Record<MetalType, string> = {
  copper: "#b87333",
  brass: "#cd9b1d",
  zinc: "#8a8d8f",
  steel: "#3a3a3a",
  corten: "#8b4513",
};

const METAL_ROUGHNESS: Record<MetalType, number> = {
  copper: 0.35,
  brass: 0.3,
  zinc: 0.45,
  steel: 0.25,
  corten: 0.6,
};

interface MetalMaterialProps {
  baseMetal: MetalType;
  isAged: boolean;
}

export function MetalMaterial({ baseMetal, isAged }: MetalMaterialProps) {
  const materialProps = useMemo(() => {
    const color = new THREE.Color(METAL_COLORS[baseMetal]);
    // Aged finishes are slightly darker and rougher
    if (isAged) {
      color.multiplyScalar(0.85);
    }
    return {
      color,
      metalness: 0.9,
      roughness: METAL_ROUGHNESS[baseMetal] + (isAged ? 0.15 : 0),
      envMapIntensity: 1.2,
    };
  }, [baseMetal, isAged]);

  return <meshStandardMaterial {...materialProps} />;
}
```

- [ ] **Step 2: Create MetalSheet parametric geometry**

```tsx
// src/components/three/MetalSheet.tsx
"use client";

import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import { MetalMaterial } from "./MetalMaterial";
import type { MetalType } from "@/types";

interface MetalSheetProps {
  /** Width in mm */
  width: number;
  /** Height in mm */
  height: number;
  /** Thickness in mm */
  thickness: number;
  baseMetal: MetalType;
  isAged: boolean;
}

/** Scale factor: convert mm to Three.js scene units (1 unit = 100mm) */
const SCALE = 0.01;

export function MetalSheet({
  width,
  height,
  thickness,
  baseMetal,
  isAged,
}: MetalSheetProps) {
  const dims = useMemo(
    () => ({
      w: width * SCALE,
      h: height * SCALE,
      t: Math.max(thickness * SCALE, 0.02), // Min visual thickness
    }),
    [width, height, thickness]
  );

  return (
    <RoundedBox
      args={[dims.w, dims.h, dims.t]}
      radius={0.02}
      smoothness={4}
    >
      <MetalMaterial baseMetal={baseMetal} isAged={isAged} />
    </RoundedBox>
  );
}
```

- [ ] **Step 3: Create PanelLines overlay**

```tsx
// src/components/three/PanelLines.tsx
"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import type { PanelLayout } from "@/types";

interface PanelLinesProps {
  width: number;
  height: number;
  thickness: number;
  panelLayout: PanelLayout | null;
}

const SCALE = 0.01;

export function PanelLines({
  width,
  height,
  thickness,
  panelLayout,
}: PanelLinesProps) {
  const lines = useMemo(() => {
    if (!panelLayout || panelLayout.panelCount <= 1) return [];

    const w = width * SCALE;
    const h = height * SCALE;
    const t = Math.max(thickness * SCALE, 0.02);
    const result: [number, number, number][][] = [];

    // Draw join lines on the front face
    const panelsWide = Math.ceil(width / 2000);
    const panelsHigh = Math.ceil(height / 1000);

    // Vertical join lines
    for (let i = 1; i < panelsWide; i++) {
      const x = -w / 2 + (w / panelsWide) * i;
      result.push([
        [x, -h / 2, t / 2 + 0.005],
        [x, h / 2, t / 2 + 0.005],
      ]);
    }

    // Horizontal join lines
    for (let i = 1; i < panelsHigh; i++) {
      const y = -h / 2 + (h / panelsHigh) * i;
      result.push([
        [-w / 2, y, t / 2 + 0.005],
        [w / 2, y, t / 2 + 0.005],
      ]);
    }

    return result;
  }, [width, height, thickness, panelLayout]);

  if (lines.length === 0) return null;

  return (
    <group>
      {lines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#ffffff"
          lineWidth={1.5}
          dashed
          dashSize={0.05}
          gapSize={0.03}
          opacity={0.6}
          transparent
        />
      ))}
    </group>
  );
}
```

- [ ] **Step 4: Create DimensionLabels**

```tsx
// src/components/three/DimensionLabels.tsx
"use client";

import { Html } from "@react-three/drei";

interface DimensionLabelsProps {
  width: number;
  height: number;
}

const SCALE = 0.01;

export function DimensionLabels({ width, height }: DimensionLabelsProps) {
  const w = width * SCALE;
  const h = height * SCALE;

  return (
    <group>
      {/* Width label — bottom */}
      <Html
        position={[0, -h / 2 - 0.3, 0]}
        center
        style={{ pointerEvents: "none" }}
      >
        <div className="whitespace-nowrap rounded bg-ht-dark/80 px-2 py-0.5 text-xs font-medium tabular-nums text-white">
          {width}mm
        </div>
      </Html>

      {/* Height label — right */}
      <Html
        position={[w / 2 + 0.3, 0, 0]}
        center
        style={{ pointerEvents: "none" }}
      >
        <div className="whitespace-nowrap rounded bg-ht-dark/80 px-2 py-0.5 text-xs font-medium tabular-nums text-white">
          {height}mm
        </div>
      </Html>
    </group>
  );
}
```

- [ ] **Step 5: Create SceneEnvironment**

```tsx
// src/components/three/SceneEnvironment.tsx
"use client";

import {
  Environment,
  ContactShadows,
  OrbitControls,
} from "@react-three/drei";

export function SceneEnvironment() {
  return (
    <>
      {/* Studio-style HDRI environment for metal reflections */}
      <Environment preset="studio" />

      {/* Ambient + directional lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.3} />

      {/* Ground shadow for realism */}
      <ContactShadows
        position={[0, -3, 0]}
        opacity={0.4}
        scale={20}
        blur={2}
        far={10}
      />

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minDistance={2}
        maxDistance={20}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.85}
      />
    </>
  );
}
```

- [ ] **Step 6: Create ProductViewer (Canvas wrapper with error boundary)**

```tsx
// src/components/configurator/ProductViewer.tsx
"use client";

import { Suspense, Component, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { MetalSheet } from "@/components/three/MetalSheet";
import { SceneEnvironment } from "@/components/three/SceneEnvironment";
import { PanelLines } from "@/components/three/PanelLines";
import { DimensionLabels } from "@/components/three/DimensionLabels";
import { useConfiguratorStore } from "@/stores/configurator";

function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-ht-dark/5 to-ht-dark/10">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-ht-gold/30 border-t-ht-gold" />
        <p className="mt-3 text-sm text-ht-dark/50">Loading 3D preview...</p>
      </div>
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ViewerErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center bg-ht-dark/5 p-8">
          <div className="text-center">
            <p className="font-serif text-lg font-semibold text-ht-dark">
              3D Preview Unavailable
            </p>
            <p className="mt-2 text-sm text-ht-dark/60">
              Your browser may not support WebGL. Please try a different browser
              or device.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Scene() {
  const { width, height, thickness, baseMetal, selectedFinish, panelLayout } =
    useConfiguratorStore();

  const isAged = selectedFinish?.isAged ?? false;

  return (
    <>
      <SceneEnvironment />
      <MetalSheet
        width={width}
        height={height}
        thickness={thickness}
        baseMetal={baseMetal}
        isAged={isAged}
      />
      <PanelLines
        width={width}
        height={height}
        thickness={thickness}
        panelLayout={panelLayout}
      />
      <DimensionLabels width={width} height={height} />
    </>
  );
}

export function ProductViewer() {
  return (
    <ViewerErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 0, 12], fov: 45 }}
          gl={{
            antialias: true,
            toneMapping: 3, // ACESFilmicToneMapping
            toneMappingExposure: 1.2,
          }}
          className="touch-none"
        >
          <Scene />
        </Canvas>
      </Suspense>
    </ViewerErrorBoundary>
  );
}
```

- [ ] **Step 7: Verify 3D scene renders**

Temporarily add the ProductViewer to the landing page or navigate to a test route. Verify:
- Canvas renders without errors
- A copper-coloured metal sheet is visible
- Orbit controls work (drag to rotate, scroll to zoom)
- Environment reflections visible on metal surface
- Dimension labels show "900mm" and "600mm"

- [ ] **Step 8: Commit**

```bash
git add src/components/three/ src/components/configurator/ProductViewer.tsx
git commit -m "feat: add 3D engine with parametric metal sheet and scene environment"
```

---

## Task 8: Configurator UI — Finish Selector + Dimension Controls

**Files:**
- Create: `src/components/configurator/FinishSelector.tsx`
- Create: `src/components/configurator/DimensionControls.tsx`
- Create: `src/components/configurator/PriceDisplay.tsx`

- [ ] **Step 1: Create FinishSelector**

Tabbed by metal type. Circular swatches with finish name. Selected state highlighted with gold border.

```tsx
// src/components/configurator/FinishSelector.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import {
  getActiveFinishes,
  getFinishesByMetal,
  getAvailableMetals,
} from "@/lib/products/finishes";
import { useConfiguratorStore } from "@/stores/configurator";
import type { MetalType } from "@/types";

const METAL_LABELS: Record<MetalType, string> = {
  copper: "Copper",
  brass: "Brass",
  zinc: "Zinc",
  steel: "Steel",
  corten: "Corten",
};

const METAL_COLORS: Record<MetalType, string> = {
  copper: "bg-ht-copper",
  brass: "bg-ht-brass",
  zinc: "bg-ht-zinc",
  steel: "bg-gray-600",
  corten: "bg-amber-800",
};

export function FinishSelector() {
  const metals = getAvailableMetals();
  const [activeTab, setActiveTab] = useState<MetalType>(metals[0]);
  const { selectedFinish, setFinish } = useConfiguratorStore();

  const finishes = getFinishesByMetal(activeTab);

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-lg font-semibold">Select Finish</h3>

      {/* Metal type tabs */}
      <div className="flex gap-1 rounded-lg bg-ht-dark/5 p-1">
        {metals.map((metal) => (
          <button
            key={metal}
            onClick={() => setActiveTab(metal)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === metal
                ? "bg-white text-ht-dark shadow-sm"
                : "text-ht-dark/50 hover:text-ht-dark/70"
            )}
          >
            {METAL_LABELS[metal]}
          </button>
        ))}
      </div>

      {/* Finish swatches */}
      <div className="grid grid-cols-3 gap-3">
        {finishes.map((finish) => {
          const isSelected = selectedFinish?.id === finish.id;
          return (
            <button
              key={finish.id}
              onClick={() => setFinish(finish)}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-lg p-2 transition-all",
                isSelected
                  ? "bg-ht-gold/10 ring-2 ring-ht-gold"
                  : "hover:bg-ht-dark/5"
              )}
            >
              {/* Swatch circle */}
              <div
                className={cn(
                  "h-12 w-12 rounded-full shadow-inner transition-transform group-hover:scale-110",
                  METAL_COLORS[finish.baseMetal]
                )}
                style={{
                  opacity: finish.isAged ? 0.8 : 1,
                }}
              />
              {/* Name */}
              <span className="text-center text-xs font-medium leading-tight text-ht-dark/80">
                {finish.name}
              </span>
              {/* Price modifier indicator */}
              {finish.priceModifier > 1 && (
                <span className="text-[10px] text-ht-dark/40">
                  +{Math.round((finish.priceModifier - 1) * 100)}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected finish description */}
      {selectedFinish && (
        <div className="rounded-lg border border-ht-gold/20 bg-ht-gold/5 p-3">
          <p className="text-sm font-medium text-ht-dark">
            {selectedFinish.name}
          </p>
          <p className="mt-0.5 text-xs text-ht-dark/60">
            {selectedFinish.subtitle}
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create DimensionControls**

```tsx
// src/components/configurator/DimensionControls.tsx
"use client";

import { useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useConfiguratorStore } from "@/stores/configurator";
import { getProductType } from "@/lib/products/catalogue";
import { clampWidth, clampHeight, requiresMultiPanel } from "@/lib/products/constraints";

export function DimensionControls() {
  const {
    productType,
    width,
    height,
    thickness,
    panelCount,
    setWidth,
    setHeight,
    setThickness,
  } = useConfiguratorStore();

  const product = getProductType(productType);
  if (!product) return null;

  const handleWidthChange = useCallback(
    (value: number) => setWidth(clampWidth(value, product)),
    [setWidth, product]
  );

  const handleHeightChange = useCallback(
    (value: number) => setHeight(clampHeight(value, product)),
    [setHeight, product]
  );

  const isMultiPanel = requiresMultiPanel(width, height);

  return (
    <div className="space-y-5">
      <h3 className="font-serif text-lg font-semibold">Dimensions</h3>

      {/* Width */}
      <div className="space-y-2">
        <Slider
          label="Width"
          value={width}
          onValueChange={handleWidthChange}
          min={product.minWidth}
          max={product.maxWidth}
          step={10}
        />
        <Input
          type="number"
          value={width}
          onChange={(e) => handleWidthChange(Number(e.target.value))}
          min={product.minWidth}
          max={product.maxWidth}
          step={10}
          unit="mm"
        />
      </div>

      {/* Height */}
      <div className="space-y-2">
        <Slider
          label="Height"
          value={height}
          onValueChange={handleHeightChange}
          min={product.minHeight}
          max={product.maxHeight}
          step={10}
        />
        <Input
          type="number"
          value={height}
          onChange={(e) => handleHeightChange(Number(e.target.value))}
          min={product.minHeight}
          max={product.maxHeight}
          step={10}
          unit="mm"
        />
      </div>

      {/* Thickness */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-ht-dark">Thickness</label>
        <select
          value={thickness}
          onChange={(e) => setThickness(Number(e.target.value))}
          className="h-10 w-full rounded-md border border-ht-dark/20 bg-white px-3 text-sm text-ht-dark focus:border-ht-gold focus:outline-none focus:ring-1 focus:ring-ht-gold/50"
        >
          {product.availableThicknesses.map((t) => (
            <option key={t} value={t}>
              {t}mm{t === product.defaultThickness ? " (recommended)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Multi-panel notice */}
      {isMultiPanel && (
        <div className="rounded-lg border border-amber-300/50 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-800">
            Multi-Panel Fabrication
          </p>
          <p className="mt-1 text-xs text-amber-700">
            This piece requires {panelCount} panels aged together for visual
            consistency. A surcharge of &pound;{(panelCount - 1) * 50} applies.
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create PriceDisplay**

```tsx
// src/components/configurator/PriceDisplay.tsx
"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { useConfiguratorStore } from "@/stores/configurator";

export function PriceDisplay() {
  const {
    calculatedPrice,
    priceBreakdown,
    isPriceLoading,
    selectedFinish,
    calculatePrice,
    width,
    height,
    thickness,
    mountingType,
    panelCount,
    productType,
  } = useConfiguratorStore();

  // Debounced price recalculation
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!selectedFinish) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      calculatePrice();
    }, 200);

    return () => clearTimeout(debounceRef.current);
  }, [width, height, thickness, mountingType, panelCount, productType, selectedFinish, calculatePrice]);

  if (!selectedFinish) {
    return (
      <div className="rounded-xl border border-ht-gold/20 bg-white p-5">
        <p className="text-sm text-ht-dark/50">
          Select a finish to see pricing
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ht-gold/20 bg-white p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-ht-dark/60">Total Price</span>
        {isPriceLoading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-ht-dark/10" />
        ) : (
          <span className="font-serif text-3xl font-bold text-ht-dark">
            {calculatedPrice !== null
              ? `£${calculatedPrice.toFixed(2)}`
              : "—"}
          </span>
        )}
      </div>

      {/* Price breakdown */}
      {priceBreakdown && !isPriceLoading && (
        <div className="mt-4 space-y-1.5 border-t border-ht-dark/10 pt-3">
          <BreakdownLine
            label="Base material"
            value={priceBreakdown.baseMaterial}
          />
          {priceBreakdown.finishSurcharge > 0 && (
            <BreakdownLine
              label="Finish"
              value={priceBreakdown.finishSurcharge}
            />
          )}
          {priceBreakdown.thicknessSurcharge !== 0 && (
            <BreakdownLine
              label="Thickness"
              value={priceBreakdown.thicknessSurcharge}
            />
          )}
          <BreakdownLine label="Labour" value={priceBreakdown.labourCost} />
          {priceBreakdown.mountingPrep > 0 && (
            <BreakdownLine
              label="Mounting prep"
              value={priceBreakdown.mountingPrep}
            />
          )}
          {priceBreakdown.multiPanelSurcharge > 0 && (
            <BreakdownLine
              label="Multi-panel"
              value={priceBreakdown.multiPanelSurcharge}
            />
          )}
          <BreakdownLine
            label="Delivery"
            value={priceBreakdown.deliveryEstimate}
          />
          <div className="border-t border-ht-dark/10 pt-1.5">
            <BreakdownLine
              label="Subtotal"
              value={priceBreakdown.subtotal}
              bold
            />
            <BreakdownLine label="VAT (20%)" value={priceBreakdown.vat} />
          </div>
        </div>
      )}

      <p className="mt-3 text-[10px] text-ht-dark/40">
        Prices include delivery. VAT at 20%. Estimated 5-8 week lead time.
      </p>
    </div>
  );
}

function BreakdownLine({
  label,
  value,
  bold,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between text-xs">
      <span className={bold ? "font-medium text-ht-dark" : "text-ht-dark/60"}>
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums",
          bold ? "font-medium text-ht-dark" : "text-ht-dark/60"
        )}
      >
        {value < 0 ? "-" : ""}£{Math.abs(value).toFixed(2)}
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/configurator/FinishSelector.tsx src/components/configurator/DimensionControls.tsx src/components/configurator/PriceDisplay.tsx
git commit -m "feat: add finish selector, dimension controls, and price display"
```

---

## Task 9: Configurator Page — Full Assembled View

**Files:**
- Create: `src/components/configurator/ConfigSidebar.tsx`
- Create: `src/components/configurator/ConfigSummary.tsx`
- Create: `src/app/configure/[productType]/page.tsx`

- [ ] **Step 1: Create ConfigSummary**

```tsx
// src/components/configurator/ConfigSummary.tsx
"use client";

import { useConfiguratorStore } from "@/stores/configurator";

export function ConfigSummary() {
  const {
    productType,
    selectedFinish,
    width,
    height,
    thickness,
    mountingType,
    panelCount,
  } = useConfiguratorStore();

  return (
    <div className="space-y-2">
      <h3 className="font-serif text-lg font-semibold">Your Configuration</h3>
      <div className="space-y-1.5 text-sm">
        <SummaryRow label="Product" value={productType.replace(/_/g, " ")} />
        <SummaryRow
          label="Finish"
          value={selectedFinish?.name ?? "Not selected"}
        />
        <SummaryRow label="Width" value={`${width}mm`} />
        <SummaryRow label="Height" value={`${height}mm`} />
        <SummaryRow label="Thickness" value={`${thickness}mm`} />
        <SummaryRow
          label="Mounting"
          value={mountingType.replace(/_/g, " ")}
        />
        {panelCount > 1 && (
          <SummaryRow label="Panels" value={`${panelCount} panels`} />
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ht-dark/50">{label}</span>
      <span className="font-medium capitalize text-ht-dark">{value}</span>
    </div>
  );
}
```

- [ ] **Step 2: Create ConfigSidebar**

```tsx
// src/components/configurator/ConfigSidebar.tsx
"use client";

import { FinishSelector } from "./FinishSelector";
import { DimensionControls } from "./DimensionControls";
import { PriceDisplay } from "./PriceDisplay";
import { ConfigSummary } from "./ConfigSummary";
import { Button } from "@/components/ui/button";
import { useConfiguratorStore } from "@/stores/configurator";
import Link from "next/link";

export function ConfigSidebar() {
  const { selectedFinish, calculatedPrice } = useConfiguratorStore();

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 space-y-6 p-5">
        <FinishSelector />
        <DimensionControls />
        <ConfigSummary />
        <PriceDisplay />
      </div>

      {/* Action buttons — sticky at bottom */}
      <div className="sticky bottom-0 border-t border-ht-dark/10 bg-white p-5">
        {selectedFinish && calculatedPrice ? (
          <Link href="/quote">
            <Button size="lg" className="w-full">
              Request Bespoke Quote
            </Button>
          </Link>
        ) : (
          <Button size="lg" className="w-full" disabled>
            Select a finish to continue
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create configurator page**

```tsx
// src/app/configure/[productType]/page.tsx
"use client";

import { useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ProductViewer } from "@/components/configurator/ProductViewer";
import { ConfigSidebar } from "@/components/configurator/ConfigSidebar";
import { useConfiguratorStore } from "@/stores/configurator";
import { getProductType } from "@/lib/products/catalogue";
import type { ProductType } from "@/types";

export default function ConfigurePage() {
  const params = useParams();
  const productTypeParam =
    typeof params.productType === "string"
      ? params.productType
      : params.productType?.[0] ?? "";
  const productConfig = getProductType(productTypeParam);

  const { setProductType, setWidth, setHeight, setThickness } =
    useConfiguratorStore();

  useEffect(() => {
    if (!productConfig || !productConfig.isActive) return;

    setProductType(productConfig.id as ProductType);
    setWidth(productConfig.defaultWidth);
    setHeight(productConfig.defaultHeight);
    setThickness(productConfig.defaultThickness);
  }, [productConfig, setProductType, setWidth, setHeight, setThickness]);

  if (!productConfig || !productConfig.isActive) {
    notFound();
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* 3D Viewport — 60% on desktop */}
        <div className="relative flex-[3] bg-gradient-to-br from-gray-50 to-gray-100">
          <ProductViewer />

          {/* Product name overlay */}
          <div className="absolute left-4 top-4">
            <h1 className="font-serif text-xl font-semibold text-ht-dark/80">
              {productConfig.name} Configurator
            </h1>
          </div>
        </div>

        {/* Config Sidebar — 40% on desktop */}
        <div className="w-[420px] flex-shrink-0 border-l border-ht-dark/10 bg-white">
          <ConfigSidebar />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify full configurator works**

Navigate to http://localhost:3000/configure/splashback and verify:
- Split layout: 3D viewport left (~60%), config sidebar right (420px)
- 3D metal sheet renders with orbit controls
- Finish selector shows metal-type tabs with swatches
- Clicking a finish updates the 3D model colour
- Dimension sliders update the 3D model size in real-time
- Price calculates and displays after selecting a finish
- "Request Bespoke Quote" button appears when config is complete
- Multi-panel notice appears for dimensions > 2000×1000mm
- Dimension labels on 3D model update with slider

- [ ] **Step 5: Commit**

```bash
git add src/components/configurator/ConfigSidebar.tsx src/components/configurator/ConfigSummary.tsx src/app/configure/
git commit -m "feat: add configurator page with 3D viewer and config sidebar"
```

---

## Task 10: Quote Page — Summary + Request Form

**Files:**
- Create: `src/components/configurator/QuoteForm.tsx`
- Create: `src/app/quote/page.tsx`

- [ ] **Step 1: Create QuoteForm component**

```tsx
// src/components/configurator/QuoteForm.tsx
"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfiguratorStore } from "@/stores/configurator";

export function QuoteForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    productType,
    selectedFinish,
    width,
    height,
    thickness,
    mountingType,
    panelCount,
    calculatedPrice,
    priceBreakdown,
  } = useConfiguratorStore();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    // For MVP, log to console. In production, this would POST to /api/quote/submit
    const quoteData = {
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      productType,
      finishId: selectedFinish?.id,
      finishName: selectedFinish?.name,
      width,
      height,
      thickness,
      mountingType,
      panelCount,
      calculatedPrice,
      priceBreakdown,
      notes,
      submittedAt: new Date().toISOString(),
    };

    console.log("Quote request submitted:", quoteData);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSubmitted(true);
  }

  if (isSubmitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="font-serif text-xl font-semibold text-green-800">
          Quote Request Sent
        </p>
        <p className="mt-2 text-sm text-green-700">
          Thank you, {name}! Our team will be in touch within 1-2 working days
          with your bespoke quote.
        </p>
        <p className="mt-1 text-xs text-green-600">
          A confirmation has been sent to {email}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-serif text-lg font-semibold">Your Details</h3>

      <Input
        label="Full Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Sarah Johnson"
        required
      />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="e.g. sarah@example.com"
        required
      />

      <Input
        label="Phone (optional)"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="e.g. 07700 900123"
      />

      <div className="space-y-1">
        <label className="text-sm font-medium text-ht-dark">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special requirements or questions..."
          rows={3}
          className="w-full rounded-md border border-ht-dark/20 bg-white px-3 py-2 text-sm text-ht-dark placeholder:text-ht-dark/40 focus:border-ht-gold focus:outline-none focus:ring-1 focus:ring-ht-gold/50"
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Submit Quote Request"}
      </Button>

      <p className="text-center text-[10px] text-ht-dark/40">
        We&apos;ll respond within 1-2 working days. No obligation.
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Create quote summary page**

```tsx
// src/app/quote/page.tsx
"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { QuoteForm } from "@/components/configurator/QuoteForm";
import { useConfiguratorStore } from "@/stores/configurator";

export default function QuotePage() {
  const {
    productType,
    selectedFinish,
    width,
    height,
    thickness,
    mountingType,
    panelCount,
    calculatedPrice,
    priceBreakdown,
  } = useConfiguratorStore();

  const hasConfig = selectedFinish !== null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <Link
          href={`/configure/${productType}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-ht-dark/50 hover:text-ht-gold"
        >
          &larr; Back to configurator
        </Link>

        <h1 className="font-serif text-3xl font-bold text-ht-dark">
          Quote Summary
        </h1>

        {!hasConfig ? (
          <div className="mt-8 rounded-xl border border-ht-dark/10 bg-white p-8 text-center">
            <p className="text-ht-dark/60">
              No configuration found. Please{" "}
              <Link href="/configure/splashback" className="text-ht-gold underline">
                configure your product
              </Link>{" "}
              first.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {/* Configuration Summary */}
            <div className="rounded-xl border border-ht-dark/10 bg-white p-6">
              <h2 className="font-serif text-xl font-semibold">
                Your {productType.replace(/_/g, " ")}
              </h2>

              <dl className="mt-4 space-y-3">
                <SummaryItem label="Finish" value={selectedFinish.name} />
                <SummaryItem
                  label="Base Metal"
                  value={selectedFinish.baseMetal}
                />
                <SummaryItem label="Width" value={`${width}mm`} />
                <SummaryItem label="Height" value={`${height}mm`} />
                <SummaryItem label="Thickness" value={`${thickness}mm`} />
                <SummaryItem
                  label="Mounting"
                  value={mountingType.replace(/_/g, " ")}
                />
                {panelCount > 1 && (
                  <SummaryItem
                    label="Panels"
                    value={`${panelCount} panels (aged together)`}
                  />
                )}
              </dl>

              {/* Price */}
              {calculatedPrice && (
                <div className="mt-6 border-t border-ht-dark/10 pt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-ht-dark/60">
                      Estimated Total
                    </span>
                    <span className="font-serif text-2xl font-bold text-ht-dark">
                      £{calculatedPrice.toFixed(2)}
                    </span>
                  </div>
                  {priceBreakdown && (
                    <p className="mt-1 text-xs text-ht-dark/40">
                      Inc. £{priceBreakdown.vat.toFixed(2)} VAT &middot;
                      Delivery from £{priceBreakdown.deliveryEstimate.toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              <p className="mt-4 text-xs text-ht-dark/40">
                Estimated 5-8 week lead time from order confirmation.
              </p>
            </div>

            {/* Quote Request Form */}
            <div className="rounded-xl border border-ht-dark/10 bg-white p-6">
              <QuoteForm />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <dt className="text-ht-dark/50">{label}</dt>
      <dd className="font-medium capitalize text-ht-dark">{value}</dd>
    </div>
  );
}
```

- [ ] **Step 3: Verify quote flow**

1. Navigate to http://localhost:3000/configure/splashback
2. Select a finish, adjust dimensions
3. Click "Request Bespoke Quote"
4. Verify quote page shows correct config summary
5. Fill in form and submit
6. Verify success message appears

- [ ] **Step 4: Commit**

```bash
git add src/components/configurator/QuoteForm.tsx src/app/quote/
git commit -m "feat: add quote summary page with request form"
```

---

## Task 11: Responsive Layout

**Files:**
- Modify: `src/app/configure/[productType]/page.tsx`
- Modify: `src/components/configurator/ConfigSidebar.tsx`

- [ ] **Step 1: Update configurator page for tablet/mobile**

Edit `src/app/configure/[productType]/page.tsx` to change the flex layout to stack on smaller screens:

Replace the inner layout `<div className="flex flex-1 overflow-hidden">` with responsive classes:

```tsx
<div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
  {/* 3D Viewport */}
  <div className="relative h-[50vh] flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 lg:h-auto lg:flex-[3]">
    <ProductViewer />
    <div className="absolute left-4 top-4">
      <h1 className="font-serif text-xl font-semibold text-ht-dark/80">
        {productConfig.name} Configurator
      </h1>
    </div>
  </div>

  {/* Config Sidebar */}
  <div className="flex-1 overflow-y-auto border-t border-ht-dark/10 bg-white lg:w-[420px] lg:flex-shrink-0 lg:flex-grow-0 lg:border-l lg:border-t-0">
    <ConfigSidebar />
  </div>
</div>
```

- [ ] **Step 2: Verify responsive behaviour**

- Desktop (1200px+): Side-by-side layout (60/40 split)
- Tablet (768-1199px): 3D viewport top (50vh), config below scrollable
- Mobile (<768px): Same as tablet, touch-friendly controls

- [ ] **Step 3: Commit**

```bash
git add src/app/configure/
git commit -m "feat: add responsive layout for configurator page"
```

---

## Task 12: Placeholder Textures + Final Polish

**Files:**
- Create: `public/textures/` directory with placeholder images
- Modify: various files for final adjustments

- [ ] **Step 1: Create placeholder texture images**

Generate simple coloured placeholder images using a canvas-based script or place solid-colour PNG files in `public/textures/`:

```bash
mkdir -p public/textures
```

Create minimal placeholder files (solid-colour 256x256 PNGs). For MVP, the procedural metal material colours will serve as the visual — real textures replace these later.

Create a simple generation script or manually create small placeholder files:

```bash
# Option: use ImageMagick if available, or just create empty placeholder files
# The MetalMaterial component uses procedural colours, so these aren't blocking
touch public/textures/placeholder-copper.jpg
touch public/textures/placeholder-brass.jpg
touch public/textures/placeholder-zinc.jpg
touch public/textures/placeholder-steel.jpg
touch public/textures/placeholder-normal.jpg
touch public/textures/placeholder-roughness.jpg
touch public/textures/placeholder-metalness.jpg
```

Note: The 3D preview uses procedural `MeshStandardMaterial` colours for MVP. These placeholder files prevent 404 errors if the texture loader is invoked. Real HT photographed textures will be added when available.

- [ ] **Step 2: Run build to verify no TypeScript errors**

```bash
pnpm build
```

Expected: Build succeeds with no errors. Fix any TypeScript or import issues.

- [ ] **Step 3: Run lint**

```bash
pnpm lint
```

Expected: No errors. Fix any linting issues.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 1 MVP — splashback configurator with 3D preview and pricing"
```

---

## Summary of Deliverables

After completing all 12 tasks, the MVP will include:

1. **Landing page** — Product type grid, HT branding, hero section
2. **3D configurator** — Interactive Three.js viewport with parametric metal sheet
3. **Finish selector** — 20 HT finishes organised by metal type
4. **Dimension controls** — Width/height sliders + thickness dropdown
5. **Multi-panel logic** — Auto-detection and surcharge for oversize pieces
6. **Real-time pricing** — Server-side calculation with full breakdown
7. **Quote request flow** — Summary page + customer contact form
8. **Responsive layout** — Desktop sidebar, tablet/mobile stacked
9. **Error boundary** — Graceful WebGL fallback
10. **Brand-aligned UI** — HT colours, typography, premium feel

### What's NOT included in MVP (deferred to Phase 2+):
- Real photographed texture maps (using procedural colours)
- Supabase database integration (using static data)
- Mounting type selector UI (data model ready)
- PDF quote generation
- Save/share configuration URLs
- Admin panel
- Email notifications
