"use client";

import { useEffect, useRef, useState } from "react";
import { useConfiguratorStore } from "@/stores/configurator";
import type { CutoutShape } from "@/types";

const shapes: { id: CutoutShape; label: string }[] = [
  { id: "rectangle", label: "Rectangle" },
  { id: "square", label: "Square" },
  { id: "oval", label: "Oval" },
];

/** Icon for each cutout shape — simple SVG outlines */
function ShapeIcon({ shape, active }: { shape: CutoutShape; active: boolean }) {
  const sw = active ? 2 : 1.5;
  const fill = active ? "currentColor" : "none";
  const fillOpacity = active ? 0.12 : 0;

  if (shape === "rectangle")
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect
          x="2" y="4" width="16" height="12" rx="2"
          stroke="currentColor" strokeWidth={sw}
          fill={fill} fillOpacity={fillOpacity}
        />
      </svg>
    );

  if (shape === "square")
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect
          x="3" y="3" width="14" height="14" rx="2"
          stroke="currentColor" strokeWidth={sw}
          fill={fill} fillOpacity={fillOpacity}
        />
      </svg>
    );

  // oval
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <ellipse
        cx="10" cy="10" rx="8" ry="6"
        stroke="currentColor" strokeWidth={sw}
        fill={fill} fillOpacity={fillOpacity}
      />
    </svg>
  );
}

export function CutoutShapeSelector() {
  const { productType, worktopConfig, setWorktopConfig } =
    useConfiguratorStore();

  // Track whether shapes tray should render (for exit animation)
  const cutoutEnabled = productType === "worktop" && worktopConfig.cutout.enabled;
  const [showShapes, setShowShapes] = useState(cutoutEnabled);
  const [animIn, setAnimIn] = useState(cutoutEnabled);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (cutoutEnabled) {
      // Mount immediately, then animate in on next frame
      setShowShapes(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimIn(true)));
    } else {
      // Animate out, then unmount after transition
      setAnimIn(false);
      timeoutRef.current = setTimeout(() => setShowShapes(false), 250);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [cutoutEnabled]);

  if (productType !== "worktop") return null;

  const current = worktopConfig.cutout.shape;

  const toggleCutout = () => {
    setWorktopConfig({
      ...worktopConfig,
      cutout: { ...worktopConfig.cutout, enabled: !cutoutEnabled },
    });
  };

  const setShape = (shape: CutoutShape) => {
    if (shape === current) return;
    setWorktopConfig({
      ...worktopConfig,
      cutout: { ...worktopConfig.cutout, shape },
    });
  };

  return (
    <div className="flex items-center gap-1 rounded-lg sm:rounded-xl bg-white/80 p-0.5 sm:p-1 shadow-lg shadow-black/[0.08] ring-1 ring-black/[0.06] backdrop-blur-md transition-all duration-250">
      {/* Add / remove cutout toggle */}
      <button
        type="button"
        onClick={toggleCutout}
        title={cutoutEnabled ? "Remove cutout" : "Add cutout"}
        className="flex items-center justify-center rounded-md sm:rounded-lg px-2 py-1.5 bg-ht-gold text-white shadow-sm transition-all duration-200"
      >
        <svg
          width="20" height="20" viewBox="0 0 20 20" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          className="transition-transform duration-300"
          style={{ transform: cutoutEnabled ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          {/* Always render + shape; rotation makes it appear as X */}
          <line x1="10" y1="4" x2="10" y2="16" />
          <line x1="4" y1="10" x2="16" y2="10" />
        </svg>
      </button>

      {/* Shape buttons — animate in/out */}
      {showShapes && (
        <>
          <div
            className="h-5 w-px bg-black/10 transition-all duration-200"
            style={{
              opacity: animIn ? 1 : 0,
              marginLeft: animIn ? 2 : 0,
              marginRight: animIn ? 2 : 0,
            }}
          />
          {shapes.map((s, i) => {
            const isActive = s.id === current;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setShape(s.id)}
                title={s.label}
                className={`flex items-center justify-center rounded-md sm:rounded-lg py-1.5 transition-all duration-200 ${
                  isActive
                    ? "bg-ht-dark text-white shadow-sm"
                    : "text-ht-dark/40 hover:text-ht-dark/70"
                }`}
                style={{
                  opacity: animIn ? 1 : 0,
                  transform: animIn ? "scale(1) translateX(0)" : "scale(0.5) translateX(-8px)",
                  width: animIn ? 36 : 0,
                  paddingLeft: animIn ? 8 : 0,
                  paddingRight: animIn ? 8 : 0,
                  transitionDelay: animIn ? `${60 * (i + 1)}ms` : "0ms",
                  overflow: "hidden",
                }}
              >
                <ShapeIcon shape={s.id} active={isActive} />
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}
