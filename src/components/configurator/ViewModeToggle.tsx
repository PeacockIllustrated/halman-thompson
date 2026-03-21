"use client";

import { useConfiguratorStore } from "@/stores/configurator";

export function ViewModeToggle() {
  const { viewMode, setViewMode, productType } = useConfiguratorStore();

  if (productType !== "worktop") return null;

  const isFlat = viewMode === "flat";

  return (
    <div className="relative flex rounded-lg sm:rounded-xl bg-white/80 p-0.5 sm:p-1 shadow-lg shadow-black/[0.08] ring-1 ring-black/[0.06] backdrop-blur-md">
      {/* Animated sliding pill */}
      <span
        className="pointer-events-none absolute inset-y-0.5 sm:inset-y-1 w-[calc(50%-2px)] sm:w-[calc(50%-4px)] rounded-md sm:rounded-[10px] bg-ht-dark shadow-sm transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
        style={{ transform: isFlat ? "translateX(calc(100% + 2px))" : "translateX(1px)" }}
      />
      <button
        type="button"
        onClick={() => setViewMode("3d")}
        className={`relative z-10 flex-1 rounded-md sm:rounded-[10px] px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors duration-200 ${
          !isFlat ? "text-white" : "text-ht-dark/50 hover:text-ht-dark/70"
        }`}
      >
        3D
      </button>
      <button
        type="button"
        onClick={() => setViewMode("flat")}
        className={`relative z-10 flex-1 rounded-md sm:rounded-[10px] px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors duration-200 ${
          isFlat ? "text-white" : "text-ht-dark/50 hover:text-ht-dark/70"
        }`}
      >
        Flat
      </button>
    </div>
  );
}
