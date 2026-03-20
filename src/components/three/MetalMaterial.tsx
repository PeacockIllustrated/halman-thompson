"use client";

import { useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import { useConfiguratorStore } from "@/stores/configurator";
import type { MetalType, Finish } from "@/types";

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
  doubleSide?: boolean;
}

// ── PBR map generation from albedo ──────────────────────────────

interface PBRMaps {
  albedo: THREE.Texture;
  normal: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
  metalness: THREE.CanvasTexture;
}

/**
 * Generate normal, roughness, and metalness maps from an albedo image.
 *
 * The approach analyses each pixel's color to determine surface properties:
 *  - Verdigris (teal/cyan patina) → rough surface, low metalness
 *  - Copper (warm brown/orange) → smooth surface, high metalness
 *  - Darker areas → slightly rougher (oxidation/shadow detail)
 *
 * The normal map is derived via Sobel filter on the luminance channel,
 * giving subtle surface relief that catches light realistically.
 */
function generatePBRMaps(
  image: HTMLImageElement,
  normalStrength: number = 1.5
): Omit<PBRMaps, "albedo"> {
  const w = image.width;
  const h = image.height;

  // Read source pixels
  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = w;
  srcCanvas.height = h;
  const srcCtx = srcCanvas.getContext("2d")!;
  srcCtx.drawImage(image, 0, 0);
  const src = srcCtx.getImageData(0, 0, w, h).data;

  // Output canvases
  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = w;
  normalCanvas.height = h;
  const normalCtx = normalCanvas.getContext("2d")!;
  const normalOut = normalCtx.createImageData(w, h);

  const roughCanvas = document.createElement("canvas");
  roughCanvas.width = w;
  roughCanvas.height = h;
  const roughCtx = roughCanvas.getContext("2d")!;
  const roughOut = roughCtx.createImageData(w, h);

  const metalCanvas = document.createElement("canvas");
  metalCanvas.width = w;
  metalCanvas.height = h;
  const metalCtx = metalCanvas.getContext("2d")!;
  const metalOut = metalCtx.createImageData(w, h);

  // Height map from luminance (for normal map Sobel filter)
  const heights = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    heights[i] =
      (0.299 * src[i * 4] +
        0.587 * src[i * 4 + 1] +
        0.114 * src[i * 4 + 2]) /
      255;
  }

  // Wrap instead of clamp so Sobel filter is seamless at tile boundaries
  const sampleH = (x: number, y: number) =>
    heights[((y % h) + h) % h * w + ((x % w) + w) % w];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const i4 = i * 4;

      const rr = src[i4] / 255;
      const gg = src[i4 + 1] / 255;
      const bb = src[i4 + 2] / 255;

      // ── Verdigris detection ──
      // Verdigris (copper carbonate patina) is characterised by teal/cyan hue:
      // relatively high green + blue, lower red
      const greenness = gg + bb * 0.7 - rr * 1.3;
      const verdigris = Math.min(
        1,
        Math.max(0, (greenness + 0.05) / 0.3)
      );

      const luma = 0.299 * rr + 0.587 * gg + 0.114 * bb;

      // ── Roughness map ──
      // Bare metal: moderately rough (0.4). Verdigris patina: rough (0.75).
      // Darker areas get a slight roughness boost (oxidation in recesses).
      const rough = Math.min(
        1,
        0.4 * (1 - verdigris) + 0.75 * verdigris + (1 - luma) * 0.08
      );
      roughOut.data[i4] = rough * 255;
      roughOut.data[i4 + 1] = rough * 255;
      roughOut.data[i4 + 2] = rough * 255;
      roughOut.data[i4 + 3] = 255;

      // ── Metalness map ──
      // Bare metal: moderately metallic (0.7).
      // Verdigris patina: a mineral deposit, not metallic (0.25).
      const metal = 0.7 * (1 - verdigris) + 0.25 * verdigris;
      metalOut.data[i4] = metal * 255;
      metalOut.data[i4 + 1] = metal * 255;
      metalOut.data[i4 + 2] = metal * 255;
      metalOut.data[i4 + 3] = 255;

      // ── Normal map (Sobel filter) ──
      const tl = sampleH(x - 1, y - 1);
      const t = sampleH(x, y - 1);
      const tr = sampleH(x + 1, y - 1);
      const l = sampleH(x - 1, y);
      const r2 = sampleH(x + 1, y);
      const bl = sampleH(x - 1, y + 1);
      const b2 = sampleH(x, y + 1);
      const br = sampleH(x + 1, y + 1);

      const dX = (tr + 2 * r2 + br) - (tl + 2 * l + bl);
      const dY = (bl + 2 * b2 + br) - (tl + 2 * t + tr);

      const nx = -dX * normalStrength;
      const ny = -dY * normalStrength;
      const nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

      normalOut.data[i4] = ((nx / len) * 0.5 + 0.5) * 255;
      normalOut.data[i4 + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      normalOut.data[i4 + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      normalOut.data[i4 + 3] = 255;
    }
  }

  normalCtx.putImageData(normalOut, 0, 0);
  roughCtx.putImageData(roughOut, 0, 0);
  metalCtx.putImageData(metalOut, 0, 0);

  const makeTex = (canvas: HTMLCanvasElement) => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.LinearSRGBColorSpace; // data texture, not sRGB
    tex.anisotropy = 16;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    return tex;
  };

  return {
    normal: makeTex(normalCanvas),
    roughness: makeTex(roughCanvas),
    metalness: makeTex(metalCanvas),
  };
}

