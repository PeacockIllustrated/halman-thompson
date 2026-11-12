"use client";

import { useConfiguratorStore } from "@/stores/configurator";

export function ViewModeToggle() {
  const { viewMode, setViewMode, productType } = useConfiguratorStore();

  if (productType !== "worktop") return null;

  const isFlat = viewMode === "flat";

  return (
    <div className="relative flex rounded-lg sm:rounded-xl bg-black/35 p-0.5 sm:p-1 shadow-lg shadow-black/30 ring-1 ring-white/10 backdrop-blur-xl">
      {/* Animated sliding pill */}
      <span
        className="pointer-events-none absolute inset-y-0.5 sm:inset-y-1 w-[calc(50%-2px)] sm:w-[calc(50%-4px)] rounded-md sm:rounded-[10px] bg-ht-gold-light shadow-sm transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
        style={{ transform: isFlat ? "translateX(calc(100% + 2px))" : "translateX(1px)" }}
      />
      <button
        type="button"
        onClick={() => setViewMode("3d")}
        className={`relative z-10 flex-1 rounded-md sm:rounded-[10px] px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors duration-200 ${
          !isFlat ? "text-ht-dark" : "text-white/55 hover:text-white"
        }`}
      >
        3D
      </button>
      <button
        type="button"
        onClick={() => setViewMode("flat")}
        className={`relative z-10 flex-1 rounded-md sm:rounded-[10px] px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors duration-200 ${
          isFlat ? "text-ht-dark" : "text-white/55 hover:text-white"
        }`}
      >
        Flat
      </button>
    </div>
  );
}
