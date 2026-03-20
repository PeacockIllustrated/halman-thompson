"use client";

import { useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useConfiguratorStore } from "@/stores/configurator";
import { getProductType } from "@/lib/products/catalogue";
import { clampWidth, clampHeight, requiresMultiPanel } from "@/lib/products/constraints";

export function DimensionControls() {
  const {
    productType,
    width,
    height,
    thickness,
    panelCount,
    setWidth,
    setHeight,
    setThickness,
  } = useConfiguratorStore();

  const product = getProductType(productType);

  const handleWidthChange = useCallback(
    (value: number) => {
      if (product) setWidth(clampWidth(value, product));
    },
    [setWidth, product]
  );

  const handleHeightChange = useCallback(
    (value: number) => {
      if (product) setHeight(clampHeight(value, product));
    },
    [setHeight, product]
  );

  if (!product) return null;

  const isMultiPanel = requiresMultiPanel(width, height);
  const heightLabel =
    productType === "worktop" || productType === "bar_top" || productType === "table_top"
      ? "Depth"
      : "Height";

  return (
    <div className="space-y-5">
      <h3 className="font-serif text-lg font-semibold">Dimensions</h3>

      <div className="space-y-2">
        <Slider
          label="Width"
          value={width}
          onValueChange={handleWidthChange}
          min={product.minWidth}
          max={product.maxWidth}
          step={10}
        />
        <Input
          type="number"
          value={width}
          onChange={(e) => handleWidthChange(Number(e.target.value))}
          min={product.minWidth}
          max={product.maxWidth}
          step={10}
          unit="mm"
        />
      </div>

      <div className="space-y-2">
        <Slider
          label={heightLabel}
          value={height}
          onValueChange={handleHeightChange}
          min={product.minHeight}
          max={product.maxHeight}
          step={10}
        />
        <Input
          type="number"
          value={height}
          onChange={(e) => handleHeightChange(Number(e.target.value))}
          min={product.minHeight}
          max={product.maxHeight}
          step={10}
          unit="mm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-ht-dark">Thickness</label>
        <select
          value={thickness}
          onChange={(e) => setThickness(Number(e.target.value))}
          className="h-10 w-full rounded-md border border-ht-dark/20 bg-white px-3 text-sm text-ht-dark focus:border-ht-gold focus:outline-none focus:ring-1 focus:ring-ht-gold/50"
        >
          {product.availableThicknesses.map((t) => (
            <option key={t} value={t}>
              {t}mm{t === product.defaultThickness ? " (recommended)" : ""}
            </option>
          ))}
        </select>
      </div>

      {isMultiPanel && (
        <div className="rounded-lg border border-amber-300/50 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-800">Multi-Panel Fabrication</p>
          <p className="mt-1 text-xs text-amber-700">
            This piece requires {panelCount} panels aged together for visual
            consistency. A surcharge of &pound;{(panelCount - 1) * 50} applies.
          </p>
        </div>
      )}
    </div>
  );
}
