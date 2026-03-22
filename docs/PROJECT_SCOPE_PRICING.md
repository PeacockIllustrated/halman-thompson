# Project Scope Evaluation & Pricing Research Brief

## 1. What This Project Encompasses

The HT Fabrication Visualiser is not a single tool — it's a **vertically integrated digital product platform** that replaces or consolidates at least **12 independently purchasable software categories** into one bespoke application. Understanding this is critical to pricing it appropriately.

### Capability Breakdown

| # | Capability | Description | Phase |
|---|-----------|-------------|-------|
| 1 | **3D Product Configurator** | Interactive Three.js/R3F viewport with parametric geometry, PBR metal materials, custom aged-metal shaders, orbit controls, environment lighting, post-processing (SSAO, tone mapping) | 1 |
| 2 | **Visual CPQ Engine** (Configure, Price, Quote) | Server-side real-time pricing engine with multi-variable calculation (metal type × finish complexity × area × thickness × labour × mounting), debounced live updates, price breakdown display | 1 |
| 3 | **Product Catalogue System** | 18 product types with per-type constraints (min/max dimensions, allowed metals, thicknesses, mounting types, labour multipliers), parametric 3D model switching | 1–2 |
| 4 | **Material/Finish Library** | 21+ named artisan finishes with full PBR texture sets (albedo, normal, roughness, metalness, patina), swatch previews, real-world-scale UV mapping, lazy-loading with KTX2 compression | 1 |
| 5 | **Multi-Panel Fabrication Logic** | Automatic panel layout calculation when dimensions exceed 2000×1000mm, optimal split algorithms, visual join lines on 3D model, surcharge pricing | 1 |
| 6 | **PDF Quote/Spec Sheet Generation** | Branded PDF output with configuration summary, 3D render screenshot, dimension diagram, finish code, mounting spec, panel layout — for both customers and trade professionals | 1–2 |
| 7 | **Shareable Configuration System** | URL-based state serialisation so configs can be saved, shared, and reopened with full state restoration | 2 |
| 8 | **Admin Panel** | Internal dashboard for managing finishes, pricing rules, product types, and viewing/actioning quote requests | 2 |
| 9 | **Authentication & Trade Portal** | Supabase Auth with role-based access (admin, trade), saved configurations, order history, bulk ordering for repeat trade customers | 2–4 |
| 10 | **Signage Configurator** | Text input with live 3D extruded text rendering, font selection, logo SVG upload and placement, fabrication method picker (engraved, laser cut, 3D effect, etched), auto-sizing and pricing | 3 |
| 11 | **AI Design Assistant** | Claude API-powered conversational interface that understands HT's product range, interprets natural language requests ("warm copper, 90cm wide, behind my AGA"), auto-configures the visualiser, answers product/care questions | 4 |
| 12 | **AR Photo Overlay** | WebXR-based augmented reality — upload a room photo, overlay the configured finish to see it in-situ | 4 |
| 13 | **Room Scene Contexts** | GLTF environment models (kitchen, bar, hotel reception) showing the product installed in realistic settings | 4 |
| 14 | **E-commerce Integration** | WooCommerce bridge to HT's existing WordPress site for direct ordering, cart management, payment processing | 4 |
| 15 | **Manufacturing Outputs** | Production-ready cutting specs, Bills of Materials, technical drawings — bridging sales to workshop | 4 |

---

## 2. What These Would Cost Independently

This is the core value proposition for the client: the alternative to building this in-house is stitching together multiple SaaS platforms, each with their own subscription, limitations, and integration headaches.

### Independent Software Cost Analysis

