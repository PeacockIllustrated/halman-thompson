// ─── HT Fabrication Visualiser — Product Type Catalogue ─────────
// All supported product types with their configuration constraints.
// Import from @/lib/products/catalogue

import type { ProductTypeConfig } from "@/types";

export const PRODUCT_TYPES: ProductTypeConfig[] = [
  // ── Phase 1 ────────────────────────────────────────────────────

  {
    id: "splashback",
    name: "Splashback",
    namePlural: "Splashbacks",
    description:
      "Bespoke metal splashbacks for kitchens, bathrooms, and feature walls. Our hero product — available in all HT named finishes.",
    heroImage: "/images/products/splashback-hero.jpg",
    startingPrice: 180,
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

  // ── Phase 2 ────────────────────────────────────────────────────

  {
    id: "worktop",
    name: "Worktop",
    namePlural: "Worktops",
    description:
      "Handcrafted metal worktops and countertops for kitchens, bars, and commercial spaces.",
    heroImage: "/images/products/worktop-hero.jpg",
    startingPrice: 350,
    defaultWidth: 1200,
    defaultHeight: 600,
    minWidth: 200,
    maxWidth: 4000,
    minHeight: 200,
    maxHeight: 1200,
    availableThicknesses: [0.9, 1.2, 1.5],
    defaultThickness: 1.2,
    allowedMetals: ["copper", "brass", "zinc", "steel", "corten"],
    allowedMountingTypes: ["none", "adhesive", "screw_fixings"],
    allowedFabricationMethods: ["flat_sheet"],
    labourMultiplier: 1.2,
    hasTextInput: false,
    hasLogoUpload: false,
    modelType: "surface_sheet",
    sortOrder: 2,
    isActive: true,
    phase: 1,
    defaultFinishSlug: "antique-brass",
  },
  {
    id: "bar_top",
    name: "Bar Top",
    namePlural: "Bar Tops",
    description:
      "Statement metal bar tops for hospitality venues, home bars, and commercial installations.",
    heroImage: "/images/products/bar-top-hero.jpg",
    startingPrice: 400,
    defaultWidth: 1800,
    defaultHeight: 500,
    minWidth: 300,
    maxWidth: 4000,
    minHeight: 300,
    maxHeight: 800,
    availableThicknesses: [0.9, 1.2, 1.5],
    defaultThickness: 1.2,
    allowedMetals: ["copper", "brass", "zinc", "steel", "corten"],
    allowedMountingTypes: ["none", "adhesive", "screw_fixings"],
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
    description:
      "Large-format decorative metal wall panels and cladding for feature walls and architectural installations.",
    heroImage: "/images/products/wall-panel-hero.jpg",
    startingPrice: 250,
    defaultWidth: 1200,
    defaultHeight: 900,
    minWidth: 200,
    maxWidth: 4000,
    minHeight: 200,
    maxHeight: 2000,
    availableThicknesses: [0.7, 0.9, 1.2],
    defaultThickness: 0.9,
    allowedMetals: ["copper", "brass", "zinc", "steel", "corten"],
    allowedMountingTypes: ["none", "drilled_holes", "adhesive", "screw_fixings"],
    allowedFabricationMethods: ["flat_sheet"],
    labourMultiplier: 1.1,
    hasTextInput: false,
    hasLogoUpload: false,
    modelType: "flat_sheet",
    sortOrder: 4,
    isActive: false,
    phase: 2,
  },
  {
    id: "table_top",
    name: "Table Top",
    namePlural: "Table Tops",
    description:
      "Bespoke metal table tops for dining tables, coffee tables, and side tables.",
    heroImage: "/images/products/table-top-hero.jpg",
    startingPrice: 300,
    defaultWidth: 1200,
    defaultHeight: 800,
    minWidth: 200,
    maxWidth: 3000,
    minHeight: 200,
    maxHeight: 1500,
    availableThicknesses: [0.9, 1.2, 1.5],
    defaultThickness: 1.2,
    allowedMetals: ["copper", "brass", "zinc", "steel", "corten"],
    allowedMountingTypes: ["none"],
    allowedFabricationMethods: ["flat_sheet"],
    labourMultiplier: 1.2,
    hasTextInput: false,
    hasLogoUpload: false,
    modelType: "table_surface",
    sortOrder: 5,
    isActive: false,
    phase: 2,
  },

  // ── Phase 3 ────────────────────────────────────────────────────

  {
    id: "signage",
    name: "Metal Signage",
    namePlural: "Metal Signs",
    description:
      "Handcrafted brass, copper, and zinc signage — engraved, laser cut, or 3D effect. Hotels, restaurants, offices, and residential.",
    heroImage: "/images/products/signage-hero.jpg",
    startingPrice: 120,
    defaultWidth: 400,
    defaultHeight: 200,
    minWidth: 50,
    maxWidth: 2000,
    minHeight: 50,
    maxHeight: 1000,
    availableThicknesses: [0.9, 1.2, 1.5],
    defaultThickness: 1.2,
    allowedMetals: ["copper", "brass", "zinc"],
    allowedMountingTypes: ["none", "drilled_holes", "adhesive", "screw_fixings", "wire_hanging"],
    allowedFabricationMethods: ["flat_sheet", "engraved", "laser_cut", "3d_effect", "etched"],
    labourMultiplier: 2.0,
    hasTextInput: true,
    hasLogoUpload: true,
    modelType: "plaque",
    sortOrder: 6,
    isActive: false,
    phase: 3,
  },
];

// ─── Helper Functions ────────────────────────────────────────────

/** Finds a product type by its id */
export function getProductType(id: string): ProductTypeConfig | undefined {
  return PRODUCT_TYPES.find((p) => p.id === id);
}

/** Returns all active product types */
export function getActiveProductTypes(): ProductTypeConfig[] {
  return PRODUCT_TYPES.filter((p) => p.isActive);
}
