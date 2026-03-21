"use client";

import { useCallback, useRef } from "react";
import { useConfiguratorStore } from "@/stores/configurator";

export function SplitLineOverlay() {
  const { viewMode, productType, worktopConfig, setWorktopConfig, getFlatSheet } =
    useConfiguratorStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const flatSheet = getFlatSheet();

  const isVisible =
    productType === "worktop" &&
    viewMode === "flat" &&
    !!flatSheet?.requiresSplit;

  const isVertical = flatSheet?.splitDirection === "vertical";
  const position = flatSheet?.splitPosition ?? 0;
  const total = isVertical
    ? (flatSheet?.totalWidth ?? 1)
    : (flatSheet?.totalHeight ?? 1);

  const handleDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container || !flatSheet) return;

      const onMove = (ev: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const ratio = isVertical
          ? (ev.clientX - rect.left) / rect.width
          : (ev.clientY - rect.top) / rect.height;
        const newPos = Math.round(ratio * total);
        const minPos = 200;
        const maxPos = total - 200;
        const clamped = Math.max(minPos, Math.min(maxPos, newPos));
        setWorktopConfig({
          ...worktopConfig,
          splitPosition: clamped,
          splitDirection: flatSheet.splitDirection,
        });
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [isVertical, total, worktopConfig, setWorktopConfig, flatSheet]
  );

  if (!isVisible) return null;

  const percent = (position / total) * 100;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-10"
    >
      <div
        className="pointer-events-auto absolute"
        style={
          isVertical
            ? { left: `${percent}%`, top: 0, bottom: 0, width: 8, transform: "translateX(-50%)", cursor: "col-resize" }
            : { top: `${percent}%`, left: 0, right: 0, height: 8, transform: "translateY(-50%)", cursor: "row-resize" }
        }
        onMouseDown={handleDrag}
      >
        <div
          className={`bg-green-500 ${isVertical ? "h-full w-0.5 mx-auto" : "w-full h-0.5 my-auto"}`}
          style={{ opacity: 0.8 }}
        />
      </div>
    </div>
  );
}
