// ─── HT Fabrication Visualiser — Server-side Validation ─────────
// Input validation for the public quote-submission endpoint. Client input
// is never trusted: every field is checked and normalised before it reaches
// the database or the pricing engine. Import from @/lib/validation

import type { MountingType, ProductType } from "@/types";
import { getProductType } from "@/lib/products/catalogue";
import { getFinishById } from "@/lib/products/finishes";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MOUNTING_TYPES: readonly MountingType[] = [
  "none",
  "drilled_holes",
  "adhesive",
  "stake_frame",
  "wire_hanging",
  "screw_fixings",
];

// ─── Types ───────────────────────────────────────────────────────

export interface ValidatedQuoteSubmission {
  customerName: string;
  customerEmail: string;
  finishName: string;
  productType: ProductType;
  finishId: string;
  width: number;
  height: number;
  thickness: number;
  mountingType: MountingType;
  panelCount: number;
  /** Present only when the client supplied unfolded flat-sheet dimensions. */
  flatWidth?: number;
  flatHeight?: number;
}

export type ValidationResult =
  | { ok: true; value: ValidatedQuoteSubmission }
  | { ok: false; error: string };

// ─── Helpers ─────────────────────────────────────────────────────

export function isValidEmail(s: string): boolean {
  return typeof s === "string" && s.length <= 254 && EMAIL_RE.test(s);
}

function isFinitePositive(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

function toNumber(v: unknown): number {
  return typeof v === "number" ? v : Number(v);
}

// ─── Quote Submission ────────────────────────────────────────────

export function validateQuoteSubmission(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body" };
  }
  const b = body as Record<string, unknown>;

  // Customer
  const customerName = typeof b.customerName === "string" ? b.customerName.trim() : "";
  if (!customerName) {
    return { ok: false, error: "Customer name is required" };
  }

  const customerEmail = typeof b.customerEmail === "string" ? b.customerEmail.trim() : "";
  if (!isValidEmail(customerEmail)) {
    return { ok: false, error: "A valid customer email is required" };
  }

  // Product type
  if (typeof b.productType !== "string") {
    return { ok: false, error: "Product type is required" };
  }
  const product = getProductType(b.productType);
  if (!product) {
    return { ok: false, error: "Unknown product type" };
  }

  // Finish
  if (typeof b.finishId !== "string") {
    return { ok: false, error: "Finish is required" };
  }
  const finish = getFinishById(b.finishId);
  if (!finish) {
    return { ok: false, error: "Unknown finish" };
  }

  // Dimensions — must be finite, positive, and within the product's bounds.
  const width = toNumber(b.width);
  if (!isFinitePositive(width) || width < product.minWidth || width > product.maxWidth) {
    return {
      ok: false,
      error: `Width must be between ${product.minWidth}mm and ${product.maxWidth}mm`,
    };
  }

  const height = toNumber(b.height);
  if (!isFinitePositive(height) || height < product.minHeight || height > product.maxHeight) {
    return {
      ok: false,
      error: `Height must be between ${product.minHeight}mm and ${product.maxHeight}mm`,
    };
  }

  // Thickness — default to the product's default when omitted, then bound to
  // the available range (lenient on exact value; the pricing engine tolerates
  // off-list thicknesses).
  const thickness = toNumber(b.thickness ?? product.defaultThickness);
  const minThickness = Math.min(...product.availableThicknesses);
  const maxThickness = Math.max(...product.availableThicknesses);
  if (!isFinitePositive(thickness) || thickness < minThickness || thickness > maxThickness) {
    return {
      ok: false,
      error: `Thickness must be between ${minThickness}mm and ${maxThickness}mm`,
    };
  }

  // Mounting — normalise to a known value, defaulting to "none".
  const mountingType: MountingType =
    typeof b.mountingType === "string" &&
    (MOUNTING_TYPES as readonly string[]).includes(b.mountingType)
      ? (b.mountingType as MountingType)
      : "none";

  // Panel count — positive integer, defaulting to 1.
  const panelCountRaw = toNumber(b.panelCount);
  const panelCount =
    Number.isFinite(panelCountRaw) && panelCountRaw >= 1 ? Math.floor(panelCountRaw) : 1;

  // Finish display name — fall back to the registry name.
  const finishName =
    typeof b.finishName === "string" && b.finishName.trim()
      ? b.finishName.trim()
      : finish.name;

  // Flat-sheet override dimensions (used for worktop pricing).
  let flatWidth: number | undefined;
  let flatHeight: number | undefined;
  if (typeof b.flatSheet === "object" && b.flatSheet !== null) {
    const fs = b.flatSheet as Record<string, unknown>;
    if (isFinitePositive(fs.totalWidth) && isFinitePositive(fs.totalHeight)) {
      flatWidth = fs.totalWidth;
      flatHeight = fs.totalHeight;
    }
  }

  const value: ValidatedQuoteSubmission = {
    customerName,
    customerEmail,
    finishName,
    productType: product.id,
    finishId: finish.id,
    width,
    height,
    thickness,
    mountingType,
    panelCount,
  };
  if (flatWidth !== undefined && flatHeight !== undefined) {
    value.flatWidth = flatWidth;
    value.flatHeight = flatHeight;
  }

  return { ok: true, value };
}
