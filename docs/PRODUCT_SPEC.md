# Product Specification — HT Fabrication Visualiser

## 1. Overview

The HT Fabrication Visualiser is a web-based 3D product configurator that allows Halman Thompson's customers (homeowners, interior designers, architects, bar/restaurant designers) to configure bespoke metal products, preview them in photorealistic 3D, receive real-time pricing, and submit production-ready quotes.

### Problem Statement

Halman Thompson's current bespoke ordering process is entirely manual:
1. Customer browses the website (WordPress/WooCommerce)
2. Customer fills in a text-based quote request form
3. HT sales team (Anna, Josh) responds via email/phone
4. Back-and-forth on dimensions, finish selection, mounting options
5. Physical samples shipped for finish approval
6. Quote generated manually
7. Order confirmed and enters 5–8 week production queue

**Pain points:**
- No visual preview of what the finished piece will look like
- Customers can't experiment with finishes without ordering samples
- Sales team spends excessive time on repetitive quoting
- Quote errors from manual dimension/pricing calculations
- High abandonment rate from "I'll think about it" customers who can't visualise
- Trade clients (designers, architects) need spec sheets, not just quotes

### Target Outcome

- Customers configure and preview products without sales team involvement
- Instant accurate pricing reduces quoting workload by 80%+
- Visual confidence increases conversion rate (industry benchmark: 40%+ uplift)
- Trade clients can self-serve spec sheets and PDF quotes
- New showroom (opening 2026) uses the configurator on interactive displays

## 2. User Personas

### Persona 1: Homeowner Hannah
- Renovating her kitchen, wants a copper splashback
- Non-technical, needs intuitive UX
- Wants to see finishes before committing to samples
- Price-sensitive — needs transparency
- Uses desktop and mobile

### Persona 2: Designer David
- Interior designer spec'ing multiple projects
- Needs to compare finishes quickly
- Wants PDF spec sheets with dimensions and finish codes
- May configure multiple pieces per project
- Works on desktop/tablet

### Persona 3: Architect Amara
- Commercial project — hotel reception brass cladding
- Needs multi-panel layout visualisation
- Requires technical specifications for contractors
- Budget approvals need formal quotes
- Desktop only

### Persona 4: Trade Tom
- Bar/restaurant fit-out specialist
- Needs bar tops, table tops, wall panels
- Regular repeat customer — wants a trade portal
- Needs saved configurations and order history

## 3. Feature Specification

### 3.1 Product Type Selector

**Entry point.** The first screen the user sees. Grid of product categories with representative imagery.

**Categories (Phase 1 MVP = splashbacks only, expand in Phase 2):**
- Splashbacks ★ (MVP)
- Worktops
- Bar Tops
- Table Tops
- Wall Panels
- Signage
- Metal Letters
- Tiles
- (others collapsed under "More Products")

**Behaviour:**
- Clicking a category navigates to `/configure/[productType]`
- Each category card shows a hero image of an HT piece in that category
- Category has a short description and starting price ("From £XXX")

### 3.2 3D Product Viewer

**The centrepiece.** An interactive Three.js viewport showing the configured product.

**Requirements:**
- Renders the product with the selected finish texture applied via PBR materials
- Parametric model adapts in real-time as dimensions change
- Orbit camera controls (click-drag to rotate, scroll to zoom, right-drag to pan)
- Smooth animation transitions when changing finish/dimensions
- Environment lighting that shows off metal reflections and patina depth
- Optional: HDRI environment map for realistic reflections
- Canvas resizes responsively
- Loading state with skeleton/shimmer while textures load

**3D Model Types:**
| Product | Model Description |
|---|---|
| Splashback | Flat rectangular sheet, slight edge bevel, wall-mounted context |
| Worktop | L-shape or rectangular surface with rounded front edge |
| Bar Top | Rectangular with curved front edge, shown on bar context |
| Table Top | Circular or rectangular, shown on table legs |
| Wall Panel | Flat rectangular panel, shown on wall |
| Signage | Flat plaque with extruded text on surface |
| Letters | Individual 3D extruded letterforms |
| Tiles | Grid of small square/rectangular tiles |

### 3.3 Finish Selector

**Material picker.** Shows all available finishes with visual swatches.

**Requirements:**
- Grid of circular or square swatches showing each finish's texture
- Finish name label below each swatch (e.g., "Northumberland")
- Clicking a swatch applies the texture to the 3D model in real-time
- Filter/tab by base metal: Copper | Brass | Zinc & Steel
- Currently selected finish highlighted with gold border
- Hover shows enlarged preview tooltip
- Price impact shown per finish (some finishes cost more)

