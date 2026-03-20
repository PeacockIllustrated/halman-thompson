// ─── HT Fabrication Visualiser — Core Types ────────────────────
// All shared types for the application. Import from @/types

// ─── Enums / Unions ─────────────────────────────────────────────

export type MetalType = "copper" | "brass" | "zinc" | "steel" | "corten";

export type ProductType =
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

export type MountingType =
  | "none"
  | "drilled_holes"
  | "adhesive"
  | "stake_frame"
  | "wire_hanging"
  | "screw_fixings";

export type FabricationMethod =
  | "flat_sheet"
  | "engraved"
  | "laser_cut"
  | "3d_effect"
  | "etched";

export type LacquerType = "matte" | "gloss";

export type ModelType =
  | "flat_sheet"
  | "surface_sheet"
  | "table_surface"
  | "hood_shape"
  | "text_extrusion"
  | "screen_cutout"
  | "plaque";

export type ViewMode = "3d" | "front" | "side" | "room";

// ─── Textures ───────────────────────────────────────────────────

export interface TextureSet {
  albedo: string;
  normal: string;
  roughness: string;
  metalness: string;
  patina?: string;
  ao?: string;
  /** Physical width (mm) the source texture photograph represents */
  realWorldWidthMm: number;
  /** Physical height (mm) the source texture photograph represents */
  realWorldHeightMm: number;
}

// ─── Finish ─────────────────────────────────────────────────────

export interface Finish {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  baseMetal: MetalType;
  description: string;
  /** Multiplier on base metal price. 1.0 = no surcharge */
  priceModifier: number;
  isAged: boolean;
  lacquerDefault: LacquerType;
  availableThicknesses: number[];
  maxSheetWidth: number;
  maxSheetHeight: number;
  textures: TextureSet;
  swatchImageUrl: string;
  galleryImages: string[];
  sortOrder: number;
  isActive: boolean;
}

// ─── Product Type ───────────────────────────────────────────────

export interface ProductTypeConfig {
  id: ProductType;
  name: string;
  namePlural: string;
  description: string;
  heroImage: string;
  startingPrice: number;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  availableThicknesses: number[];
  defaultThickness: number;
  allowedMetals: MetalType[];
  allowedMountingTypes: MountingType[];
  allowedFabricationMethods: FabricationMethod[];
  labourMultiplier: number;
  hasTextInput: boolean;
  hasLogoUpload: boolean;
  modelType: ModelType;
  sortOrder: number;
  isActive: boolean;
  phase: 1 | 2 | 3 | 4;
}

// ─── Dimensions ─────────────────────────────────────────────────

export interface Dimensions {
  width: number;
  height: number;
  thickness: number;
}

export interface Panel {
  index: number;
  width: number;
  height: number;
  position: { x: number; y: number };
}

export interface PanelLayout {
  panelCount: number;
  panels: Panel[];
  joinDirection: "horizontal" | "vertical" | "grid";
  surcharge: number;
}

// ─── Pricing ────────────────────────────────────────────────────

export interface PricingRule {
  id: string;
  metalType: MetalType;
  basePricePerM2: number;
  finishMultiplierRange: { min: number; max: number };
  thicknessPriceMap: Record<number, number>;
  multiPanelSurcharge: number;
  deliveryBase: number;
  deliveryPalletSurcharge: number;
}

export interface PriceBreakdown {
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

export interface PricingRequest {
  productType: ProductType;
  finishId: string;
  width: number;
  height: number;
  thickness: number;
  mountingType: MountingType;
  panelCount: number;
}

export interface PricingResponse {
  totalPrice: number;
  currency: "GBP";
  breakdown: PriceBreakdown;
  isEstimate: boolean;
  requiresManualQuote: boolean;
}

// ─── Signage ────────────────────────────────────────────────────

export interface SignageConfig {
  text: string;
  fontFamily: string;
  fontSize: number;
  fabricationMethod: FabricationMethod;
  hasBorder: boolean;
  borderWidth?: number;
  logoSvg?: string;
  logoPosition?: { x: number; y: number; scale: number };
}

// ─── Quote ──────────────────────────────────────────────────────

export type OrderStatus =
  | "quote_requested"
  | "quote_sent"
  | "order_confirmed"
  | "in_production"
  | "shipped"
  | "delivered";

export interface QuoteRequest {
  id: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  isTradeCustomer: boolean;
  companyName?: string;
  productType: ProductType;
  finishId: string;
  finishName: string;
  dimensions: Dimensions;
  panelLayout: PanelLayout | null;
  mountingType: MountingType;
  lacquerType: LacquerType;
  signageConfig?: SignageConfig;
  calculatedPrice: number | null;
  priceBreakdown: PriceBreakdown | null;
  requiresManualQuote: boolean;
  configurationUrl: string;
  renderImageUrl?: string;
  status: OrderStatus;
  notes?: string;
  internalNotes?: string;
}

// ─── Configuration Snapshot (URL-serialisable) ──────────────────

export interface ConfigSnapshot {
  p: ProductType;
  f: string;
  w: number;
  h: number;
  t: number;
  m: MountingType;
  l: LacquerType;
  st?: string;
  sf?: string;
  sm?: FabricationMethod;
}

// ─── Configurator Store ─────────────────────────────────────────

export interface ConfiguratorState {
  // Product
  productType: ProductType;

  // Finish
  selectedFinish: Finish | null;
  baseMetal: MetalType;

  // Dimensions (mm)
  width: number;
  height: number;
  thickness: number;

  // Derived
  panelCount: number;
  panelLayout: PanelLayout | null;

  // Options
  mountingType: MountingType;
  lacquerType: LacquerType;
  signageConfig: SignageConfig | null;

  // Pricing
  calculatedPrice: number | null;
  priceBreakdown: PriceBreakdown | null;
  isPriceLoading: boolean;

  // UI
  viewMode: ViewMode;
  configStep: number;
  isConfigComplete: boolean;

  // Actions
  setProductType: (type: ProductType) => void;
  setFinish: (finish: Finish) => void;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setThickness: (thickness: number) => void;
  setMountingType: (type: MountingType) => void;
  setLacquerType: (type: LacquerType) => void;
  setSignageConfig: (config: Partial<SignageConfig>) => void;
  setViewMode: (mode: ViewMode) => void;
  calculatePrice: () => Promise<void>;
  resetConfig: () => void;
  getSnapshot: () => ConfigSnapshot;
  loadSnapshot: (snapshot: ConfigSnapshot) => void;
}
