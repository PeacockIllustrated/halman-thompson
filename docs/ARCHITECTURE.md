# Architecture — HT Fabrication Visualiser

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel Edge                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Next.js     │  │  API Routes  │  │  Edge         │  │
│  │  App Router  │  │  /api/*      │  │  Middleware    │  │
│  │  (SSR+CSR)   │  │  (pricing,   │  │  (auth, geo)  │  │
│  │              │  │   quotes)    │  │               │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────────┘  │
│         │                 │                              │
│  ┌──────┴─────────────────┴──────────────────────────┐  │
│  │           Client-Side Application                  │  │
│  │  ┌────────────┐  ┌────────────┐  ┌─────────────┐ │  │
│  │  │ React      │  │ Three.js   │  │ Zustand     │ │  │
│  │  │ Components │  │ R3F Scene  │  │ State Store │ │  │
│  │  └────────────┘  └────────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
┌─────────┴─────────┐  ┌─────────┴─────────┐
│    Supabase        │  │   Asset Storage    │
│  ┌──────────────┐  │  │  ┌──────────────┐  │
│  │  PostgreSQL   │  │  │  │  Vercel Blob  │  │
│  │  - products   │  │  │  │  or Supabase  │  │
│  │  - finishes   │  │  │  │  Storage      │  │
│  │  - pricing    │  │  │  │  - textures   │  │
│  │  - quotes     │  │  │  │  - HDRIs      │  │
│  │  - orders     │  │  │  │  - models     │  │
│  │  - users      │  │  │  └──────────────┘  │
│  └──────────────┘  │  └────────────────────┘
│  ┌──────────────┐  │
│  │  Auth         │  │
│  │  (trade/admin)│  │
│  └──────────────┘  │
└────────────────────┘
```

## Three.js / React Three Fiber Architecture

### Scene Graph

```
<Canvas>
  <Environment />              ← HDRI lighting for metal reflections
  <PerspectiveCamera />
  <OrbitControls />            ← User camera interaction

  <ProductModel>               ← Switches based on product type
    <MetalSheetGeometry />     ← Parametric: width × height × thickness
    <AgedMetalMaterial />      ← Custom PBR material with HT textures
    <DimensionAnnotations />   ← On-model dimension labels
    <PanelSplitLines />        ← Visible when multi-panel required
  </ProductModel>

  <ContextScene>               ← Optional room context
    <KitchenScene />           ← GLTF model of kitchen environment
    <WallMount />              ← Shows product mounted on wall
  </ContextScene>

  <ContactShadow />            ← Ground shadow for realism
  <EffectComposer>             ← Post-processing
    <SSAO />                   ← Ambient occlusion
    <ToneMapping />            ← Filmic tone mapping
  </EffectComposer>
</Canvas>
```

### Custom Aged Metal Shader

The key technical challenge. HT's finishes are NOT uniform — they have organic variation, patina spots, verdigris accents, and tarnish patterns. The shader must:

1. **Base PBR layer:** Standard metallic workflow (albedo, normal, roughness, metalness)
2. **Patina overlay:** Second UV-mapped texture layer for patina/verdigris detail
3. **Scale-correct tiling:** Texture must tile correctly at the configured dimensions
4. **Edge wear:** Subtle edge highlighting to simulate hand-finishing
5. **Lacquer coat:** Slight glossy clear-coat effect (HT lacquers all pieces)

```glsl
// Simplified concept — actual implementation in Three.js ShaderMaterial
uniform sampler2D albedoMap;
uniform sampler2D normalMap;
uniform sampler2D roughnessMap;
uniform sampler2D metalnessMap;
uniform sampler2D patinaMap;        // Additional patina detail layer
uniform float patinaIntensity;      // Per-finish patina amount
uniform float lacquerGloss;         // Clear-coat effect
uniform vec2 texScale;              // Scales with product dimensions
```

### Parametric Model System

All product models are generated procedurally, not loaded from static GLTF files. This enables exact dimension matching.

```typescript
// Example: Parametric metal sheet
function createSheetGeometry(
  width: number,    // mm
  height: number,   // mm
  thickness: number, // mm
  edgeBevel: number  // mm — subtle edge rounding
): BufferGeometry {
  // BoxGeometry base with beveled edges
  // UV mapping scales texture to real-world dimensions
  // Multi-panel: subdivide geometry at split lines
}
```

### Texture Pipeline

```
Source Photography (HT workshop)
    ↓
RAW Processing (colour-correct, lighting-normalise)
    ↓
Texture Map Generation:
    ├── Albedo map (colour/diffuse)
    ├── Normal map (surface detail via Materialize/Substance)
    ├── Roughness map (matte/glossy variation)
    └── Metalness map (metal vs. patina areas)
    ↓
Compression (KTX2 via Basis Universal)
    ↓
CDN Storage (Vercel Blob / Supabase Storage)
    ↓
Lazy-loaded in Three.js with useTexture()
```

## State Management (Zustand)

Single store for all configurator state. This is the source of truth for the entire app — the 3D scene, pricing engine, and UI all derive from this store.

```typescript
interface ConfiguratorState {
  // Product
  productType: ProductType;

  // Finish
  selectedFinish: Finish | null;
  baseMetal: MetalType;

  // Dimensions (all in mm)
  width: number;
  height: number;
  thickness: number;

  // Derived
  panelCount: number;           // Auto-calculated from dimensions
  panelLayout: PanelLayout;     // How panels are split

  // Options
  mountingType: MountingType;
  customText?: string;          // For signage
  fontFamily?: string;          // For signage

  // Pricing
  calculatedPrice: number | null;
  priceBreakdown: PriceBreakdown | null;
  isPriceLoading: boolean;

  // UI
  viewMode: '3d' | 'front' | 'side' | 'room';
  isConfigComplete: boolean;

  // Actions
  setProductType: (type: ProductType) => void;
  setFinish: (finish: Finish) => void;
  setDimensions: (dims: Partial<Dimensions>) => void;
  setMountingType: (type: MountingType) => void;
  calculatePrice: () => Promise<void>;
  resetConfig: () => void;
  getShareableUrl: () => string;
  exportQuotePdf: () => Promise<Blob>;
}
```

## API Design

### `POST /api/pricing/calculate`
Real-time price calculation. Called on every config change (debounced).

```typescript
// Request
{
  productType: "splashback",
  finishId: "northumberland",
  width: 1200,      // mm
  height: 600,      // mm
  thickness: 0.9,   // mm
  mountingType: "drilled_holes",
  panelCount: 1
}

// Response
{
  totalPrice: 186.00,
  currency: "GBP",
  breakdown: {
    baseMaterial: 132.00,
    finishSurcharge: 24.00,
    mountingPrep: 15.00,
    multiPanelSurcharge: 0.00,
    deliveryEstimate: 15.00
  },
  isEstimate: false,
  requiresManualQuote: false
}
```

### `POST /api/quote/generate`
Generate a PDF quote and optionally email it.

### `POST /api/quote/submit`
Submit a quote request to HT's sales team (creates Supabase record + email notification).

## Performance Strategy

| Concern | Solution |
|---|---|
| Texture loading | KTX2 compressed, lazy-loaded, progressive (low-res → high-res) |
| 3D scene init | Suspense boundary with loading skeleton, models generated client-side |
| Price calculation | Debounced 200ms, cached for identical configs |
| Bundle size | Dynamic import Three.js components, tree-shake R3F |
| Mobile | Reduced texture resolution, simpler lighting, no post-processing |
| SSR/SEO | Product type pages SSR'd, configurator is client-only island |

## Security

- Admin routes protected by Supabase Auth (role: admin)
- Trade portal protected by Supabase Auth (role: trade)
- Price calculation server-side only (prevent client manipulation)
- Rate limiting on API routes
- Supabase RLS policies on all tables
