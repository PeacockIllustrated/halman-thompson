"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";
import { SLAB_THICKNESS } from "./WorktopModel";

interface DimensionLabelsProps {
  width: number;
  height: number;
  orientation?: "vertical" | "horizontal";
}

const SCALE = 0.01;

export function DimensionLabels({
  width,
  height,
  orientation = "vertical",
}: DimensionLabelsProps) {
  const w = width * SCALE;
  const h = height * SCALE;

  const positions = useMemo(() => {
    if (orientation === "horizontal") {
      return {
        width: [0, -SLAB_THICKNESS / 2 - 0.25, h / 2 + 0.2] as [
          number,
          number,
          number,
        ],
        height: [w / 2 + 0.25, -SLAB_THICKNESS / 2, 0] as [
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

  const heightLabel = orientation === "horizontal" ? "Depth" : "Height";

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
          <span className="mr-1 text-white/60">{heightLabel}</span>
          {height}mm
        </div>
      </Html>
    </group>
  );
}