// ── Textured metal (PBR from albedo photograph) ─────────────────

function TexturedMetal({ finish, doubleSide }: { finish: Finish; doubleSide?: boolean }) {
  const [maps, setMaps] = useState<PBRMaps | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();

    loader.load(finish.textures.albedo, (albedo) => {
      if (cancelled) return;

      albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping;
      albedo.colorSpace = THREE.SRGBColorSpace;
      albedo.anisotropy = 16;
      albedo.minFilter = THREE.LinearMipmapLinearFilter;
      albedo.magFilter = THREE.LinearFilter;
      albedo.generateMipmaps = true;

      // Scale texture repeat so it tiles at the real-world physical size.
      // ExtrudeGeometry UVs use raw scene-unit coordinates, so repeat
      // = 1 / (realWorldMm * SCALE) maps the texture to the correct size.
      const repeat =
        1 / ((finish.textures.realWorldWidthMm || 500) * 0.01);
      albedo.repeat.set(repeat, repeat);

      const derived = generatePBRMaps(
        albedo.image as HTMLImageElement,
        1.5
      );

      // Apply same repeat to all derived PBR maps
      derived.normal.repeat.set(repeat, repeat);
      derived.roughness.repeat.set(repeat, repeat);
      derived.metalness.repeat.set(repeat, repeat);

      setMaps({ albedo, ...derived });
    });

    return () => {
      cancelled = true;
    };
  }, [finish.textures.albedo]);

  const material = useMemo(() => {
    if (!maps) return null;

    return new THREE.MeshStandardMaterial({
      map: maps.albedo,
      normalMap: maps.normal,
      normalScale: new THREE.Vector2(0.8, 0.8),
      roughnessMap: maps.roughness,
      roughness: 1.0, // let the map fully control roughness
      metalnessMap: maps.metalness,
      metalness: 1.0, // let the map fully control metalness
      envMapIntensity: 1.0,
      ...(doubleSide ? { side: THREE.DoubleSide } : {}),
    });
  }, [maps, doubleSide]);

  if (!material) {
    return (
      <ProceduralMetal
        baseMetal={finish.baseMetal}
        isAged={finish.isAged}
        doubleSide={doubleSide}
      />
    );
  }

  return <primitive object={material} attach="material" />;
}

// ── Procedural metal (fallback — flat colour + PBR params) ──────

function ProceduralMetal({ baseMetal, isAged, doubleSide }: MetalMaterialProps) {
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

  return <meshStandardMaterial {...materialProps} side={doubleSide ? THREE.DoubleSide : THREE.FrontSide} />;
}

// ── Exported component ──────────────────────────────────────────

export function MetalMaterial({ baseMetal, isAged, doubleSide }: MetalMaterialProps) {
  const selectedFinish = useConfiguratorStore((s) => s.selectedFinish);

  const hasTextures =
    selectedFinish?.textures?.albedo &&
    !selectedFinish.textures.albedo.includes("placeholder");

  if (hasTextures && selectedFinish) {
    return <TexturedMetal finish={selectedFinish} doubleSide={doubleSide} />;
  }

  return <ProceduralMetal baseMetal={baseMetal} isAged={isAged} doubleSide={doubleSide} />;
}