**Finish Data per Swatch:**
```typescript
{
  id: string;              // "northumberland"
  name: string;            // "Northumberland Finish"
  baseMetal: MetalType;    // "copper"
  description: string;     // "Aged copper with verdigris accents"
  pricePerSheet: number;   // Base price for 2000x1000 sheet (£)
  textures: {
    albedo: string;        // URL to albedo map
    normal: string;        // URL to normal map
    roughness: string;     // URL to roughness map
    metalness: string;     // URL to metalness map
  };
  availability: "in_stock" | "made_to_order";
}
```

### 3.4 Dimension Controls

**Parametric sizing.** Users set the exact dimensions of their piece.

**Requirements:**
- Width input: slider + numeric input (mm), range depends on product type
- Height input: slider + numeric input (mm)
- Thickness selector: dropdown (0.7mm, 0.9mm, 1.2mm, 1.5mm — varies by metal)
- Max single sheet: 2000mm × 1000mm — enforced with validation
- When dimensions exceed max, show multi-panel layout:
  - Auto-calculate number of panels needed
  - Show panel split lines on the 3D model
  - Explain: "This piece requires [N] panels aged together"
  - Add multi-panel surcharge to pricing
- 3D model updates in real-time as dimensions change
- Show dimension annotations on the 3D model (like a technical drawing)
- Optional: mm/cm/inch unit toggle

**Multi-Panel Logic:**
```
If width > 2000mm OR height > 1000mm:
  Calculate optimal panel layout to minimise visible joins
  Example: 2800mm × 900mm = 2 panels of 1400mm × 900mm
  Example: 2800mm × 1200mm = 4 panels of 1400mm × 600mm
  Apply multi-panel surcharge (£50 per additional panel)
  Show join lines on 3D preview
```

### 3.5 Real-Time Pricing

**Live price display.** Updates as any configuration parameter changes.

**Requirements:**
- Prominent price display (large, bold, always visible)
- Currency: GBP (£)
- Breakdown available on hover/click:
  - Base material cost
  - Finish complexity surcharge
  - Multi-panel surcharge (if applicable)
  - Mounting preparation (if selected)
  - Delivery estimate
- Price recalculates on every state change (finish, dimensions, thickness, mounting)
- Debounced calculation (don't spam on slider drag — 200ms debounce)
- "From £XX" shown before configuration starts
- "Request Quote" if price cannot be auto-calculated (very large/complex orders)

### 3.6 Mounting Options

**How the piece will be installed.**

**Options:**
- No preparation (sheet only)
- Pre-drilled holes for screw mounting
- Adhesive mounting (smooth back, recommended glue type noted)
- Stake frame (for freestanding signs)
- Wire hanging fixings

**Behaviour:**
- Radio button selector
- Some options add to price, shown inline
- 3D model shows mounting details (drill holes visible, etc.)

### 3.7 Quote Summary & Actions

**The conversion point.** After configuration is complete.

**Requirements:**
- Full configuration summary:
  - Product type, finish name, dimensions, thickness, mounting
  - Total price (or "Request Quote" for complex orders)
  - Estimated delivery: "5–8 weeks"
- Actions:
  - **"Request Bespoke Quote"** — form submission to HT sales team
  - **"Download Spec Sheet"** — PDF with all specs + 3D render screenshot
  - **"Save Configuration"** — generates a shareable URL
  - **"Order Samples"** — links to HT's sample ordering page
  - **"Add to Cart"** (Phase 2 — WooCommerce integration)

### 3.8 Responsive Design

- **Desktop (1200px+):** Full 3D viewport (60% width) + config panel sidebar (40%)
- **Tablet (768–1199px):** 3D viewport stacked above config panel
- **Mobile (< 768px):** 3D viewport with swipe-up config drawer
- Touch controls for 3D: pinch-zoom, swipe-rotate
- If WebGL not supported: show static rendered images as fallback

## 4. Non-Functional Requirements

- **Performance:** First Contentful Paint < 2s, 3D scene interactive < 4s
- **Textures:** Lazy-load textures, use compressed formats (KTX2/Basis)
- **SEO:** Product type pages are SSR, configurator is client-side
- **Analytics:** Track configuration completions, most popular finishes, abandonment points
- **Accessibility:** Keyboard navigable config controls, screen reader labels
- **Browser Support:** Chrome, Safari, Firefox, Edge (latest 2 versions)

## 5. Success Metrics

| Metric | Target |
|---|---|
| Quote request conversion rate | >15% of configurator sessions |
| Average configuration time | < 5 minutes |
| Sales team quoting time saved | 80% reduction |
| Sample order rate from configurator | >25% of sessions |
| Return visitor rate | >30% |
