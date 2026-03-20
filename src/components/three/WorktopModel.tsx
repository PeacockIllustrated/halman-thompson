"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  mergeVertices,
  toCreasedNormals,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MetalMaterial } from "./MetalMaterial";
import type { MetalType, WorktopConfig } from "@/types";

interface WorktopModelProps {
  width: number;
  depth: number;
  baseMetal: MetalType;
  isAged: boolean;
  config: WorktopConfig;
}

const SCALE = 0.01;
export const SLAB_THICKNESS = 0.3; // 30mm visual slab depth
const METAL_GAUGE = 0.02; // 2mm visual metal sheet thickness
const CREASE_ANGLE = Math.PI / 3; // 60° — smooth curves, sharp flat-to-curved edges

/**
 * Merge duplicate vertices then apply creased normals.
 * Curved surfaces (dihedral angle < 60°) get smooth shading.
 * Flat-to-curved boundaries (dihedral angle ~90°) stay sharp.
 */
function smoothGeo(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return toCreasedNormals(mergeVertices(geo), CREASE_ANGLE);
}

// ── Shape builders ──────────────────────────────────────────────

/**
 * Rounded-rectangle slab outline with independent front/back corner radii.
 * rf = front corner radius (front-left, front-right)
 * rb = back corner radius (back-left, back-right)
 */
function buildSlabShape(
  hw: number,
  hd: number,
  rf: number,
  rb: number
): THREE.Shape {
  const shape = new THREE.Shape();

  // Start at back-left, going right along the back edge
  shape.moveTo(-hw + (rb > 0.0001 ? rb : 0), -hd);

  // Back edge → back-right corner
  if (rb > 0.0001) {
    shape.lineTo(hw - rb, -hd);
    shape.absarc(hw - rb, -hd + rb, rb, -Math.PI / 2, 0, false);
  } else {
    shape.lineTo(hw, -hd);
  }

  // Right edge → front-right corner
  if (rf > 0.0001) {
    shape.lineTo(hw, hd - rf);
    shape.absarc(hw - rf, hd - rf, rf, 0, Math.PI / 2, false);
  } else {
    shape.lineTo(hw, hd);
  }

  // Front edge → front-left corner
  if (rf > 0.0001) {
    shape.lineTo(-hw + rf, hd);
    shape.absarc(-hw + rf, hd - rf, rf, Math.PI / 2, Math.PI, false);
  } else {
    shape.lineTo(-hw, hd);
  }

  // Left edge → back-left corner
  if (rb > 0.0001) {
    shape.lineTo(-hw, -hd + rb);
    shape.absarc(-hw + rb, -hd + rb, rb, Math.PI, Math.PI * 1.5, false);
  } else {
    shape.lineTo(-hw, -hd);
  }

  return shape;
}

/**
 * Front return strip footprint. Uses rf for front corners.
 */
function buildFrontReturnShape(
  hw: number,
  hd: number,
  rf: number,
  g: number
): THREE.Shape {
  const s = new THREE.Shape();
  if (rf < 0.0001) {
    s.moveTo(hw, hd);
    s.lineTo(-hw, hd);
    s.lineTo(-hw, hd - g);
    s.lineTo(hw, hd - g);
    s.closePath();
    return s;
  }
  const ri = Math.max(rf - g, 0.0001);
  s.moveTo(hw, hd - rf);
  s.absarc(hw - rf, hd - rf, rf, 0, Math.PI / 2, false);
  s.lineTo(-hw + rf, hd);
  s.absarc(-hw + rf, hd - rf, rf, Math.PI / 2, Math.PI, false);
  s.lineTo(-hw + g, hd - rf);
  s.absarc(-hw + rf, hd - rf, ri, Math.PI, Math.PI / 2, true);
  s.lineTo(hw - rf, hd - g);
  s.absarc(hw - rf, hd - rf, ri, Math.PI / 2, 0, true);
  s.closePath();
  return s;
}

/**
 * Back edge strip footprint (used for both upstand and back return).
 * Uses rb for back corners.
 */
function buildBackEdgeShape(
  hw: number,
  hd: number,
  rb: number,
  g: number
): THREE.Shape {
  const s = new THREE.Shape();
  if (rb < 0.0001) {
    s.moveTo(-hw, -hd);
    s.lineTo(hw, -hd);
    s.lineTo(hw, -hd + g);
    s.lineTo(-hw, -hd + g);
    s.closePath();
    return s;
  }
  const ri = Math.max(rb - g, 0.0001);
  s.moveTo(-hw, -hd + rb);
  s.absarc(-hw + rb, -hd + rb, rb, Math.PI, Math.PI * 1.5, false);
  s.lineTo(hw - rb, -hd);
  s.absarc(hw - rb, -hd + rb, rb, -Math.PI / 2, 0, false);
  s.lineTo(hw - g, -hd + rb);
  s.absarc(hw - rb, -hd + rb, ri, 0, -Math.PI / 2, true);
  s.lineTo(-hw + rb, -hd + g);
  s.absarc(-hw + rb, -hd + rb, ri, Math.PI * 1.5, Math.PI, true);
  s.closePath();
  return s;
}

