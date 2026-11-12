"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import {
  getFinishesByMetal,
  getAvailableMetals,
} from "@/lib/products/finishes";
import { useConfiguratorStore } from "@/stores/configurator";
import { FinishSwatch } from "@/components/ui/FinishSwatch";
import type { MetalType } from "@/types";

const METAL_LABELS: Record<MetalType, string> = {
  copper: "Copper",
  brass: "Brass",
  zinc: "Zinc",
  steel: "Steel",
  corten: "Corten",
};

export function FinishSelector() {
  const metals = getAvailableMetals();
  const { selectedFinish, setFinish } = useConfiguratorStore();
  const [activeTab, setActiveTab] = useState<MetalType>(
    selectedFinish?.baseMetal ?? metals[0]
  );

  // Follow the selected finish when it is set from elsewhere (e.g. a
  // product's default finish), so the visible tab always contains it.
  useEffect(() => {
    if (selectedFinish) setActiveTab(selectedFinish.baseMetal);
  }, [selectedFinish]);

  const finishes = getFinishesByMetal(activeTab);
  const activeIdx = metals.indexOf(activeTab);

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-serif text-[22px] leading-tight text-ht-dark">Finish</h3>
        <span className="text-[11px] text-ht-dark/40">Hand-aged, one of a kind</span>
      </div>

      {/* Metal tabs: sliding segmented control */}
      <div className="relative flex rounded-full bg-ht-stone p-1" role="tablist">
        <span
          className="pointer-events-none absolute inset-y-1 rounded-full bg-ht-dark shadow-sm transition-all duration-500 ease-[var(--ease-out-expo)]"
          style={{
            width: `calc(${100 / metals.length}% - 2px)`,
            left: `calc(${(activeIdx * 100) / metals.length}% + 1px)`,
          }}
        />
        {metals.map((metal) => (
          <button
            key={metal}
            role="tab"
            aria-selected={activeTab === metal}
            onClick={() => setActiveTab(metal)}
            className={cn(
              "relative z-10 flex-1 rounded-full px-2 py-2 text-xs font-semibold transition-colors duration-300",
              activeTab === metal
                ? "text-white"
                : "text-ht-dark/50 hover:text-ht-dark"
            )}
          >
            {METAL_LABELS[metal]}
          </button>
        ))}
      </div>

      {/* Finish swatches */}
      <div
        key={activeTab}
        className="grid animate-[fadeSlideIn_300ms_ease-out] grid-cols-3 gap-x-3 gap-y-4"
      >
        {finishes.map((finish) => {
          const isSelected = selectedFinish?.id === finish.id;
          return (
            <button
              key={finish.id}
              onClick={() => setFinish(finish)}
              aria-pressed={isSelected}
              className="group flex flex-col text-left"
            >
              <span
                className={cn(
                  "relative block rounded-[14px] p-[3px] transition-all duration-300",
                  isSelected
                    ? "bg-ht-dark shadow-[0_8px_20px_-10px_rgba(0,0,0,0.6)]"
                    : "bg-transparent"
                )}
              >
                <FinishSwatch
                  finish={finish}
                  rounded="lg"
                  className={cn(
                    "aspect-square w-full rounded-[11px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)] transition-transform duration-500 ease-[var(--ease-out-expo)]",
                    !isSelected && "group-hover:scale-[1.04]"
                  )}
                />
                {isSelected && (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ht-gold-light text-ht-dark shadow">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2.5 6 5 8.5 9.5 3.5" />
                    </svg>
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "mt-2 text-[12px] font-medium leading-tight transition-colors",
                  isSelected ? "text-ht-dark" : "text-ht-dark/70"
                )}
              >
                {finish.name}
              </span>
              <span className="mt-0.5 text-[10px] text-ht-dark/40">
                {finish.priceModifier > 1
                  ? `+${Math.round((finish.priceModifier - 1) * 100)}%`
                  : "Standard"}
              </span>
            </button>
          );
        })}
      </div>

      {selectedFinish && (
        <div
          key={selectedFinish.id}
          className="flex animate-[scaleIn_250ms_ease-out] gap-4 rounded-2xl bg-ht-dark p-4 text-white"
        >
          <FinishSwatch
            finish={selectedFinish}
            rounded="lg"
            className="h-16 w-16 flex-shrink-0 ring-1 ring-white/10"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ht-gold-light/80">
              {METAL_LABELS[selectedFinish.baseMetal]}
              {selectedFinish.isAged ? " · Aged" : ""}
            </p>
            <p className="mt-0.5 font-serif text-lg leading-tight">{selectedFinish.name}</p>
            <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-white/55">
              {selectedFinish.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
