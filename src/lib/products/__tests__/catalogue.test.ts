import { describe, it, expect } from "vitest";
import {
  PRODUCT_TYPES,
  getProductType,
  getActiveProductTypes,
} from "@/lib/products/catalogue";

describe("getProductType", () => {
  it("returns the matching product config by id", () => {
    const splashback = getProductType("splashback");
    expect(splashback).toBeDefined();
    expect(splashback!.id).toBe("splashback");
    expect(splashback!.name).toBe("Splashback");
  });

  it("returns undefined for an unknown id", () => {
    expect(getProductType("does-not-exist")).toBeUndefined();
  });
});

describe("getActiveProductTypes", () => {
  it("returns only active product types", () => {
    const active = getActiveProductTypes();
    expect(active.length).toBeGreaterThan(0);
    expect(active.every((p) => p.isActive === true)).toBe(true);
    // matches the count of active entries in the source catalogue
    expect(active.length).toBe(PRODUCT_TYPES.filter((p) => p.isActive).length);
    // excludes at least one inactive product (bar_top is inactive in the catalogue)
    expect(active.some((p) => p.id === "bar_top")).toBe(false);
  });
});

describe("product catalogue invariants", () => {
  it("keeps default dimensions within their min/max bounds", () => {
    for (const p of PRODUCT_TYPES) {
      expect(p.defaultWidth, `${p.id} defaultWidth`).toBeGreaterThanOrEqual(p.minWidth);
      expect(p.defaultWidth, `${p.id} defaultWidth`).toBeLessThanOrEqual(p.maxWidth);
      expect(p.defaultHeight, `${p.id} defaultHeight`).toBeGreaterThanOrEqual(p.minHeight);
      expect(p.defaultHeight, `${p.id} defaultHeight`).toBeLessThanOrEqual(p.maxHeight);
    }
  });

  it("includes the default thickness in the available thicknesses", () => {
    for (const p of PRODUCT_TYPES) {
      expect(p.availableThicknesses, `${p.id} availableThicknesses`).toContain(
        p.defaultThickness
      );
    }
  });
});
