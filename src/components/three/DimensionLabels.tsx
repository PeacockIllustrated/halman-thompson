"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";
interface DimensionLabelsProps {
  width: number;
  height: number;
  orientation?: "vertical" | "horizontal";
  /**
   * Overrides the second-dimension caption. Defaults to "Depth" for horizontal
   * (top-down) products and "Height" for vertical ones — but a horizontally
   * previewed yet wall-mounted product (e.g. a wall panel) is "Height".
   */
  heightLabel?: string;
}

const SCALE = 0.01;
const LABEL_OFFSET = 0.05; // small offset below slab surface for label positioning

export function DimensionLabels({
  width,
  height,
  orientation = "vertical",
  heightLabel,
}: DimensionLabelsProps) {
  const w = width * SCALE;
  const h = height * SCALE;

  const positions = useMemo(() => {
    if (orientation === "horizontal") {
      return {
        width: [0, -LABEL_OFFSET / 2 - 0.25, h / 2 + 0.2] as [
          number,
          number,
          number,
        ],
        height: [w / 2 + 0.25, -LABEL_OFFSET / 2, 0] as [
          number,
          number,
          number,
        ],
      };
    }
    return {
      width: [0, -h / 2 - 0.3, 0] as [number, number, number],
      height: [w / 2 + 0.3, 0, 0] as [number, number, number],
    };
  }, [w, h, orientation]);

  const secondDimLabel =
    heightLabel ?? (orientation === "horizontal" ? "Depth" : "Height");

  return (
    <group>
      <Html position={positions.width} center style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap rounded bg-ht-dark/80 px-2 py-0.5 text-xs font-medium tabular-nums text-white">
          {width}mm
        </div>
      </Html>
      <Html
        position={positions.height}
        center
        style={{ pointerEvents: "none" }}
      >
        <div className="whitespace-nowrap rounded bg-ht-dark/80 px-2 py-0.5 text-xs font-medium tabular-nums text-white">
          <span className="mr-1 text-white/60">{secondDimLabel}</span>
          {height}mm
        </div>
      </Html>
    </group>
  );
}
