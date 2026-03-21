"use client";

import { useRef, useState } from "react";
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

  // Track active metal tab button for sliding pill position
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeIdx = metals.indexOf(activeTab);

  return (
    <div className="space-y-5">
      <h3 className="font-serif text-lg font-semibold tracking-wide">Select Finish</h3>

      {/* Metal type tabs — sliding pill */}
      <div ref={tabsRef} className="relative flex rounded-xl bg-ht-dark/[0.06] p-1">
        {/* Animated pill */}
        <span
          className="pointer-events-none absolute inset-y-1 rounded-[10px] bg-white shadow-sm transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
          style={{
            width: `calc(${100 / metals.length}% - 4px)`,
            transform: `translateX(calc(${activeIdx * 100}% + ${activeIdx * 4}px + 2px))`,
          }}
        />
        {metals.map((metal) => (
          <button
            key={metal}
            onClick={() => setActiveTab(metal)}
            className={cn(
              "relative z-10 flex-1 rounded-[10px] px-2 py-2 text-xs font-medium transition-colors duration-200",
              activeTab === metal
                ? "text-ht-dark"
                : "text-ht-dark/45 hover:text-ht-dark/65"
            )}
          >
            {METAL_LABELS[metal]}
          </button>
        ))}
      </div>

      {/* Finish swatches */}
      <div className="grid grid-cols-3 gap-2.5">
        {finishes.map((finish) => {
          const isSelected = selectedFinish?.id === finish.id;
          return (
            <button
              key={finish.id}
              onClick={() => setFinish(finish)}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-xl p-2.5 transition-all duration-200",
                isSelected
                  ? "bg-ht-gold/[0.08] ring-2 ring-ht-gold/80"
                  : "hover:bg-ht-dark/[0.04]"
              )}
            >
              <div className="relative">
                {!finish.swatchImageUrl.includes("placeholder") ? (
                  <img
                    src={finish.swatchImageUrl}
                    alt={finish.name}
                    className="h-14 w-14 rounded-full object-cover shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className={cn(
                      "h-14 w-14 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] transition-transform duration-200 group-hover:scale-105",
                      METAL_COLORS[finish.baseMetal]
                    )}
                    style={{ opacity: finish.isAged ? 0.8 : 1 }}
                  />
                )}
                {/* Selection check */}
                {isSelected && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ht-gold text-white shadow-sm">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2.5 6 5 8.5 9.5 3.5" />
                    </svg>
                  </span>
                )}
              </div>
              <span className="text-center text-[11px] font-medium leading-tight text-ht-dark/70">
                {finish.name}
              </span>
              {finish.priceModifier > 1 && (
                <span className="text-[10px] text-ht-dark/35">
                  +{Math.round((finish.priceModifier - 1) * 100)}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedFinish && (
        <div className="animate-[scaleIn_200ms_ease-out] rounded-xl border border-ht-gold/15 bg-ht-gold/[0.04] p-3.5">
          <p className="text-sm font-medium text-ht-dark">{selectedFinish.name}</p>
          <p className="mt-0.5 text-xs text-ht-dark/50">{selectedFinish.subtitle}</p>
        </div>
      )}
    </div>
  );
}