| Capability | Independent Alternative | Typical Annual Cost | Limitations vs. Bespoke |
|-----------|------------------------|-------------------|------------------------|
| **3D Product Configurator** | Salsita.ai (enterprise), Threekit, Zakeke, Sketchfab Configurator | £30,000–£120,000/yr (enterprise SaaS) | Generic, not optimised for aged metal PBR; ongoing SaaS fees; limited customisation; no patina shader |
| **CPQ / Pricing Engine** | Salesforce CPQ, PandaDoc CPQ, DealHub | £12,000–£60,000/yr | Over-engineered for HT's needs; still requires custom pricing rules; doesn't integrate with 3D |
| **Product Catalogue / PIM** | Akeneo, Salsify, Pimcore | £5,000–£30,000/yr | Separate system to maintain; no 3D integration; doesn't understand fabrication constraints |
| **Texture/Material Library Management** | Custom or Substance 3D (Adobe) | £2,000–£8,000/yr + photographer time | No web delivery pipeline; manual texture management |
| **PDF Quote Generation** | PandaDoc, Proposify, custom dev | £3,000–£12,000/yr | No 3D render integration; manual configuration entry |
| **Admin Dashboard** | Retool, custom WordPress admin, Supabase Studio | £2,000–£15,000/yr or custom dev cost | Separate from configurator; no unified data model |
| **Trade Portal** | Custom WooCommerce B2B plugin, TradeGecko/QuickBooks Commerce | £3,000–£15,000/yr | Not integrated with configurator; separate login system |
| **Signage Configurator** | Specialist signage software (SignVox, FlexiSIGN) | £5,000–£20,000/yr | Desktop-only; not web-based; no metal-specific rendering |
| **AI Assistant** | Intercom + Fin AI, Drift, custom ChatGPT integration | £6,000–£24,000/yr | No product configurator awareness; can't auto-set config state; generic responses |
| **AR Visualisation** | Augment, Vossle, ViewAR | £5,000–£25,000/yr | Separate experience from configurator; limited material accuracy |
| **E-commerce Integration** | WooCommerce + custom plugin dev | £5,000–£15,000 one-off + maintenance | Separate from configurator; manual data sync |
| **Manufacturing Output** | AutoCAD, Fusion 360, custom ERP module | £5,000–£20,000/yr | Completely disconnected from sales flow |

### Total Independent Software Stack Cost

| Scenario | Annual Cost | Notes |
|----------|------------|-------|
| **Minimum viable (Phases 1–2 only)** | £60,000–£260,000/yr | 3D configurator + CPQ + catalogue + PDF + admin |
| **Full platform (Phases 1–4)** | £83,000–£364,000/yr | All capabilities stacked |
| **5-year total cost of SaaS stack** | £300,000–£1,800,000 | Cumulative, with typical 10–15% annual price increases |

**And the SaaS stack still wouldn't be integrated.** Each tool is a silo. Data doesn't flow. The customer journey is fragmented. The brand experience is inconsistent. And you're at the mercy of each vendor's roadmap, pricing changes, and sunset decisions.

---

## 3. Growth Opportunity & Revenue Potential

### Direct Revenue Enablement

| Opportunity | Impact | How the App Enables It |
|------------|--------|----------------------|
| **Reduced quoting workload** | 80% reduction in manual quoting time | Self-service pricing + automated quote generation |
| **Higher conversion rate** | 40%+ uplift (industry benchmark for visual configurators) | Customers can see and price their piece before committing |
| **Larger average order value** | Customers upgrade finishes when they can see the difference | Side-by-side 3D finish comparison drives upselling |
| **Trade client self-service** | Designers specify multiple projects without sales team | Saved configs, PDF spec sheets, bulk ordering |
| **Showroom digital experience** | Interactive displays in 2026 showroom | Configurator runs on touchscreens in-store |
| **Extended product range sales** | Customers discover products they didn't know HT made | Product type navigator exposes full 18-category range |
| **International reach** | Self-service removes timezone/language friction | 24/7 configurator doesn't need sales team availability |
| **Repeat business** | Saved configs, trade portal, order history | Returning customers configure faster |

### Platform Growth Trajectory

