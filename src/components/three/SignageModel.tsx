"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import {
  mergeVertices,
  toCreasedNormals,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MetalMaterial } from "./MetalMaterial";
import { signageFontUrl } from "@/lib/products/signage";
import type { MetalType, SignageConfig } from "@/types";

const SCALE = 0.01;
const CREASE = Math.PI / 3;

function smooth(geo: THREE.BufferGeometry) {
  return toCreasedNormals(mergeVertices(geo), CREASE);
}

/** Rounded-rectangle shape centred on origin (XY plane). */
function roundedRect(w: number, h: number, r: number): THREE.Shape {
  const hw = w / 2;
  const hh = h / 2;
  const rr = Math.max(0, Math.min(r, hw - 0.001, hh - 0.001));
  const s = new THREE.Shape();
  if (rr <= 0.0001) {
    s.moveTo(-hw, -hh);
    s.lineTo(hw, -hh);
    s.lineTo(hw, hh);
    s.lineTo(-hw, hh);
    s.closePath();
    return s;
  }
  s.moveTo(-hw + rr, -hh);
  s.lineTo(hw - rr, -hh);
  s.absarc(hw - rr, -hh + rr, rr, -Math.PI / 2, 0, false);
  s.lineTo(hw, hh - rr);
  s.absarc(hw - rr, hh - rr, rr, 0, Math.PI / 2, false);
  s.lineTo(-hw + rr, hh);
  s.absarc(-hw + rr, hh - rr, rr, Math.PI / 2, Math.PI, false);
  s.lineTo(-hw, -hh + rr);
  s.absarc(-hw + rr, -hh + rr, rr, Math.PI, Math.PI * 1.5, false);
  s.closePath();
  return s;
}

interface SignageModelProps {
  width: number;
  height: number;
  thickness: number;
  baseMetal: MetalType;
  isAged: boolean;
  config: SignageConfig | null;
}

// Text-layer styling per fabrication method (troika Text is unlit; we fake
// recess / relief with colour + Z offset + a shadow layer).
interface TextLayer {
  color: string;
  z: number; // scene units, relative to the plaque front face
  dx?: number;
  dy?: number;
  opacity?: number;
}

function textLayers(method: string, faceZ: number, gauge: number): TextLayer[] {
  const up = gauge * 6;
  switch (method) {
    case "3d_effect":
      return [
        { color: "#1c1206", z: faceZ + up * 0.35, dx: 0.01, dy: -0.01, opacity: 0.9 }, // cast shadow
        { color: "#e8c27a", z: faceZ + up }, // bright raised face
      ];
    case "laser_cut":
      return [{ color: "#0f0b06", z: faceZ + 0.004 }]; // reads as cut-through shadow
    case "etched":
      return [{ color: "#5a4632", z: faceZ + 0.004, opacity: 0.85 }];
    case "engraved":
    default:
      return [{ color: "#241608", z: faceZ + 0.004 }]; // dark recessed
  }
}

export function SignageModel({
  width,
  height,
  thickness,
  baseMetal,
  isAged,
  config,
}: SignageModelProps) {
  const cfg = config;
  const w = width * SCALE;
  const h = height * SCALE;
  const gauge = Math.max(thickness * SCALE, 0.02);
  const faceZ = gauge; // front face of the plaque (toward camera)

  const cornerR = Math.min(w, h) * 0.06;

  // ── Plaque geometry ──
  const plaqueGeo = useMemo(() => {
    const shape = roundedRect(w, h, cornerR);
    return smooth(
      new THREE.ExtrudeGeometry(shape, {
        depth: gauge,
        bevelEnabled: false,
        curveSegments: 32,
      })
    );
  }, [w, h, cornerR, gauge]);

  // ── Raised border frame (optional) ──
  const borderGeo = useMemo(() => {
    if (!cfg?.hasBorder) return null;
    const rawBw = (cfg.borderWidth ?? 15) * SCALE;
    // Cap the border so the framed opening stays positive on small / short
    // plaques — otherwise the inner hole inverts and the frame renders as
    // overlapping metal covering the lettering.
    const maxBw = Math.min(w, h) / 3 - 0.04;
    const bw = Math.max(0, Math.min(rawBw, maxBw));
    if (bw <= 0.015) return null;
    const inset = Math.max(bw * 0.5, 0.04);
    const innerW = w - inset * 2 - bw * 2;
    const innerH = h - inset * 2 - bw * 2;
    if (innerW <= 0.02 || innerH <= 0.02) return null;
    const outer = roundedRect(w - inset * 2, h - inset * 2, Math.max(0, cornerR - inset));
    const inner = roundedRect(
      innerW,
      innerH,
      Math.max(0, cornerR - inset - bw)
    );
    // Convert inner shape to a hole path
    const hole = new THREE.Path(inner.getPoints(48));
    outer.holes.push(hole);
    return smooth(
      new THREE.ExtrudeGeometry(outer, {
        depth: gauge * 1.4,
        bevelEnabled: false,
        curveSegments: 32,
      })
    );
  }, [cfg?.hasBorder, cfg?.borderWidth, w, h, cornerR, gauge]);

  const text = cfg?.text?.trim() || "";
  const fontSize = Math.max((cfg?.fontSize ?? 120) * SCALE, 0.1);
  const fontUrl = signageFontUrl(cfg?.fontFamily ?? "serif");
  const layers = textLayers(cfg?.fabricationMethod ?? "engraved", faceZ, gauge);
  // Leave room for the border when wrapping.
  const margin = (cfg?.hasBorder ? (cfg.borderWidth ?? 15) * SCALE * 2 : 0) + w * 0.08;
  const maxTextWidth = Math.max(w - margin * 2, w * 0.5);

  return (
    <group>
      {/* Plaque */}
      <mesh geometry={plaqueGeo} position={[0, 0, 0]}>
        <MetalMaterial baseMetal={baseMetal} isAged={isAged} doubleSide />
      </mesh>

      {/* Raised border */}
      {borderGeo && (
        <mesh geometry={borderGeo} position={[0, 0, 0]}>
          <MetalMaterial baseMetal={baseMetal} isAged={isAged} doubleSide />
        </mesh>
      )}

      {/* Lettering */}
      {text &&
        layers.map((layer, i) => (
          <Text
            key={i}
            font={fontUrl}
            fontSize={fontSize}
            maxWidth={maxTextWidth}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            lineHeight={1.15}
            letterSpacing={0.02}
            position={[layer.dx ?? 0, layer.dy ?? 0, layer.z]}
            color={layer.color}
            fillOpacity={layer.opacity ?? 1}
            outlineWidth={0}
          >
            {text}
          </Text>
        ))}
    </group>
  );
}
