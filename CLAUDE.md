# CLAUDE.md — Halman Thompson 3D Fabrication Visualiser

## Project Identity

**Client:** Halman Thompson Ltd — Bespoke Metal Creations
**Built by:** Onesign & Digital (design agency, signage + digital products)
**Repo name:** `ht-fabrication-visualiser`
**Codename:** HT Forge

## What This Is

A web-based 3D product configurator for Halman Thompson, a premium bespoke metal fabrication company based in Newcastle upon Tyne. Customers select a product type (splashback, worktop, bar top, signage, wall panel, etc.), choose from HT's named artisan finishes (aged copper, patina brass, zinc, corten steel), set dimensions, and see a photorealistic 3D preview with real-time pricing — then submit a production-ready quote or add to cart.

**Reference model:** Salsita.ai 3D Configurator (salsita.ai/3d-configurator). We are building a bespoke equivalent tailored to HT's product range, not licensing Salsita's platform.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **3D Engine:** Three.js + React Three Fiber (@react-three/fiber, @react-three/drei)
- **State Management:** Zustand (for configurator state)
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI primitives + custom styled components
- **Database:** Supabase (product catalogue, finishes, pricing rules, orders)
- **Auth:** Supabase Auth (for trade portal, admin)
- **Payments/Quotes:** Stripe (future) + PDF quote generation
- **Deployment:** Vercel
- **Package Manager:** pnpm

## Architecture Overview

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing / product type selector
│   ├── configure/
│   │   └── [productType]/
│   │       └── page.tsx          # Main configurator view
│   ├── quote/
│   │   └── page.tsx              # Quote summary + PDF generation
│   ├── admin/                    # Admin panel (manage finishes, pricing)
│   └── api/                      # API routes
│       ├── pricing/              # Real-time price calculation
│       └── quote/                # Quote generation + PDF export
├── components/
│   ├── configurator/
│   │   ├── ProductViewer.tsx     # Three.js 3D viewport
│   │   ├── MaterialSwatch.tsx    # Finish selector with texture previews
│   │   ├── DimensionControls.tsx # Parametric dimension sliders/inputs
│   │   ├── MountingSelector.tsx  # Mounting option picker
│   │   ├── ProductTypeNav.tsx    # Product category navigation
│   │   ├── PriceDisplay.tsx      # Real-time price readout
│   │   └── ConfigSummary.tsx     # Current config summary sidebar
│   ├── three/
│   │   ├── MetalSheet.tsx        # Parametric metal sheet 3D model
│   │   ├── SignLetters.tsx       # 3D extruded text for signage
│   │   ├── MaterialShader.tsx    # Custom PBR shader for aged metals
│   │   ├── EnvironmentScene.tsx  # Kitchen/bar/hotel room scenes
│   │   └── CameraControls.tsx    # Orbit + zoom controls
│   ├── ui/                       # Shared UI primitives
│   └── layout/                   # Page layout components
├── lib/
│   ├── pricing/
│   │   └── engine.ts             # Pricing calculation logic
│   ├── products/
│   │   ├── catalogue.ts          # Product type definitions
│   │   ├── finishes.ts           # Named finish registry
│   │   └── constraints.ts        # Dimension constraints & validation
│   ├── supabase/
│   │   └── client.ts             # Supabase client + types
│   └── utils/
│       ├── dimensions.ts         # Unit conversion, multi-panel logic
│       └── pdf.ts                # Quote PDF generation
├── stores/
│   └── configurator.ts           # Zustand store for config state
├── types/
│   └── index.ts                  # Shared TypeScript types
└── assets/
    └── textures/                 # PBR texture maps for each finish
        ├── northumberland/       # albedo, normal, roughness, metalness
        ├── berkshire/
        ├── ayrshire/
        └── ...
