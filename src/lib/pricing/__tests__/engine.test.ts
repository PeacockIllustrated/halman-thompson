import { describe, it, expect } from "vitest";
import { calculatePrice } from "@/lib/pricing/engine";
import type { PricingRequest } from "@/types";

// Concrete reference configuration used across most assertions.
// Product: splashback (labourMultiplier 1.0).
// Finish: northumberland (copper, priceModifier 1.4, baseMetal copper -> £180/m²).
// 900mm × 600mm -> 0.54 m². Thickness 0.9mm (no surcharge). No mounting. 1 panel.
const BASE_REQUEST: PricingRequest = {
  productType: "splashback",
  finishId: "northumberland",
  width: 900,
  height: 600,
  thickness: 0.9,
  mountingType: "none",
  panelCount: 1,
};

describe("calculatePrice", () => {
  it("computes the full breakdown for a concrete splashback configuration", () => {
    const res = calculatePrice(BASE_REQUEST);

    expect(res.requiresManualQuote).toBe(false);
    expect(res.currency).toBe("GBP");
    expect(res.isEstimate).toBe(false);

    const b = res.breakdown;
    // area 0.54 m² * £180 = £97.20
    expect(b.baseMaterial).toBeCloseTo(97.2, 2);
    // 97.20 * (1.4 - 1) = £38.88
    expect(b.finishSurcharge).toBeCloseTo(38.88, 2);
    // 0.9mm baseline -> no thickness surcharge
    expect(b.thicknessSurcharge).toBeCloseTo(0, 2);
    // 97.20 * 0.15 * 1.0 = £14.58
    expect(b.labourCost).toBeCloseTo(14.58, 2);
    // mounting "none"
    expect(b.mountingPrep).toBeCloseTo(0, 2);
    // single panel
    expect(b.multiPanelSurcharge).toBeCloseTo(0, 2);
    // no pallet needed (both dims <= 1300) -> base delivery only
    expect(b.deliveryEstimate).toBeCloseTo(15, 2);
    // subtotal 165.66, VAT @ 20% = 33.13, total 198.79
    expect(b.subtotal).toBeCloseTo(165.66, 2);
    expect(b.vat).toBeCloseTo(33.13, 2);
    expect(b.total).toBeCloseTo(198.79, 2);
    expect(res.totalPrice).toBeCloseTo(198.79, 2);
  });

  it("applies the thickness surcharge for 1.2mm", () => {
    const res = calculatePrice({ ...BASE_REQUEST, thickness: 1.2 });

    // 0.54 m² * £25/m² = £13.50
    expect(res.breakdown.thicknessSurcharge).toBeCloseTo(13.5, 2);
    // full recompute: subtotal 179.16, VAT 35.83, total 214.99
    expect(res.breakdown.subtotal).toBeCloseTo(179.16, 2);
    expect(res.breakdown.total).toBeCloseTo(214.99, 2);
  });

  it("adds £50 per extra panel for multi-panel builds", () => {
    const res = calculatePrice({ ...BASE_REQUEST, panelCount: 3 });

    // (3 - 1) * £50 = £100
    expect(res.breakdown.multiPanelSurcharge).toBeCloseTo(100, 2);
    // base subtotal 165.66 + 100 = 265.66, total 318.79
    expect(res.breakdown.subtotal).toBeCloseTo(265.66, 2);
    expect(res.breakdown.total).toBeCloseTo(318.79, 2);
  });

  it("charges the pallet surcharge only when a dimension exceeds the threshold", () => {
    // width 1400 > 1300 -> pallet: £15 + £50 = £65
    const withPallet = calculatePrice({ ...BASE_REQUEST, width: 1400 });
    expect(withPallet.breakdown.deliveryEstimate).toBeCloseTo(65, 2);

    // width 1300 is NOT greater than 1300 -> base delivery only: £15
    const noPallet = calculatePrice({ ...BASE_REQUEST, width: 1300 });
    expect(noPallet.breakdown.deliveryEstimate).toBeCloseTo(15, 2);
  });

  it("includes mounting preparation costs", () => {
    // drilled_holes = £15 flat
    const res = calculatePrice({ ...BASE_REQUEST, mountingType: "drilled_holes" });
    expect(res.breakdown.mountingPrep).toBeCloseTo(15, 2);
  });

  it("flags requiresManualQuote for an unknown finishId", () => {
    const res = calculatePrice({ ...BASE_REQUEST, finishId: "not-a-real-finish" });

    expect(res.requiresManualQuote).toBe(true);
    expect(res.totalPrice).toBe(0);
    expect(res.breakdown.total).toBe(0);
  });

  it("flags requiresManualQuote for an unknown productType", () => {
    const res = calculatePrice({
      ...BASE_REQUEST,
      // deliberately invalid product type
      productType: "not-a-real-product" as PricingRequest["productType"],
    });

    expect(res.requiresManualQuote).toBe(true);
    expect(res.totalPrice).toBe(0);
    expect(res.breakdown.total).toBe(0);
  });
});

describe("signage fabrication method labour", () => {
  // Signage (labourMultiplier 2.0). The fabrication method applies an extra
  // labour multiplier on top: engraved 1.0, etched 0.9, laser_cut 1.15,
  // 3d_effect 1.35.
  const SIGNAGE_BASE: PricingRequest = {
    productType: "signage",
    finishId: "northumberland",
    width: 400,
    height: 200,
    thickness: 1.2,
    mountingType: "none",
    panelCount: 1,
  };

  it("scales labour by the fabrication method multiplier", () => {
    const engraved = calculatePrice({ ...SIGNAGE_BASE, fabricationMethod: "engraved" });
    const raised = calculatePrice({ ...SIGNAGE_BASE, fabricationMethod: "3d_effect" });
    const etched = calculatePrice({ ...SIGNAGE_BASE, fabricationMethod: "etched" });

    // Only labour differs; it scales exactly by the method multiplier.
    expect(raised.breakdown.labourCost).toBeCloseTo(
      engraved.breakdown.labourCost * 1.35,
      2
    );
    expect(etched.breakdown.labourCost).toBeCloseTo(
      engraved.breakdown.labourCost * 0.9,
      2
    );

    // A costlier method raises the quoted total; a cheaper one lowers it.
    expect(raised.totalPrice).toBeGreaterThan(engraved.totalPrice);
    expect(etched.totalPrice).toBeLessThan(engraved.totalPrice);

    // Material cost is unaffected by the fabrication method.
    expect(raised.breakdown.baseMaterial).toBeCloseTo(
      engraved.breakdown.baseMaterial,
      2
    );
  });

  it("treats an omitted method as the neutral (engraved) multiplier", () => {
    const engraved = calculatePrice({ ...SIGNAGE_BASE, fabricationMethod: "engraved" });
    const none = calculatePrice({ ...SIGNAGE_BASE });
    expect(none.totalPrice).toBeCloseTo(engraved.totalPrice, 2);
  });

  it("ignores fabricationMethod for non-signage products", () => {
    const plain = calculatePrice(BASE_REQUEST);
    const withMethod = calculatePrice({ ...BASE_REQUEST, fabricationMethod: "3d_effect" });
    // A splashback's labour must never be moved by a signage-only method.
    expect(withMethod.breakdown.labourCost).toBeCloseTo(plain.breakdown.labourCost, 2);
    expect(withMethod.totalPrice).toBeCloseTo(plain.totalPrice, 2);
  });
});
