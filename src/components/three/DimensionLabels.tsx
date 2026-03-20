"use client";

import { Html } from "@react-three/drei";

interface DimensionLabelsProps {
  width: number;
  height: number;
}

const SCALE = 0.01;

export function DimensionLabels({ width, height }: DimensionLabelsProps) {
  const w = width * SCALE;
  const h = height * SCALE;

  return (
    <group>
      <Html position={[0, -h / 2 - 0.3, 0]} center style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap rounded bg-ht-dark/80 px-2 py-0.5 text-xs font-medium tabular-nums text-white">
          {width}mm
        </div>
      </Html>
      <Html position={[w / 2 + 0.3, 0, 0]} center style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap rounded bg-ht-dark/80 px-2 py-0.5 text-xs font-medium tabular-nums text-white">
          {height}mm
        </div>
      </Html>
    </group>
  );
}
