"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { MetalType } from "@/types";

const METAL_COLORS: Record<MetalType, string> = {
  copper: "#b87333",
  brass: "#cd9b1d",
  zinc: "#8a8d8f",
  steel: "#3a3a3a",
  corten: "#8b4513",
};

const METAL_ROUGHNESS: Record<MetalType, number> = {
  copper: 0.35,
  brass: 0.3,
  zinc: 0.45,
  steel: 0.25,
  corten: 0.6,
};

interface MetalMaterialProps {
  baseMetal: MetalType;
  isAged: boolean;
}

export function MetalMaterial({ baseMetal, isAged }: MetalMaterialProps) {
  const materialProps = useMemo(() => {
    const color = new THREE.Color(METAL_COLORS[baseMetal]);
    if (isAged) {
      color.multiplyScalar(0.85);
    }
    return {
      color,
      metalness: 0.9,
      roughness: METAL_ROUGHNESS[baseMetal] + (isAged ? 0.15 : 0),
      envMapIntensity: 1.2,
    };
  }, [baseMetal, isAged]);

  return <meshStandardMaterial {...materialProps} />;
}
