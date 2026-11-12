"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";
interface DimensionLabelsProps {
  width: number;
  height: number;
  orientation?: "vertical" | "horizontal";
}

const SCALE = 0.01;
const LABEL_OFFSET = 0.05; // small offset below slab surface for label positioning

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

  const heightLabel = orientation === "horizontal" ? "Depth" : "Height";

  return (
    <group>
      <Html position={positions.width} center style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[11px] font-medium tabular-nums text-white/90 backdrop-blur-md">
          {width}mm
        </div>
      </Html>
      <Html
        position={positions.height}
        center
        style={{ pointerEvents: "none" }}
      >
        <div className="whitespace-nowrap rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[11px] font-medium tabular-nums text-white/90 backdrop-blur-md">
          <span className="mr-1 text-white/50">{heightLabel}</span>
          {height}mm
        </div>
      </Html>
    </group>
  );
}