/**
 * Left return strip footprint.
 * Runs along left edge (x = -hw), between front and back insets.
 */
function buildLeftReturnShape(
  hw: number,
  frontStart: number,
  backStart: number,
  g: number
): THREE.Shape {
  const s = new THREE.Shape();
  // Outer: left edge
  s.moveTo(-hw, backStart);
  s.lineTo(-hw, frontStart);
  // Inner: offset inward by gauge
  s.lineTo(-hw + g, frontStart);
  s.lineTo(-hw + g, backStart);
  s.closePath();
  return s;
}

/**
 * Right return strip footprint.
 * Runs along right edge (x = hw), between front and back insets.
 */
function buildRightReturnShape(
  hw: number,
  frontStart: number,
  backStart: number,
  g: number
): THREE.Shape {
  const s = new THREE.Shape();
  // Outer: right edge
  s.moveTo(hw, backStart);
  s.lineTo(hw, frontStart);
  // Inner: offset inward by gauge
  s.lineTo(hw - g, frontStart);
  s.lineTo(hw - g, backStart);
  s.closePath();
  return s;
}

/**
 * Rectangular cutout return ring shape.
 * Outer path matches the slab hole exactly; inner path offset by gauge.
 */
function buildRectCutoutReturnShape(
  cx: number,
  cy: number,
  chw: number,
  chd: number,
  cr: number,
  g: number
): THREE.Shape {
  const s = new THREE.Shape();

  // Outer path — matches the cutout hole path exactly
  s.moveTo(cx - chw + cr, cy - chd);
  s.lineTo(cx - chw, cy - chd + cr);
  s.lineTo(cx - chw, cy + chd - cr);
  s.lineTo(cx - chw + cr, cy + chd);
  s.lineTo(cx + chw - cr, cy + chd);
  s.lineTo(cx + chw, cy + chd - cr);
  s.lineTo(cx + chw, cy - chd + cr);
  s.lineTo(cx + chw - cr, cy - chd);
  s.closePath();

  // Inner hole — offset inward by metal gauge
  const ichw = chw - g;
  const ichd = chd - g;
  const icr = Math.max(0, cr - g);

  const inner = new THREE.Path();
  if (icr < 0.0001) {
    inner.moveTo(cx - ichw, cy - ichd);
    inner.lineTo(cx - ichw, cy + ichd);
    inner.lineTo(cx + ichw, cy + ichd);
    inner.lineTo(cx + ichw, cy - ichd);
    inner.closePath();
  } else {
    inner.moveTo(cx - ichw + icr, cy - ichd);
    inner.lineTo(cx - ichw, cy - ichd + icr);
    inner.lineTo(cx - ichw, cy + ichd - icr);
    inner.lineTo(cx - ichw + icr, cy + ichd);
    inner.lineTo(cx + ichw - icr, cy + ichd);
    inner.lineTo(cx + ichw, cy + ichd - icr);
    inner.lineTo(cx + ichw, cy - ichd + icr);
    inner.lineTo(cx + ichw - icr, cy - ichd);
    inner.closePath();
  }
  s.holes.push(inner);

  return s;
}

// ── Component ───────────────────────────────────────────────────