**Year 1 (Phases 1–2):** Splashback configurator + full product range. Core value delivery.

**Year 2 (Phase 3):** Signage configurator opens an entirely new product vertical — signage is higher-margin, lower-material-cost, and appeals to a different customer segment (businesses, hospitality, retail).

**Year 3+ (Phase 4):** AI assistant, AR, manufacturing outputs. This is where the app transitions from a sales tool to a **full operational platform** — connecting customer-facing configuration directly to workshop production. At this point, the app IS the business's digital nervous system.

### Defensibility & Strategic Value

- **Custom shaders for aged metal** — no off-the-shelf 3D configurator handles patina/verdigris rendering. This is a genuine competitive moat.
- **Domain-specific pricing engine** — encodes HT's exact business logic (multi-panel surcharges, finish complexity multipliers, metal-specific labour rates). Can't be replicated by generic CPQ tools without equivalent customisation cost.
- **Owned infrastructure** — no SaaS dependency. HT owns their configurator outright. No vendor lock-in, no per-seat fees, no feature gates.
- **Data ownership** — every configuration, every quote, every finish preference is captured in HT's own Supabase database. This data is a goldmine for product development, inventory planning, and marketing.

---

## 4. Pricing Research Prompt

Use the following prompt to research and validate project pricing. This can be given to Claude, a research assistant, or used as a structured brief for internal costing.

---

### PROMPT: Project Pricing Research for HT Fabrication Visualiser

**Objective:** Research and compile market-rate pricing data for a bespoke 3D product configurator project with the scope described below. The output should support a commercial proposal to Halman Thompson Ltd, a premium bespoke metal fabrication company in Newcastle.

**Context:**
- Client: Halman Thompson Ltd (2–10 employees, expanding, £24–£290 per sheet product range, 5-star Trustpilot, luxury artisan positioning)
- Builder: Onesign & Digital (design agency, signage + digital)
- The project replaces a fully manual quoting process with an interactive 3D web configurator
- Tech stack: Next.js 14+, TypeScript, Three.js/React Three Fiber, Zustand, Tailwind CSS 4, Supabase, Vercel
- Phased delivery across 4 phases

**Research the following:**

#### A. Market Rates for Comparable Projects

1. **What do agencies charge for bespoke 3D product configurators?**
   - Research case studies from Salsita.ai, Threekit, Zakeke, and independent agencies
   - Focus on configurators for manufacturing/fabrication clients specifically
   - Distinguish between SaaS licensing vs. bespoke development costs
   - Include both UK and international pricing benchmarks

2. **What do agencies charge for custom Three.js / React Three Fiber projects?**
   - Research day rates for senior Three.js developers (UK market)
   - Research project rates for custom shader development (PBR, procedural materials)
   - Include photorealistic web 3D rendering projects as comparables

3. **What is the going rate for CPQ (Configure, Price, Quote) system development?**
   - Bespoke CPQ builds for SMEs vs. enterprise
   - Integration with 3D visualisation

#### B. Phase-by-Phase Effort Estimation

Research typical development timeframes for each component and estimate based on market rates:

| Phase | Components | Research Questions |
|-------|-----------|-------------------|
| **Phase 1 (MVP)** | 3D parametric viewer, PBR material system with 21+ finishes, finish selector UI, dimension controls with validation, multi-panel logic, real-time pricing engine, quote form, responsive design | How many developer-weeks for a custom Three.js configurator MVP? What do custom PBR shader systems cost? |
| **Phase 2** | 18 product types with unique 3D models, mounting options, PDF generation, shareable configs, admin panel, Supabase auth + trade portal | How much to expand a configurator to a full product catalogue? What does admin panel development cost? |
| **Phase 3** | 3D text extrusion engine, font system, SVG logo upload + 3D placement, fabrication method logic, signage pricing | What do custom 3D text rendering systems cost? How much for a signage-specific configurator? |
| **Phase 4** | Claude API AI assistant with product knowledge, WebXR AR overlay, GLTF room scenes, WooCommerce integration, manufacturing BOM output | What do AI chatbot integrations cost? What does WebXR AR development cost? What do e-commerce integrations cost? |

