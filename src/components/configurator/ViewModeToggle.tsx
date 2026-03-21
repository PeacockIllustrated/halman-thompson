"use client";

import { useConfiguratorStore } from "@/stores/configurator";

export function ViewModeToggle() {
  const { viewMode, setViewMode, productType } = useConfiguratorStore();

  if (productType !== "worktop") return null;

  return (
    <div className="flex gap-1 rounded-lg border border-ht-dark/10 p-1">
      <button
        type="button"
        onClick={() => setViewMode("3d")}
        className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode !== "flat"
            ? "bg-ht-gold text-white"
            : "text-ht-dark/60 hover:bg-ht-dark/5"
        }`}
      >
        3D View
      </button>
      <button
        type="button"
        onClick={() => setViewMode("flat")}
        className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode === "flat"
            ? "bg-ht-gold text-white"
            : "text-ht-dark/60 hover:bg-ht-dark/5"
        }`}
      >
        Flat Pattern
      </button>
    </div>
  );
}
