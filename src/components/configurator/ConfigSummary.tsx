"use client";

import { useConfiguratorStore } from "@/stores/configurator";

export function ConfigSummary() {
  const {
    productType,
    selectedFinish,
    width,
    height,
    thickness,
    mountingType,
    panelCount,
  } = useConfiguratorStore();

  return (
    <div className="space-y-2">
      <h3 className="font-serif text-lg font-semibold">Your Configuration</h3>
      <div className="space-y-1.5 text-sm">
        <SummaryRow label="Product" value={productType.replace(/_/g, " ")} />
        <SummaryRow label="Finish" value={selectedFinish?.name ?? "Not selected"} />
        <SummaryRow label="Width" value={`${width}mm`} />
        <SummaryRow
          label={
            productType === "worktop" || productType === "bar_top" || productType === "table_top"
              ? "Depth"
              : "Height"
          }
          value={`${height}mm`}
        />
        <SummaryRow label="Thickness" value={`${thickness}mm`} />
        <SummaryRow label="Mounting" value={mountingType.replace(/_/g, " ")} />
        {panelCount > 1 && (
          <SummaryRow label="Panels" value={`${panelCount} panels`} />
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ht-dark/50">{label}</span>
      <span className="font-medium capitalize text-ht-dark">{value}</span>
    </div>
  );
}
