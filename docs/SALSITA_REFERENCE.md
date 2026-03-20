# Salsita 3D Configurator — Reference Model

## What Salsita Is

Salsita (salsita.ai) is a Prague-based company that builds bespoke 3D product configurators. They're NOT an off-the-shelf plugin — they offer a pre-built framework that gets customised per client. HQ Prague, office in Atlanta. Clients include L'Atelier Paris (luxury kitchens), Easysteel (railing systems), KILO (designer furniture), Centro Cushions, Moduline, Azenco (pergolas).

**We are NOT licensing Salsita.** We are using their platform as the reference standard for what a best-in-class 3D configurator looks like, then building our own bespoke equivalent for Halman Thompson using our own stack.

## Salsita's Five Feature Pillars (and How We Map Them)

### 1. Parametric Models
**What Salsita does:** 3D models adapt to any dimension in real-time while maintaining true-to-scale accuracy. A table diameter slider changes from 200mm to 500mm and the 3D model morphs proportionally.

**What we build for HT:** Metal sheet geometry generated procedurally (not static GLTF). Width/height/thickness sliders update the 3D model in real-time. Texture UV mapping scales correctly so the aged copper pattern looks right at 600mm or 1800mm. Multi-panel split lines appear automatically when dimensions exceed 2000×1000mm.

### 2. Visual CPQ (Configure, Price, Quote)
**What Salsita does:** Price updates in real-time as users change any option. Displayed prominently with "Add to Cart" integration. Automates quoting, eliminating sales team involvement for standard orders.

**What we build for HT:** Server-side pricing engine calculates price based on metal_type × finish_complexity × area × thickness × labour × mounting. Price displayed prominently with GBP formatting. Breakdown available on hover. Debounced 200ms on slider drag. "Request Bespoke Quote" for complex orders, instant pricing for standard ones.

### 3. Modular Product Configuration
**What Salsita does:** Handles multi-component products — shelving units with multiple shelves, railing systems with posts/rails/connectors. Users add/remove/rearrange components.

**What we build for HT:** Multi-panel layouts for oversize pieces. Product type switching (splashback → worktop → signage). Future: modular kitchen configurations showing multiple HT pieces together (splashback + worktop + plinth in one scene).

### 4. AI Design Assistant
**What Salsita does:** Conversational AI embedded in the configurator. Understands product logic, rules, and company info. Users say "change to blue leather" and the AI applies it. Works via voice and text.

**What we build for HT (Phase 4):** Claude-powered assistant that understands HT's finishes and products. Customer says "I want something warm and coppery for behind my AGA, about 90cm wide" and the AI configures: product=splashback, finish=Cheshire, width=900mm, height=600mm. Also acts as a product knowledge base — answering care questions, finish comparisons, etc.

### 5. Manufacturing Outputs
**What Salsita does:** Completed configurations automatically generate CAD files, Bills of Materials, technical drawings, and PDF. Syncs with ERP/CRM/PLM systems. Production-ready without manual work.

**What we build for HT:** PDF quote/spec sheets with full configuration details, 3D render screenshot, dimension diagram, finish code, mounting spec, multi-panel layout plan. Quote submission creates a Supabase record and emails the HT sales team. Future: direct WooCommerce order creation, workshop-ready cutting specs.

## Salsita UX Patterns to Replicate

### Layout Pattern
- **Desktop:** 3D viewport takes ~60% width (left), config panel ~40% (right sidebar)
- **Mobile:** 3D viewport top, config panel scrollable below
- **Navigation:** Tabbed sections in config panel (Material | Size | Options | Review)
- **Price:** Always visible, top-right or floating bar

### Interaction Pattern
- **3D controls:** Orbit (left-drag), zoom (scroll), pan (right-drag)
- **Material change:** Click swatch → instant material swap with smooth transition
- **Dimension change:** Slider + numeric input combo, model updates in real-time
- **Progress:** Visual step indicator showing how far through configuration
- **Confirmation:** Clear "Review" step before submission with full summary

### Visual Quality Bar
Salsita's renders are photorealistic. Key techniques we must match:
- **HDRI environment maps** for realistic metal reflections
- **PBR materials** with proper metalness/roughness
- **Contact shadows** for grounding
- **Anti-aliasing** for clean edges
- **Filmic tone mapping** for natural colour response
- **Subtle SSAO** for depth
- **Smooth transition animations** between states

## Key Case Studies

### Easysteel (Most Analogous to HT)
Steel railing manufacturer. Before: manual quoting, no visualisation. After: buyers configure custom railings online, see 3D preview, get instant pricing, submit production-ready orders. Result: 90% less manual work, faster sales cycles, higher conversion.

### L'Atelier Paris (Luxury Positioning)
Ultra-luxury French kitchen ranges ($40K+). The configurator maintained their premium brand feel while making $40K products configurable online. Mobile-first with conversational AI. Key takeaway: luxury products CAN be self-configured if the UX matches the brand quality.

### KILO (Parametric Furniture)
Designer furniture with parametric dimensions. The diameter/width/height sliders are exactly what we need for HT's sheet products. Result: 2-3× faster sales, 40% lower operational costs.

## What Salsita Charges (Context)
Enterprise SaaS pricing, not published. Based on complexity tiers. Their clients are mid-to-large manufacturers. This positions our bespoke build as high-value — we're delivering Salsita-grade functionality tailored specifically to HT's niche, at a fraction of the ongoing SaaS cost.

## Technology Salsita Uses (For Reference)
- Cloud-native, API-based architecture (MACH-compliant)
- Custom 3D rendering framework (likely Three.js-based)
- Headless — frontend decoupled from backend
- Integrates with Shopify, WooCommerce, custom e-commerce
- Hosted on AWS/Azure/Google Cloud
- Real-time pricing engine (server-side)
- PDF/CAD/BOM generation pipeline

Our stack (Next.js + Three.js/R3F + Supabase + Vercel) achieves comparable architecture with modern DX.
