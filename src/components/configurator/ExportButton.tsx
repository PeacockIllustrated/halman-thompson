"use client";

import { useState } from "react";
import { useConfiguratorStore } from "@/stores/configurator";
import { downloadSvg, type SvgExportMode } from "@/lib/worktop/exportSvg";
import { downloadDxf } from "@/lib/worktop/exportDxf";

export function ExportButton() {
  const {
    viewMode,
    productType,
    width,
    height,
    thickness,
    selectedFinish,
    worktopConfig,
    getFlatSheet,
  } = useConfiguratorStore();
  const [open, setOpen] = useState(false);

  if (productType !== "worktop" || viewMode !== "flat") return null;

  const flatSheet = getFlatSheet();
  if (!flatSheet) return null;

  const finishName = selectedFinish?.name ?? "Custom";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full rounded-lg bg-ht-dark px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ht-dark/90"
      >
        Export Cut File
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-full min-w-[220px] rounded-lg border border-ht-dark/10 bg-white p-1 shadow-lg">
          {([
            { mode: "workshop" as SvgExportMode, label: "Workshop Print (SVG)", desc: "A4 reference sheet" },
            { mode: "production" as SvgExportMode, label: "Production Print (SVG)", desc: "True 1:1 scale" },
          ]).map(({ mode, label, desc }) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                downloadSvg({
                  flatSheet,
                  config: worktopConfig,
                  finishName,
                  width,
                  depth: height,
                  thickness,
                  productName: "Worktop",
                  mode,
                });
                setOpen(false);
              }}
              className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-ht-dark/5"
            >
              <span className="font-medium">{label}</span>
              <span className="ml-1 text-xs text-gray-400">— {desc}</span>
            </button>
          ))}
          <div className="mx-2 my-1 border-t border-gray-100" />
          <button
            type="button"
            onClick={() => {
              downloadDxf(flatSheet, finishName, width, height);
              setOpen(false);
            }}
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-ht-dark/5"
          >
            Export DXF
          </button>
        </div>
      )}
    </div>
  );
}
