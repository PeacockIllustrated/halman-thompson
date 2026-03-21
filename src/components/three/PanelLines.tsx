"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import type { PanelLayout } from "@/types";

interface PanelLinesProps {
  width: number;
  height: number;
  thickness: number;
  panelLayout: PanelLayout | null;
  orientation?: "vertical" | "horizontal";
}

const SCALE = 0.01;

export function PanelLines({
  width,
  height,
  thickness,
  panelLayout,
  orientation = "vertical",
}: PanelLinesProps) {
  const lines = useMemo(() => {
    if (!panelLayout || panelLayout.panelCount <= 1) return [];

    const w = width * SCALE;
    const h = height * SCALE;
    const result: [number, number, number][][] = [];

    const panelsWide = Math.ceil(width / 2000);
    const panelsHigh = Math.ceil(height / 1000);

    if (orientation === "horizontal") {
      // Lines on the TOP surface of a horizontal slab (XZ plane)
      const topY = 0.05 / 2 + 0.005;

      for (let i = 1; i < panelsWide; i++) {
        const x = -w / 2 + (w / panelsWide) * i;
        result.push([
          [x, topY, -h / 2],
          [x, topY, h / 2],
        ]);
      }

      for (let i = 1; i < panelsHigh; i++) {
        const z = -h / 2 + (h / panelsHigh) * i;
        result.push([
          [-w / 2, topY, z],
          [w / 2, topY, z],
        ]);
      }
    } else {
      // Lines on the FRONT face of a vertical sheet (XY plane)
      const t = Math.max(thickness * SCALE, 0.02);

      for (let i = 1; i < panelsWide; i++) {
        const x = -w / 2 + (w / panelsWide) * i;
        result.push([
          [x, -h / 2, t / 2 + 0.005],
          [x, h / 2, t / 2 + 0.005],
        ]);
      }

      for (let i = 1; i < panelsHigh; i++) {
        const y = -h / 2 + (h / panelsHigh) * i;
        result.push([
          [-w / 2, y, t / 2 + 0.005],
          [w / 2, y, t / 2 + 0.005],
        ]);
      }
    }

    return result;
  }, [width, height, thickness, panelLayout, orientation]);

  if (lines.length === 0) return null;

  return (
    <group>
      {lines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#ffffff"
          lineWidth={1.5}
          dashed
          dashSize={0.05}
          gapSize={0.03}
          opacity={0.6}
          transparent
        />
      ))}
    </group>
  );
}