#### C. Value-Based Pricing Anchors

1. **Cost of alternatives:** The independent SaaS stack to achieve equivalent functionality costs £60,000–£364,000/year (see analysis above). Over 5 years, that's £300K–£1.8M. How should this inform the bespoke build price?

2. **Revenue impact:** If the configurator increases conversion by 40% (industry benchmark) and HT's average order is £150–£500, what annual revenue uplift can be projected? Use this to justify value-based pricing.

3. **Quoting efficiency:** If the configurator saves 80% of manual quoting time (currently ~20 hours/week across Anna and Josh), what is the annual labour saving in £? (Use UK living wage + employer costs for context.)

4. **Showroom value:** HT is opening a showroom in 2026. What do interactive retail display solutions cost? (Typically £10,000–£50,000 for hardware + software.) The configurator provides this at zero additional software cost.

#### D. Pricing Model Options

Research and recommend which pricing model best suits this engagement:

| Model | Description | Pros | Cons |
|-------|------------|------|------|
| **Fixed project fee** | Total price per phase | Client budget certainty | Risk of scope creep; may underprice |
| **Time & materials** | Day rate × estimated days | Fair for complexity; flexible | Client cost uncertainty |
| **Hybrid** | Fixed fee per phase with T&M for changes | Balanced risk | More complex contracting |
| **Retainer + build** | Monthly retainer for ongoing development | Steady revenue; long-term relationship | Client may resist open-ended commitment |
| **Value-based** | Priced as a fraction of the value delivered (e.g., % of SaaS alternative cost, or % of projected revenue uplift) | Highest potential fee; justified by ROI | Harder to sell to price-sensitive SME |

#### E. Ongoing Costs to Factor Into Proposal

| Item | Estimated Annual Cost | Who Pays |
|------|----------------------|----------|
| Vercel hosting (Pro) | £240/yr | HT |
| Supabase (Pro) | £300/yr | HT |
| Domain + SSL | £50/yr | HT |
| Texture photography (per new finish) | £200–£500 per finish | HT |
| Claude API (AI assistant usage) | £500–£2,000/yr (usage-dependent) | HT |
| Maintenance & updates | 15–20% of build cost annually | HT (paid to Onesign) |
| Feature enhancements | T&M or retainer | HT |

#### F. Competitive Intelligence

1. What did Salsita charge Easysteel, L'Atelier Paris, or KILO for their configurators? (Any public data, case study hints, or Glassdoor/interview insights?)
2. What are UK agencies (Pocketworks, Potato, Made by Many, Clearleft, etc.) charging for comparable interactive web app projects?
3. Are there any public case studies of Three.js/R3F configurator builds with published budgets?

---

### Output Format

Structure the research output as:
1. **Executive Summary** — Recommended price range with justification
2. **Market Comparables** — Table of comparable projects with published/estimated costs
3. **Phase Costing** — Estimated cost per phase with effort breakdown
4. **Value Justification** — ROI analysis for the client
5. **Pricing Model Recommendation** — Which model to use and why
6. **Risk Factors** — What could increase cost (texture complexity, scope creep, Supabase migration, etc.)

---

## 5. Summary Position

This project is not "a website with some 3D." It is a **bespoke digital product platform** that:

- Replaces £60K–£364K/year in SaaS subscriptions
- Consolidates 12+ independent software categories into one integrated experience
- Delivers measurable ROI through conversion uplift, quoting efficiency, and trade self-service
- Creates a competitive moat with custom metal rendering technology
- Scales from MVP to full operational platform across 4 phases
- Gives HT complete ownership of their digital sales infrastructure

Price accordingly.
