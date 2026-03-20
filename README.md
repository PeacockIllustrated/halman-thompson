# HT Fabrication Visualiser

> 3D product configurator for **Halman Thompson** — Bespoke Metal Creations

Built by [Onesign & Digital](https://onesign.digital)

## Overview

A web-based 3D configurator that lets Halman Thompson's customers select product types, choose from artisan-aged metal finishes, set dimensions, preview in photorealistic 3D, and generate instant quotes.

**Reference model:** [Salsita 3D Configurator](https://salsita.ai) — bespoke equivalent built for HT's product range.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| 3D Engine | Three.js + React Three Fiber |
| State | Zustand |
| Styling | Tailwind CSS 4 |
| UI | Radix UI primitives |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Deployment | Vercel |

## Getting Started

```bash
# Clone
git clone https://github.com/PeacockIllustrated/ht-fabrication-visualiser.git
cd ht-fabrication-visualiser

# Install
pnpm install

# Configure
cp .env.example .env.local
# Fill in Supabase credentials

# Run
pnpm dev
```

## Documentation

| Document | Purpose |
|---|---|
| [CLAUDE.md](./CLAUDE.md) | Claude Code project instructions — read first |
| [docs/PRODUCT_SPEC.md](./docs/PRODUCT_SPEC.md) | Detailed product specification |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Technical architecture |
| [docs/DATA_MODEL.md](./docs/DATA_MODEL.md) | Database schema + TypeScript types |
| [docs/HALMAN_THOMPSON_CONTEXT.md](./docs/HALMAN_THOMPSON_CONTEXT.md) | Client background |
| [docs/SALSITA_REFERENCE.md](./docs/SALSITA_REFERENCE.md) | Reference model analysis |

## Development Phases

- **Phase 1:** Splashback configurator (MVP)
- **Phase 2:** Full product range
- **Phase 3:** Signage configurator
- **Phase 4:** AI assistant, AR, trade portal

---

*Confidential — Onesign & Digital × Halman Thompson Ltd*