```

## Key Domain Concepts

### Named Finishes (HT's Hero Content)
Each finish is named after an English county and is hand-aged with a unique patina. These are NOT uniform textures — each piece is one-of-a-kind. In the configurator, we use high-res photographed texture maps.

| Finish Name | Base Metal | Description |
|---|---|---|
| Northumberland | Copper | Aged copper with verdigris accents |
| Hertfordshire | Copper | Deep aged copper |
| Ayrshire | Copper | Dappled copper with verdigris specs |
| Cheshire | Copper | Rich aged copper |
| Somerset | Brass | Stained glass effect brass |
| Wiltshire | Brass | Classic aged brass |
| Berkshire | Brass | Bronzed brass |
| Cambridgeshire | Brass | Mill brass finish |
| — | Various | Natural, brushed, antique, lightly burnished variants |
| — | Zinc | Lightly aged zinc, antique zinc |
| — | Steel | Blackened steel, corten steel (weathered) |

### Product Types
- Splashbacks (hero product — most orders)
- Worktops / Countertops
- Bar Tops
- Table Tops (dining, coffee)
- Wall Panels / Cladding
- Tiles
- Metal Signage (brass, zinc — engraved, laser cut, 3D effect)
- Metal Letters & Numbers
- Kitchen Plinths
- Cooker Hoods
- Stair Risers
- Bath Panels
- Cupboard Doors
- Laser Cut Screens
- Door Push Plates

### Dimension Constraints
- Max single sheet: 2000mm × 1000mm
- Larger pieces require multi-panel fabrication (aged together for consistency)
- Recommended splashback thickness: 0.9mm
- Available thicknesses vary by metal type

### Pricing Logic
Price = f(metal_type, finish_complexity, area_mm2, thickness, product_type_labour, mounting_type)
- Base metal cost per m² (copper > brass > zinc > steel)
- Finish complexity multiplier (aged/patina finishes cost more than natural)
- Area calculation with multi-panel surcharge for oversize pieces
- Product-specific labour (signage engraving > flat sheet cutting)
- Mounting preparation (drilled holes, adhesive prep, stake frame)

## Brand & Design Guidelines

### Colours
- **Primary dark:** `#1a1a2e` (near-black navy)
- **Gold accent:** `#b8860b` (dark goldenrod — matches HT's logo)
- **Copper accent:** `#b87333`
- **Brass accent:** `#cd9b1d`
- **Zinc accent:** `#8a8d8f`
- **Warm background:** `#faf7f2` (cream)
- **Onesign teal:** `#4e7e8c` (our brand — used sparingly in admin/internal)

### Typography
- Headings: Serif or elegant display face (the brand is premium/artisan)
- Body: Clean sans-serif for readability in the configurator UI
- The feel should be: premium, handcrafted, warm — NOT clinical or tech-startup

### Design Tone
This is a luxury artisan brand. The configurator should feel like a high-end showroom experience, not a DIY tool. Think Caesarstone visualiser meets Salsita's 3D polish — but warmer, more tactile, more handcrafted.

## Development Phases

### Phase 1 — Splashback Configurator (MVP)
- [ ] Product type selector (start with splashbacks only)
- [ ] 3D parametric metal sheet model (width × height × thickness)
- [ ] Named finish selector with texture swatches
- [ ] Dimension input (sliders + numeric, respecting 2000×1000 max)
- [ ] Multi-panel logic for oversize pieces
- [ ] Thickness selector
- [ ] Real-time price calculation
- [ ] Basic orbit camera controls
- [ ] Quote summary + "Request Quote" form
- [ ] Responsive (desktop-first, tablet-friendly)

### Phase 2 — Full Product Range
- [ ] Expand to all product types (worktops, bar tops, wall panels, etc.)
- [ ] Product-specific 3D models (table legs, cooker hood shape, etc.)
- [ ] Mounting option selector
- [ ] PDF spec sheet generation
- [ ] Save/share configuration (URL-based state)
- [ ] Admin panel for managing finishes and pricing

### Phase 3 — Signage Configurator
- [ ] Text input with live 3D rendered preview on metal
- [ ] Font selector
- [ ] Logo upload + SVG placement on metal surface
- [ ] Fabrication method selector (engraved, laser cut, 3D effect)
- [ ] Size calculator with auto-pricing
- [ ] Three.js text extrusion with metal material

### Phase 4 — Advanced Features
- [ ] AI assistant (conversational configuration via Claude API)
- [ ] AR photo overlay (WebXR — upload room photo, overlay finish)
- [ ] Room scene contexts (kitchen, bar, hotel reception)
- [ ] Trade portal with saved configs and bulk ordering
- [ ] WooCommerce integration for HT's existing site
- [ ] Manufacturing output (cutting specs, BOM)

## Coding Standards

- Use TypeScript strict mode throughout
- All components are functional React with hooks
- Use `"use client"` directive only where needed (Three.js components)
- Zustand store for all configurator state — single source of truth
- Three.js materials use PBR (Physically Based Rendering) pipeline
- Custom shaders for aged metal effects (patina, verdigris, tarnish)
- All prices in GBP (£), dimensions in mm (with optional cm/inch toggle)
- Minimum 3 texture maps per finish: albedo, normal, roughness
- Error boundaries around all Three.js components
- Mobile: show 2D preview fallback if WebGL not supported

## Key Files to Read First

1. `CLAUDE.md` — This file (project overview)
2. `docs/PRODUCT_SPEC.md` — Detailed product specification
3. `docs/ARCHITECTURE.md` — Technical architecture deep dive
4. `docs/DATA_MODEL.md` — Database schema and type definitions
5. `docs/HALMAN_THOMPSON_CONTEXT.md` — Client background and business context
6. `docs/SALSITA_REFERENCE.md` — Feature-by-feature breakdown of the Salsita model we're building toward

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint + type check
pnpm db:generate  # Generate Supabase types
pnpm db:migrate   # Run database migrations
```
