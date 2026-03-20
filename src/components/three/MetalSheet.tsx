"use client";

import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import { MetalMaterial } from "./MetalMaterial";
import type { MetalType } from "@/types";

interface MetalSheetProps {
  width: number;
  height: number;
  thickness: number;
  baseMetal: MetalType;
  isAged: boolean;
}

const SCALE = 0.01;

export function MetalSheet({ width, height, thickness, baseMetal, isAged }: MetalSheetProps) {
  const dims = useMemo(
    () => ({
      w: width * SCALE,
      h: height * SCALE,
      t: Math.max(thickness * SCALE, 0.02),
    }),
    [width, height, thickness]
  );

  return (
    <RoundedBox args={[dims.w, dims.h, dims.t]} radius={0.02} smoothness={4}>
      <MetalMaterial baseMetal={baseMetal} isAged={isAged} />
    </RoundedBox>
  );
}
