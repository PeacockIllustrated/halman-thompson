"use client";

import { useState, useRef, useEffect } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (productType !== "worktop" || viewMode !== "flat") return null;

  const flatSheet = getFlatSheet();
  if (!flatSheet) return null;

  const finishName = selectedFinish?.name ?? "Custom";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2 text-sm font-medium text-ht-dark shadow-lg shadow-black/[0.08] ring-1 ring-black/[0.06] backdrop-blur-md transition-all duration-200 hover:bg-white hover:shadow-xl active:scale-[0.97]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 1v9M4.5 7.5 8 10l3.5-2.5" />
          <path d="M2 11v2.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V11" />
        </svg>
        Export Cut File
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 min-w-[220px] animate-[scaleIn_150ms_ease-out] rounded-xl border border-ht-dark/[0.06] bg-white/95 p-1.5 shadow-xl backdrop-blur-md">
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
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-ht-dark/[0.04]"
            >
              <span className="font-medium text-ht-dark">{label}</span>
              <span className="ml-1 text-xs text-ht-dark/35">— {desc}</span>
            </button>
          ))}
          <div className="mx-2 my-1 border-t border-ht-dark/[0.06]" />
          <button
            type="button"
            onClick={() => {
              downloadDxf(flatSheet, finishName, width, height);
              setOpen(false);
            }}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-ht-dark/[0.04]"
          >
            Export DXF
          </button>
        </div>
      )}
    </div>
  );
}