export function WorktopModel({
  width,
  depth,
  baseMetal,
  isAged,
  config,
}: WorktopModelProps) {
  const w = width * SCALE;
  const d = depth * SCALE;
  const hw = w / 2;
  const hd = d / 2;
  const cutout = config.cutout;
  const hasCutout = cutout.enabled;

  // Corner radii: front always gets configured radius,
  // back gets 0 when upstand is enabled (square back edge against wall)
  const rMax = Math.max(
    0,
    Math.min(config.cornerRadius * SCALE, hw * 0.4, hd * 0.4)
  );
  const rf = rMax;
  const rb = config.backUpstand.enabled ? 0 : rMax;

  // ── Slab geometry (with optional cutout hole) ──
  const slabGeo = useMemo(() => {
    const shape = buildSlabShape(hw, hd, rf, rb);

    if (hasCutout) {
      const hole = new THREE.Path();
      const cx = cutout.offsetX * SCALE;
      const cy = cutout.offsetZ * SCALE;
      const chw = (cutout.width * SCALE) / 2;
      const chd =
        ((cutout.shape === "square" ? cutout.width : cutout.depth) * SCALE) / 2;

      if (cutout.shape === "oval") {
        hole.absellipse(cx, cy, chw, chd, 0, Math.PI * 2, true, 0);
      } else {
        const cr = Math.min(0.005, chw * 0.1, chd * 0.1);
        hole.moveTo(cx - chw + cr, cy - chd);
        hole.lineTo(cx - chw, cy - chd + cr);
        hole.lineTo(cx - chw, cy + chd - cr);
        hole.lineTo(cx - chw + cr, cy + chd);
        hole.lineTo(cx + chw - cr, cy + chd);
        hole.lineTo(cx + chw, cy + chd - cr);
        hole.lineTo(cx + chw, cy - chd + cr);
        hole.lineTo(cx + chw - cr, cy - chd);
        hole.closePath();
      }
      shape.holes.push(hole);
    }

    return smoothGeo(
      new THREE.ExtrudeGeometry(shape, {
        depth: SLAB_THICKNESS,
        bevelEnabled: false,
        curveSegments: 64,
      })
    );
  }, [
    hw, hd, rf, rb, hasCutout,
    cutout.offsetX, cutout.offsetZ, cutout.width, cutout.depth, cutout.shape,
  ]);

  // ── Front return geometry ──
  const frontReturnGeo = useMemo(() => {
    if (!config.frontReturn.enabled) return null;
    const shape = buildFrontReturnShape(hw, hd, rf, METAL_GAUGE);
    return smoothGeo(
      new THREE.ExtrudeGeometry(shape, {
        depth: config.frontReturn.depth * SCALE,
        bevelEnabled: false,
        curveSegments: 16,
      })
    );
  }, [hw, hd, rf, config.frontReturn.enabled, config.frontReturn.depth]);

  // ── Back upstand geometry (square back corners) ──
  const backUpstandGeo = useMemo(() => {
    if (!config.backUpstand.enabled) return null;
    const shape = buildBackEdgeShape(hw, hd, 0, METAL_GAUGE);
    return smoothGeo(
      new THREE.ExtrudeGeometry(shape, {
        depth: config.backUpstand.depth * SCALE,
        bevelEnabled: false,
        curveSegments: 16,
      })
    );
  }, [hw, hd, config.backUpstand.enabled, config.backUpstand.depth]);

  // ── Back return geometry (only when upstand is off) ──
  const backReturnGeo = useMemo(() => {
    if (!config.backReturn.enabled || config.backUpstand.enabled) return null;
    const shape = buildBackEdgeShape(hw, hd, rb, METAL_GAUGE);
    return smoothGeo(
      new THREE.ExtrudeGeometry(shape, {
        depth: config.backReturn.depth * SCALE,
        bevelEnabled: false,
        curveSegments: 16,
      })
    );
  }, [
    hw, hd, rb,
    config.backReturn.enabled, config.backReturn.depth, config.backUpstand.enabled,
  ]);

  // ── Side return dimensions (inset from front/back corners) ──
  const frontInset = config.frontReturn.enabled ? rf : 0;
  const backInset =
    config.backUpstand.enabled
      ? 0
      : config.backReturn.enabled
        ? rb
        : 0;
  // Front/back Y extents for side returns (shape Y = world Z)
  const sideFrontY = hd - frontInset;
  const sideBackY = -(hd - backInset);

  // ── Left return geometry ──
  const leftReturnGeo = useMemo(() => {
    if (!config.leftReturn.enabled) return null;
    const shape = buildLeftReturnShape(hw, sideFrontY, sideBackY, METAL_GAUGE);
    return smoothGeo(
      new THREE.ExtrudeGeometry(shape, {
        depth: config.leftReturn.depth * SCALE,
        bevelEnabled: false,
        curveSegments: 4,
      })
    );
  }, [hw, sideFrontY, sideBackY, config.leftReturn.enabled, config.leftReturn.depth]);

  // ── Right return geometry ──
  const rightReturnGeo = useMemo(() => {
    if (!config.rightReturn.enabled) return null;
    const shape = buildRightReturnShape(hw, sideFrontY, sideBackY, METAL_GAUGE);
    return smoothGeo(
      new THREE.ExtrudeGeometry(shape, {
        depth: config.rightReturn.depth * SCALE,
        bevelEnabled: false,
        curveSegments: 4,
      })
    );
  }, [hw, sideFrontY, sideBackY, config.rightReturn.enabled, config.rightReturn.depth]);

  // ── Oval cutout return geometry ──
  const ovalReturnGeo = useMemo(() => {
    if (!hasCutout || !cutout.returns.enabled || cutout.shape !== "oval")
      return null;

    const chw = (cutout.width * SCALE) / 2;
    const chd = (cutout.depth * SCALE) / 2;
    const ring = new THREE.Shape();
    ring.absellipse(0, 0, chw, chd, 0, Math.PI * 2, false, 0);
    const inner = new THREE.Path();
    inner.absellipse(
      0, 0,
      chw - METAL_GAUGE, chd - METAL_GAUGE,
      0, Math.PI * 2, true, 0
    );
    ring.holes.push(inner);

    return smoothGeo(
      new THREE.ExtrudeGeometry(ring, {
        depth: cutout.returns.depth * SCALE,
        bevelEnabled: false,
        curveSegments: 64,
      })
    );
  }, [
    hasCutout, cutout.returns.enabled, cutout.returns.depth,
    cutout.width, cutout.depth, cutout.shape,
  ]);

  // ── Rectangular cutout return geometry ──
  const rectReturnGeo = useMemo(() => {
    if (!hasCutout || !cutout.returns.enabled || cutout.shape === "oval")
      return null;

    const cx = cutout.offsetX * SCALE;
    const cy = cutout.offsetZ * SCALE;
    const chw = (cutout.width * SCALE) / 2;
    const chd =
      ((cutout.shape === "square" ? cutout.width : cutout.depth) * SCALE) / 2;
    const cr = Math.min(0.005, chw * 0.1, chd * 0.1);

    const shape = buildRectCutoutReturnShape(cx, cy, chw, chd, cr, METAL_GAUGE);
    return smoothGeo(
      new THREE.ExtrudeGeometry(shape, {
        depth: cutout.returns.depth * SCALE,
        bevelEnabled: false,
        curveSegments: 32,
      })
    );
  }, [
    hasCutout, cutout.returns.enabled, cutout.returns.depth,
    cutout.offsetX, cutout.offsetZ, cutout.width, cutout.depth, cutout.shape,
  ]);

  // ── Precomputed dimensions ──
  const buH = config.backUpstand.depth * SCALE;
  const cxs = cutout.offsetX * SCALE;
  const czs = cutout.offsetZ * SCALE;

  return (
    <group>
      {/* ── Main slab ──────────────────────────────── */}
      <mesh
        geometry={slabGeo}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, SLAB_THICKNESS / 2, 0]}
      >
        <MetalMaterial baseMetal={baseMetal} isAged={isAged} />
      </mesh>

      {/* ── Front return ───────────────────────────── */}
      {frontReturnGeo && (
        <mesh
          geometry={frontReturnGeo}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, -SLAB_THICKNESS / 2, 0]}
        >
          <MetalMaterial baseMetal={baseMetal} isAged={isAged} />
        </mesh>
      )}

      {/* ── Back upstand ───────────────────────────── */}
      {backUpstandGeo && (
        <mesh
          geometry={backUpstandGeo}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, SLAB_THICKNESS / 2 + buH, 0]}
        >
          <MetalMaterial baseMetal={baseMetal} isAged={isAged} />
        </mesh>
      )}

      {/* ── Back return (only when upstand is off) ── */}
      {backReturnGeo && (
        <mesh
          geometry={backReturnGeo}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, -SLAB_THICKNESS / 2, 0]}
        >
          <MetalMaterial baseMetal={baseMetal} isAged={isAged} />
        </mesh>
      )}

      {/* ── Left return ────────────────────────────── */}
      {leftReturnGeo && (
        <mesh
          geometry={leftReturnGeo}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, -SLAB_THICKNESS / 2, 0]}
        >
          <MetalMaterial baseMetal={baseMetal} isAged={isAged} />
        </mesh>
      )}

      {/* ── Right return ───────────────────────────── */}
      {rightReturnGeo && (
        <mesh
          geometry={rightReturnGeo}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, -SLAB_THICKNESS / 2, 0]}
        >
          <MetalMaterial baseMetal={baseMetal} isAged={isAged} />
        </mesh>
      )}

      {/* ── Oval cutout returns ────────────────────── */}
      {hasCutout && cutout.returns.enabled && cutout.shape === "oval" && ovalReturnGeo && (
        <mesh
          geometry={ovalReturnGeo}
          rotation={[Math.PI / 2, 0, 0]}
          position={[cxs, -SLAB_THICKNESS / 2, czs]}
        >
          <MetalMaterial baseMetal={baseMetal} isAged={isAged} doubleSide />
        </mesh>
      )}

      {/* ── Rectangular cutout returns ─────────────── */}
      {hasCutout && cutout.returns.enabled && cutout.shape !== "oval" && rectReturnGeo && (
        <mesh
          geometry={rectReturnGeo}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, -SLAB_THICKNESS / 2, 0]}
        >
          <MetalMaterial baseMetal={baseMetal} isAged={isAged} doubleSide />
        </mesh>
      )}
    </group>
  );
}
