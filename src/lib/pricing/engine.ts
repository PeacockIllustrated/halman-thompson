import type {
  MetalType,
  MountingType,
  PriceBreakdown,
  PricingRequest,
  PricingResponse,
} from "@/types";
import { getFinishById } from "@/lib/products/finishes";
import { getProductType } from "@/lib/products/catalogue";

/** Base price per m² by metal type (£) */
const BASE_PRICE_PER_M2: Record<MetalType, number> = {
  copper: 180,
  brass: 160,
  zinc: 120,
  steel: 90,
  corten: 110,
};

/** Thickness surcharge (£ per m²) — relative to baseline 0.9mm */
const THICKNESS_SURCHARGE_PER_M2: Record<number, number> = {
  0.7: -10,
  0.9: 0,
  1.2: 25,
  1.5: 50,
  2.0: 80,
};

/** Mounting preparation costs (£ flat) */
const MOUNTING_COSTS: Record<MountingType, number> = {
  none: 0,
  drilled_holes: 15,
  adhesive: 5,
  stake_frame: 45,
  wire_hanging: 20,
  screw_fixings: 15,
};

/** Multi-panel surcharge per additional panel (£) */
const MULTI_PANEL_SURCHARGE = 50;

/** Delivery costs */
const DELIVERY_BASE = 15;
const DELIVERY_PALLET_SURCHARGE = 50;
const PALLET_THRESHOLD_MM = 1300;

/** VAT rate */
const VAT_RATE = 0.2;

export function calculatePrice(request: PricingRequest): PricingResponse {
  const finish = getFinishById(request.finishId);
  const product = getProductType(request.productType);

  if (!finish || !product) {
    return {
      totalPrice: 0,
      currency: "GBP",
      breakdown: emptyBreakdown(),
      isEstimate: false,
      requiresManualQuote: true,
    };
  }

  // Area in m² — use flat sheet dimensions for worktops when available
  const areaM2 = request.flatWidth && request.flatHeight
    ? (request.flatWidth * request.flatHeight) / 1_000_000
    : (request.width * request.height) / 1_000_000;

  // Base material cost
  const baseMaterial = areaM2 * BASE_PRICE_PER_M2[finish.baseMetal];

  // Finish surcharge (based on priceModifier — 1.0 = no surcharge)
  const finishSurcharge = baseMaterial * (finish.priceModifier - 1);

  // Thickness surcharge
  const thicknessSurchargeRate = THICKNESS_SURCHARGE_PER_M2[request.thickness] ?? 0;
  const thicknessSurcharge = areaM2 * thicknessSurchargeRate;

  // Labour cost (product-specific multiplier on base)
  const labourBase = baseMaterial * 0.15; // 15% of material cost as base labour
  const labourCost = labourBase * product.labourMultiplier;

  // Mounting prep
  const mountingPrep = MOUNTING_COSTS[request.mountingType] ?? 0;

  // Multi-panel surcharge
  const multiPanelSurcharge =
    request.panelCount > 1 ? (request.panelCount - 1) * MULTI_PANEL_SURCHARGE : 0;

  // Delivery estimate
  const needsPallet =
    request.width > PALLET_THRESHOLD_MM ||
    request.height > PALLET_THRESHOLD_MM;
  const deliveryEstimate =
    DELIVERY_BASE + (needsPallet ? DELIVERY_PALLET_SURCHARGE : 0);

  // Subtotal
  const subtotal =
    baseMaterial +
    finishSurcharge +
    thicknessSurcharge +
    labourCost +
    mountingPrep +
    multiPanelSurcharge +
    deliveryEstimate;

  // VAT
  const vat = subtotal * VAT_RATE;

  // Total
  const total = subtotal + vat;

  const breakdown: PriceBreakdown = {
    baseMaterial: round2(baseMaterial),
    finishSurcharge: round2(finishSurcharge),
    thicknessSurcharge: round2(thicknessSurcharge),
    labourCost: round2(labourCost),
    mountingPrep: round2(mountingPrep),
    multiPanelSurcharge: round2(multiPanelSurcharge),
    deliveryEstimate: round2(deliveryEstimate),
    subtotal: round2(subtotal),
    vat: round2(vat),
    total: round2(total),
  };

  return {
    totalPrice: breakdown.total,
    currency: "GBP",
    breakdown,
    isEstimate: false,
    requiresManualQuote: false,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function emptyBreakdown(): PriceBreakdown {
  return {
    baseMaterial: 0,
    finishSurcharge: 0,
    thicknessSurcharge: 0,
    labourCost: 0,
    mountingPrep: 0,
    multiPanelSurcharge: 0,
    deliveryEstimate: 0,
    subtotal: 0,
    vat: 0,
    total: 0,
  };
}
