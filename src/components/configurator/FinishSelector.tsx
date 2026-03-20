"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import {
  getFinishesByMetal,
  getAvailableMetals,
} from "@/lib/products/finishes";
import { useConfiguratorStore } from "@/stores/configurator";
import type { MetalType } from "@/types";

const METAL_LABELS: Record<MetalType, string> = {
  copper: "Copper",
  brass: "Brass",
  zinc: "Zinc",
  steel: "Steel",
  corten: "Corten",
};

const METAL_COLORS: Record<MetalType, string> = {
  copper: "bg-ht-copper",
  brass: "bg-ht-brass",
  zinc: "bg-ht-zinc",
  steel: "bg-gray-600",
  corten: "bg-amber-800",
};

export function FinishSelector() {
  const metals = getAvailableMetals();
  const [activeTab, setActiveTab] = useState<MetalType>(metals[0]);
  const { selectedFinish, setFinish } = useConfiguratorStore();

  const finishes = getFinishesByMetal(activeTab);

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-lg font-semibold">Select Finish</h3>

      {/* Metal type tabs */}
      <div className="flex gap-1 rounded-lg bg-ht-dark/5 p-1">
        {metals.map((metal) => (
          <button
            key={metal}
            onClick={() => setActiveTab(metal)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === metal
                ? "bg-white text-ht-dark shadow-sm"
                : "text-ht-dark/50 hover:text-ht-dark/70"
            )}
          >
            {METAL_LABELS[metal]}
          </button>
        ))}
      </div>

      {/* Finish swatches */}
      <div className="grid grid-cols-3 gap-3">
        {finishes.map((finish) => {
          const isSelected = selectedFinish?.id === finish.id;
          return (
            <button
              key={finish.id}
              onClick={() => setFinish(finish)}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-lg p-2 transition-all",
                isSelected
                  ? "bg-ht-gold/10 ring-2 ring-ht-gold"
                  : "hover:bg-ht-dark/5"
              )}
            >
              {!finish.swatchImageUrl.includes("placeholder") ? (
                <img
                  src={finish.swatchImageUrl}
                  alt={finish.name}
                  className="h-12 w-12 rounded-full object-cover shadow-inner transition-transform group-hover:scale-110"
                />
              ) : (
                <div
                  className={cn(
                    "h-12 w-12 rounded-full shadow-inner transition-transform group-hover:scale-110",
                    METAL_COLORS[finish.baseMetal]
                  )}
                  style={{ opacity: finish.isAged ? 0.8 : 1 }}
                />
              )}
              <span className="text-center text-xs font-medium leading-tight text-ht-dark/80">
                {finish.name}
              </span>
              {finish.priceModifier > 1 && (
                <span className="text-[10px] text-ht-dark/40">
                  +{Math.round((finish.priceModifier - 1) * 100)}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedFinish && (
        <div className="rounded-lg border border-ht-gold/20 bg-ht-gold/5 p-3">
          <p className="text-sm font-medium text-ht-dark">{selectedFinish.name}</p>
          <p className="mt-0.5 text-xs text-ht-dark/60">{selectedFinish.subtitle}</p>
        </div>
      )}
    </div>
  );
}
