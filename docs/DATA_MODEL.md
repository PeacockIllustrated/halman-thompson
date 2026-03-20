# Data Model — HT Fabrication Visualiser

## TypeScript Types

```typescript
// ─── Enums ──────────────────────────────────────────

type MetalType = "copper" | "brass" | "zinc" | "steel" | "corten";

type ProductType =
  | "splashback"
  | "worktop"
  | "bar_top"
  | "table_top"
  | "coffee_table_top"
  | "wall_panel"
  | "cladding"
  | "tile"
  | "signage"
  | "metal_letters"
  | "kitchen_plinth"
  | "cooker_hood"
  | "stair_riser"
  | "bath_panel"
  | "cupboard_door"
  | "laser_cut_screen"
  | "door_push_plate"
  | "decorative_sheet";

type MountingType =
  | "none"
  | "drilled_holes"
  | "adhesive"
  | "stake_frame"
  | "wire_hanging"
  | "screw_fixings";

type FabricationMethod =
  | "flat_sheet"     // Standard cut-to-size
  | "engraved"       // Text/logo engraved into surface
  | "laser_cut"      // Precision laser cutting
  | "3d_effect"      // Raised/dimensional text
  | "etched";        // Chemical etching

type LacquerType = "matte" | "gloss";

type OrderStatus =
  | "quote_requested"
  | "quote_sent"
  | "order_confirmed"
  | "in_production"
  | "shipped"
  | "delivered";

// ─── Core Types ─────────────────────────────────────

interface Finish {
  id: string;
  slug: string;                    // URL-safe: "northumberland"
  name: string;                    // "Northumberland Finish"
  subtitle: string;                // "Aged copper with verdigris"
  baseMetal: MetalType;
  description: string;
  priceModifier: number;           // Multiplier on base metal price (1.0 = standard)
  isAged: boolean;                 // True for patina/aged finishes
  lacquerDefault: LacquerType;
  availableThicknesses: number[];  // [0.7, 0.9, 1.2, 1.5] in mm
  maxSheetWidth: number;           // mm (usually 2000)
  maxSheetHeight: number;          // mm (usually 1000)
  textures: TextureSet;
  swatchImageUrl: string;          // Small preview for selector
  galleryImages: string[];         // Full photos of this finish in use
  sortOrder: number;
  isActive: boolean;
}

interface TextureSet {
  albedo: string;         // URL to albedo/diffuse map
  normal: string;         // URL to normal map
  roughness: string;      // URL to roughness map
  metalness: string;      // URL to metalness map
  patina?: string;        // Optional patina overlay map
  ao?: string;            // Optional ambient occlusion map
  // Texture dimensions and tiling info
  realWorldWidthMm: number;   // Physical width the texture represents
  realWorldHeightMm: number;  // Physical height the texture represents
}

interface ProductTypeConfig {
  id: ProductType;
  name: string;                     // "Splashback"
  namePlural: string;               // "Splashbacks"
  description: string;
  heroImage: string;
  startingPrice: number;            // "From £XX"
  defaultWidth: number;             // mm
  defaultHeight: number;            // mm
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  availableThicknesses: number[];
  defaultThickness: number;
  allowedMetals: MetalType[];
  allowedMountingTypes: MountingType[];
  allowedFabricationMethods: FabricationMethod[];
  labourMultiplier: number;         // Product-specific labour cost factor
  hasTextInput: boolean;            // True for signage
  hasLogoUpload: boolean;           // True for signage
  modelType: ModelType;             // Which 3D model to render
  sortOrder: number;
  isActive: boolean;
  phase: 1 | 2 | 3 | 4;           // Which development phase
}

type ModelType =
  | "flat_sheet"        // Simple rectangle (splashback, wall panel, tile)
  | "surface_sheet"     // Rectangle with edge profile (worktop, bar top)
  | "table_surface"     // Sheet on table legs
  | "hood_shape"        // Cooker hood form
  | "text_extrusion"    // 3D extruded text (signage, letters)
  | "screen_cutout"     // Laser cut pattern panel
  | "plaque";           // Flat plaque with engraved surface

// ─── Dimensions & Layout ────────────────────────────

interface Dimensions {
  width: number;        // mm
  height: number;       // mm
  thickness: number;    // mm
}

interface PanelLayout {
  panelCount: number;
  panels: Panel[];
  joinDirection: "horizontal" | "vertical" | "grid";
  surcharge: number;    // £ per additional panel
}

interface Panel {
  index: number;
  width: number;        // mm
  height: number;       // mm
  position: { x: number; y: number };  // Relative position in layout
}

// ─── Pricing ────────────────────────────────────────

interface PricingRule {
  id: string;
  metalType: MetalType;
  basePricePerM2: number;          // £ per square metre of raw metal
  finishMultiplierRange: {         // Range for finish complexity
    min: number;                   // 1.0 (natural)
    max: number;                   // 2.5 (heavily aged)
  };
  thicknessPriceMap: Record<number, number>;  // thickness_mm → £ surcharge
  multiPanelSurcharge: number;     // £ per additional panel beyond 1
  deliveryBase: number;            // £ standard delivery
  deliveryPalletSurcharge: number; // £ for pieces > 1300mm
}

interface PriceBreakdown {
  baseMaterial: number;
  finishSurcharge: number;
  thicknessSurcharge: number;
  labourCost: number;
  mountingPrep: number;
  multiPanelSurcharge: number;
  deliveryEstimate: number;
  subtotal: number;
  vat: number;
  total: number;
}

// ─── Signage-Specific ───────────────────────────────

interface SignageConfig {
  text: string;
  fontFamily: string;
  fontSize: number;               // mm height of text
  fabricationMethod: FabricationMethod;
  hasBorder: boolean;
  borderWidth?: number;           // mm
  logoSvg?: string;               // Uploaded SVG data
  logoPosition?: { x: number; y: number; scale: number };
}

// ─── Quote & Order ──────────────────────────────────

interface QuoteRequest {
  id: string;
  createdAt: string;              // ISO timestamp
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  isTradeCustomer: boolean;
  companyName?: string;

  // Configuration snapshot
  productType: ProductType;
  finishId: string;
  finishName: string;
  dimensions: Dimensions;
  panelLayout: PanelLayout | null;
  mountingType: MountingType;
  lacquerType: LacquerType;
  signageConfig?: SignageConfig;

  // Pricing
  calculatedPrice: number | null;
  priceBreakdown: PriceBreakdown | null;
  requiresManualQuote: boolean;

  // Snapshot
  configurationUrl: string;       // Shareable URL that recreates this config
  renderImageUrl?: string;        // Screenshot of the 3D render

  // Status
  status: OrderStatus;
  notes?: string;                 // Customer notes
  internalNotes?: string;         // HT team notes
}

// ─── Configuration State (URL-serialisable) ─────────

interface ConfigurationSnapshot {
  p: ProductType;                 // Product type
  f: string;                      // Finish slug
  w: number;                      // Width mm
  h: number;                      // Height mm
  t: number;                      // Thickness mm
  m: MountingType;                // Mounting type
  l: LacquerType;                 // Lacquer type
  // Signage-specific (optional)
  st?: string;                    // Sign text
  sf?: string;                    // Sign font
  sm?: FabricationMethod;         // Sign fabrication method
}
// Serialised to URL: /configure/splashback?c=BASE64(JSON)
```

