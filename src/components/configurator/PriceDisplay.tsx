"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { useConfiguratorStore } from "@/stores/configurator";

export function PriceDisplay() {
  const {
    calculatedPrice,
    priceBreakdown,
    isPriceLoading,
    selectedFinish,
    calculatePrice,
    width,
    height,
    thickness,
    mountingType,
    panelCount,
    productType,
  } = useConfiguratorStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!selectedFinish) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      calculatePrice();
    }, 200);

    return () => clearTimeout(debounceRef.current);
  }, [width, height, thickness, mountingType, panelCount, productType, selectedFinish, calculatePrice]);

  if (!selectedFinish) {
    return (
      <div className="rounded-xl border border-ht-dark/[0.06] bg-gradient-to-br from-white to-ht-gold/[0.02] p-5">
        <p className="text-sm text-ht-dark/40">Select a finish to see pricing</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ht-dark/[0.06] bg-gradient-to-br from-white to-ht-gold/[0.02] p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-ht-dark/45">Total Price</span>
        {isPriceLoading ? (
          <div className="h-8 w-24 animate-pulse rounded-lg bg-ht-dark/[0.06]" />
        ) : (
          <span className="font-serif text-3xl font-bold tracking-tight text-ht-dark">
            {calculatedPrice !== null ? `£${calculatedPrice.toFixed(2)}` : "—"}
          </span>
        )}
      </div>

      {priceBreakdown && !isPriceLoading && (
        <div className="mt-4 space-y-1.5 border-t border-ht-dark/[0.06] pt-3">
          <BreakdownLine label="Base material" value={priceBreakdown.baseMaterial} />
          {priceBreakdown.finishSurcharge > 0 && (
            <BreakdownLine label="Finish" value={priceBreakdown.finishSurcharge} />
          )}
          {priceBreakdown.thicknessSurcharge !== 0 && (
            <BreakdownLine label="Thickness" value={priceBreakdown.thicknessSurcharge} />
          )}
          <BreakdownLine label="Labour" value={priceBreakdown.labourCost} />
          {priceBreakdown.mountingPrep > 0 && (
            <BreakdownLine label="Mounting prep" value={priceBreakdown.mountingPrep} />
          )}
          {priceBreakdown.multiPanelSurcharge > 0 && (
            <BreakdownLine label="Multi-panel" value={priceBreakdown.multiPanelSurcharge} />
          )}
          <BreakdownLine label="Delivery" value={priceBreakdown.deliveryEstimate} />
          <div className="border-t border-ht-dark/[0.06] pt-1.5">
            <BreakdownLine label="Subtotal" value={priceBreakdown.subtotal} bold />
            <BreakdownLine label="VAT (20%)" value={priceBreakdown.vat} />
          </div>
        </div>
      )}

      <p className="mt-3 text-[10px] text-ht-dark/35">
        Prices include delivery. VAT at 20%. Estimated 5-8 week lead time.
      </p>
    </div>
  );
}

function BreakdownLine({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className={bold ? "font-medium text-ht-dark" : "text-ht-dark/60"}>{label}</span>
      <span className={cn("tabular-nums", bold ? "font-medium text-ht-dark" : "text-ht-dark/60")}>
        {value < 0 ? "-" : ""}£{Math.abs(value).toFixed(2)}
      </span>
    </div>
  );
}
