// ─── HT Fabrication Visualiser — Dimension Constraints ──────────
// Validation and clamping helpers for product dimensions.
// Import from @/lib/products/constraints

import type { ProductTypeConfig } from "@/types";

const MAX_SINGLE_SHEET_WIDTH = 2000;
const MAX_SINGLE_SHEET_HEIGHT = 1000;

/** Clamps a width value to the product's min/max range */
export function clampWidth(value: number, product: ProductTypeConfig): number {
  return Math.max(product.minWidth, Math.min(product.maxWidth, Math.round(value)));
}

/** Clamps a height value to the product's min/max range */
export function clampHeight(value: number, product: ProductTypeConfig): number {
  return Math.max(product.minHeight, Math.min(product.maxHeight, Math.round(value)));
}

/** Returns true if the given dimensions exceed a single sheet and require multi-panel fabrication */
export function requiresMultiPanel(width: number, height: number): boolean {
  return width > MAX_SINGLE_SHEET_WIDTH || height > MAX_SINGLE_SHEET_HEIGHT;
}

/** Returns true if the given thickness is available for the product type */
export function isValidThickness(thickness: number, product: ProductTypeConfig): boolean {
  return product.availableThicknesses.includes(thickness);
}