## Supabase Database Schema

```sql
-- Finishes table
CREATE TABLE finishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT,
  base_metal TEXT NOT NULL CHECK (base_metal IN ('copper', 'brass', 'zinc', 'steel', 'corten')),
  description TEXT,
  price_modifier DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  is_aged BOOLEAN NOT NULL DEFAULT false,
  lacquer_default TEXT NOT NULL DEFAULT 'matte',
  available_thicknesses DECIMAL[] NOT NULL DEFAULT '{0.9}',
  max_sheet_width_mm INTEGER NOT NULL DEFAULT 2000,
  max_sheet_height_mm INTEGER NOT NULL DEFAULT 1000,
  texture_albedo TEXT,
  texture_normal TEXT,
  texture_roughness TEXT,
  texture_metalness TEXT,
  texture_patina TEXT,
  texture_real_width_mm INTEGER NOT NULL DEFAULT 500,
  texture_real_height_mm INTEGER NOT NULL DEFAULT 500,
  swatch_image_url TEXT,
  gallery_images TEXT[],
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product types table
CREATE TABLE product_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_plural TEXT NOT NULL,
  description TEXT,
  hero_image TEXT,
  starting_price DECIMAL(10,2),
  default_width_mm INTEGER NOT NULL,
  default_height_mm INTEGER NOT NULL,
  min_width_mm INTEGER NOT NULL,
  max_width_mm INTEGER NOT NULL,
  min_height_mm INTEGER NOT NULL,
  max_height_mm INTEGER NOT NULL,
  available_thicknesses DECIMAL[] NOT NULL,
  default_thickness DECIMAL NOT NULL,
  allowed_metals TEXT[] NOT NULL,
  allowed_mounting_types TEXT[] NOT NULL,
  labour_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  has_text_input BOOLEAN NOT NULL DEFAULT false,
  model_type TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  phase INTEGER NOT NULL DEFAULT 1
);

-- Pricing rules
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metal_type TEXT NOT NULL,
  base_price_per_m2 DECIMAL(10,2) NOT NULL,
  thickness_price_map JSONB NOT NULL DEFAULT '{}',
  multi_panel_surcharge DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  delivery_base DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  delivery_pallet_surcharge DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  mounting_prices JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quote requests
CREATE TABLE quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  is_trade_customer BOOLEAN NOT NULL DEFAULT false,
  company_name TEXT,
  product_type TEXT NOT NULL REFERENCES product_types(id),
  finish_id UUID REFERENCES finishes(id),
  finish_name TEXT NOT NULL,
  width_mm INTEGER NOT NULL,
  height_mm INTEGER NOT NULL,
  thickness_mm DECIMAL NOT NULL,
  panel_count INTEGER NOT NULL DEFAULT 1,
  mounting_type TEXT NOT NULL DEFAULT 'none',
  lacquer_type TEXT NOT NULL DEFAULT 'matte',
  signage_config JSONB,
  calculated_price DECIMAL(10,2),
  price_breakdown JSONB,
  requires_manual_quote BOOLEAN NOT NULL DEFAULT false,
  configuration_url TEXT,
  render_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'quote_requested',
  customer_notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE finishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Public read access for finishes and product types
CREATE POLICY "Public read finishes" ON finishes FOR SELECT USING (is_active = true);
CREATE POLICY "Public read product_types" ON product_types FOR SELECT USING (is_active = true);

-- Pricing rules: public read, admin write
CREATE POLICY "Public read pricing" ON pricing_rules FOR SELECT USING (is_active = true);

-- Quote requests: insert for anyone, read/update for authenticated admins
CREATE POLICY "Anyone can submit quotes" ON quote_requests FOR INSERT WITH CHECK (true);
```

## Seed Data — Initial Finishes

```sql
INSERT INTO finishes (slug, name, subtitle, base_metal, price_modifier, is_aged, sort_order) VALUES
('northumberland', 'Northumberland Finish', 'Aged copper with verdigris', 'copper', 1.4, true, 1),
('hertfordshire', 'Hertfordshire Finish', 'Deep aged copper', 'copper', 1.3, true, 2),
('ayrshire', 'Ayrshire Finish', 'Dappled copper with verdigris specs', 'copper', 1.6, true, 3),
('cheshire', 'Cheshire Finish', 'Rich aged copper', 'copper', 1.4, true, 4),
('natural-copper', 'Natural Copper', 'Untreated solid copper', 'copper', 1.0, false, 5),
('brushed-copper', 'Brushed Copper', 'Brushed finish copper', 'copper', 1.0, false, 6),
('lightly-burnished-copper', 'Lightly Burnished Copper', 'Subtle warmth', 'copper', 1.0, false, 7),
('antique-burnished-copper', 'Antique Burnished Copper', 'Deep burnished tone', 'copper', 1.2, true, 8),
('antique-brushed-copper', 'Antique Brushed Copper', 'Brushed with patina', 'copper', 1.1, true, 9),
('somerset', 'Somerset Finish', 'Stained glass brass', 'brass', 1.6, true, 10),
('wiltshire', 'Wiltshire Finish', 'Classic aged brass', 'brass', 1.4, true, 11),
('berkshire', 'Berkshire Bronzed Brass', 'Rich bronzed brass', 'brass', 1.5, true, 12),
('cambridgeshire', 'Cambridgeshire Finish', 'Mill brass finish', 'brass', 1.3, true, 13),
('natural-brass', 'Natural Brass', 'Untreated solid brass', 'brass', 1.0, false, 14),
('antique-brass', 'Antique Brass', 'Classic antique tone', 'brass', 1.5, true, 15),
('antique-brushed-brass', 'Antique Brushed Brass', 'Brushed with antique patina', 'brass', 1.5, true, 16),
('lightly-aged-zinc', 'Lightly Aged Zinc', 'Subtle zinc patina', 'zinc', 1.3, true, 17),
('antique-zinc', 'Antique Zinc', 'Deep zinc patina', 'zinc', 1.4, true, 18),
('blackened-steel', 'Blackened Steel', 'Dark industrial finish', 'steel', 1.8, true, 19),
('corten-weathered', 'Corten Steel – Weathered', 'Rustic weathered steel', 'corten', 1.8, true, 20);
```
