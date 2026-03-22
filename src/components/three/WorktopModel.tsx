"use client";

import { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  mergeVertices,
  toCreasedNormals,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MetalMaterial } from "./MetalMaterial";
import { useConfiguratorStore } from "@/stores/configurator";
import type { MetalType, WorktopConfig, CutoutConfig } from "@/types";

interface WorktopModelProps {
  width: number;
  depth: number;
  thickness: number;
  baseMetal: MetalType;
  isAged: boolean;
  config: WorktopConfig;
}

const SCALE = 0.01;
const CREASE_ANGLE = Math.PI / 3;

function smoothGeo(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  return toCreasedNormals(mergeVertices(geo), CREASE_ANGLE);
}

// ── Shape builders ──────────────────────────────────────────────

/**
 * Rounded-rectangle slab outline with independent front/back corner radii.
 */
function buildSlabShape(
  hw: number,
  hd: number,
  rf: number,
  rb: number
): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-hw + (rb > 0.0001 ? rb : 0), -hd);

  if (rb > 0.0001) {
    shape.lineTo(hw - rb, -hd);
    shape.absarc(hw - rb, -hd + rb, rb, -Math.PI / 2, 0, false);
  } else {
    shape.lineTo(hw, -hd);
  }

  if (rf > 0.0001) {
    shape.lineTo(hw, hd - rf);
    shape.absarc(hw - rf, hd - rf, rf, 0, Math.PI / 2, false);
  } else {
    shape.lineTo(hw, hd);
  }

  if (rf > 0.0001) {
    shape.lineTo(-hw + rf, hd);
    shape.absarc(-hw + rf, hd - rf, rf, Math.PI / 2, Math.PI, false);
  } else {
    shape.lineTo(-hw, hd);
  }

  if (rb > 0.0001) {
    shape.lineTo(-hw, -hd + rb);
    shape.absarc(-hw + rb, -hd + rb, rb, Math.PI, Math.PI * 1.5, false);
  } else {
    shape.lineTo(-hw, -hd);
  }

  return shape;
}

/**
 * Simple rectangle shape centered at origin. Used for returns/upstand segments.
 * Using scene-unit coordinates so ExtrudeGeometry UVs match MetalMaterial repeat.
 */
function buildRectShape(w: number, h: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -h / 2);
  s.lineTo(w / 2, -h / 2);
  s.lineTo(w / 2, h / 2);
  s.lineTo(-w / 2, h / 2);
  s.closePath();
  return s;
}

/**
 * Quarter-annulus shape for worktop corner pieces.
 * Creates a curved strip of sheet metal (thickness = gauge) following a quarter-circle arc.
 */
function buildCornerPieceShape(
  r: number,
  gauge: number,
  startAngle: number,
  endAngle: number
): THREE.Shape {
  const s = new THREE.Shape();
  const ir = Math.max(0.0001, r - gauge);
  // Outer arc (CCW)
  s.absarc(0, 0, r, startAngle, endAngle, false);
  // Inner arc (reversed / CW) back to start
  s.absarc(0, 0, ir, endAngle, startAngle, true);
  s.closePath();
  return s;
}

/**
 * Rectangular cutout return ring shape (welded-on ring around cutout hole).
 * Uses proper absarc corner arcs for dimensionally accurate rounded corners.
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

  // Outer rounded rectangle (CCW winding)
  if (cr > 0.0001) {
    s.moveTo(cx - chw + cr, cy - chd);
    s.lineTo(cx + chw - cr, cy - chd);
    s.absarc(cx + chw - cr, cy - chd + cr, cr, -Math.PI / 2, 0, false);
    s.lineTo(cx + chw, cy + chd - cr);
    s.absarc(cx + chw - cr, cy + chd - cr, cr, 0, Math.PI / 2, false);
    s.lineTo(cx - chw + cr, cy + chd);
    s.absarc(cx - chw + cr, cy + chd - cr, cr, Math.PI / 2, Math.PI, false);
    s.lineTo(cx - chw, cy - chd + cr);
    s.absarc(cx - chw + cr, cy - chd + cr, cr, Math.PI, Math.PI * 1.5, false);
  } else {
    s.moveTo(cx - chw, cy - chd);
    s.lineTo(cx + chw, cy - chd);
    s.lineTo(cx + chw, cy + chd);
    s.lineTo(cx - chw, cy + chd);
  }
  s.closePath();

  // Inner rounded rectangle (hole — offset inward by gauge)
  const ichw = chw - g;
  const ichd = chd - g;
  const icr = Math.max(0, cr - g);

  const inner = new THREE.Path();
  if (icr > 0.0001) {
    inner.moveTo(cx - ichw + icr, cy - ichd);
    inner.lineTo(cx + ichw - icr, cy - ichd);
    inner.absarc(cx + ichw - icr, cy - ichd + icr, icr, -Math.PI / 2, 0, false);
    inner.lineTo(cx + ichw, cy + ichd - icr);
    inner.absarc(cx + ichw - icr, cy + ichd - icr, icr, 0, Math.PI / 2, false);
    inner.lineTo(cx - ichw + icr, cy + ichd);
    inner.absarc(cx - ichw + icr, cy + ichd - icr, icr, Math.PI / 2, Math.PI, false);
    inner.lineTo(cx - ichw, cy - ichd + icr);
    inner.absarc(cx - ichw + icr, cy - ichd + icr, icr, Math.PI, Math.PI * 1.5, false);
  } else {
    inner.moveTo(cx - ichw, cy - ichd);
    inner.lineTo(cx + ichw, cy - ichd);
    inner.lineTo(cx + ichw, cy + ichd);
    inner.lineTo(cx - ichw, cy + ichd);
  }
  inner.closePath();

  s.holes.push(inner);
  return s;
}

// ── Cutout return flat strips (separate cut pieces, scale-animated) ──

function CutoutStrips({
  cutout,
  gauge,
  hd,
  baseMetal,
  isAged,
  config,
  foldRef,
  cutoutCR,
}: {
  cutout: CutoutConfig;
  gauge: number;
  hd: number;
  baseMetal: MetalType;
  isAged: boolean;
  config: WorktopConfig;
  foldRef: React.MutableRefObject<number>;
  cutoutCR: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const strips = useMemo(() => {
    const hasCutoutEdge = cutout.returns.enabled || cutout.lip.enabled;
    if (!hasCutoutEdge) return [];
    const returnD = (cutout.returns.enabled ? cutout.returns.depth : cutout.lip.depth) * SCALE;
    const frontEdge =
      hd + (config.frontReturn.enabled ? config.frontReturn.depth * SCALE : 0);
    const startZ = frontEdge + 0.4; // 40mm gap below front edge
    const stripGap = 0.15;

    const result: Array<{
      id: string;
      w: number;
      h: number;
      x: number;
      z: number;
    }> = [];

    let z = startZ;

    if (cutout.shape === "oval") {
      // Ramanujan circumference approximation
      const a = cutout.width / 2;
      const b = cutout.depth / 2;
      const hP = ((a - b) ** 2) / ((a + b) ** 2);
      const circ =
        Math.PI * (a + b) * (1 + (3 * hP) / (10 + Math.sqrt(4 - 3 * hP)));
      const MAX_STRIP = 2000;
      const n = Math.ceil(circ / MAX_STRIP);
      const stripWmm = circ / n;

      for (let i = 0; i < n; i++) {
        result.push({
          id: `oval-${i}`,
          w: stripWmm * SCALE,
          h: returnD,
          x: 0,
          z: z + returnD / 2,
        });
        z += returnD + stripGap;
      }
    } else {
      // Rectangle / square → 4 side strips + 4 corner strips
      const cw = cutout.width * SCALE;
      const cd =
        (cutout.shape === "square" ? cutout.width : cutout.depth) * SCALE;

      // Side strips shortened by corner radius at each end
      const cwShort = cw - 2 * cutoutCR;
      const cdShort = cd - 2 * cutoutCR;
      const cornerArcLen = cutoutCR > 0.001 ? (Math.PI * cutoutCR) / 2 : 0;

      // Each side strip gets its corner arc piece placed alongside (right)
      const sides: Array<{ id: string; sw: number; cornerId: string }> = [
        { id: "cut-top", sw: cwShort, cornerId: "corner-tl" },
        { id: "cut-bottom", sw: cwShort, cornerId: "corner-tr" },
        { id: "cut-left", sw: cdShort, cornerId: "corner-bl" },
        { id: "cut-right", sw: cdShort, cornerId: "corner-br" },
      ];

      for (const { id, sw, cornerId } of sides) {
        const rowZ = z + returnD / 2;
        result.push({ id, w: sw, h: returnD, x: 0, z: rowZ });

        // Place corner arc piece alongside, to the right of the side strip
        if (cornerArcLen > 0.001) {
          result.push({
            id: cornerId,
            w: cornerArcLen,
            h: returnD,
            x: sw / 2 + stripGap + cornerArcLen / 2,
            z: rowZ,
          });
        }

        z += returnD + stripGap;
      }
    }

    return result;
  }, [cutout, hd, config, cutoutCR]);

  // Build geometries
  const geos = useMemo(
    () =>
      strips.map((s) => {
        const shape = buildRectShape(s.w, s.h);
        return smoothGeo(
          new THREE.ExtrudeGeometry(shape, {
            depth: gauge,
            bevelEnabled: false,
          })
        );
      }),
    [strips, gauge]
  );

  // Arc path: strips travel from cutout area, curve below slab, land at final position
  const arcPath = useMemo(() => {
    const cxs = cutout.offsetX * SCALE;
    const czs = cutout.offsetZ * SCALE;
    // Average Z of all strip positions (their final destination)
    const stripsCenterZ =
      strips.length > 0
        ? strips.reduce((sum, s) => sum + s.z, 0) / strips.length
        : hd + 0.5;

    // P0: offset that moves strips from final position to cutout area (3D state)
    const P0 = new THREE.Vector3(cxs, 0, czs - stripsCenterZ);
    // P2: no offset — strips at their correct flat-view position
    const P2 = new THREE.Vector3(0, 0, 0);
    // P1: control point — halfway between, dipping below slab for the arc
    const arcDip = Math.max(0.8, Math.abs(czs - stripsCenterZ) * 0.4);
    const P1 = new THREE.Vector3(cxs * 0.5, -arcDip, (czs - stripsCenterZ) * 0.5);

    return { P0, P1, P2 };
  }, [cutout.offsetX, cutout.offsetZ, hd, strips]);

  // Animate: scale + position along quadratic Bézier arc
  useFrame(() => {
    if (!groupRef.current) return;
    const fold = foldRef.current;
    const t = 1 - fold; // 0 = 3D (hidden at cutout), 1 = flat (at final position)
    const s = Math.max(0.001, t);
    groupRef.current.scale.set(s, s, s);
    groupRef.current.visible = t > 0.005;

    // Quadratic Bézier: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
    const { P0, P1, P2 } = arcPath;
    const mt = 1 - t;
    groupRef.current.position.set(
      mt * mt * P0.x + 2 * mt * t * P1.x + t * t * P2.x,
      mt * mt * P0.y + 2 * mt * t * P1.y + t * t * P2.y,
      mt * mt * P0.z + 2 * mt * t * P1.z + t * t * P2.z
    );
  });

  if (strips.length === 0) return null;

  return (
    <group ref={groupRef}>
      {strips.map((strip, i) => (
        <mesh
          key={strip.id}
          geometry={geos[i]}
          rotation={[Math.PI / 2, 0, 0]}
          position={[strip.x, gauge / 2, strip.z]}
        >
          <MetalMaterial baseMetal={baseMetal} isAged={isAged} />
        </mesh>
      ))}
    </group>
  );
}

// ── Bend-line annotations (dashed lines + soft glow on flat view) ──

interface AnnotationLine {
  id: string;
  points: THREE.Vector3[];
  direction: "up" | "down";
  mid: [number, number, number];
  planeW: number;
  planeH: number;
}

const GLOW_WIDTH = 0.06; // ~6mm glow spread each side

function BendLineAnnotations({
  hw,
  hd,
  gauge,
  config,
  foldRef,
}: {
  hw: number;
  hd: number;
  gauge: number;
  config: WorktopConfig;
  foldRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const lines = useMemo(() => {
    const result: AnnotationLine[] = [];
    const y = gauge / 2 + 0.002;

    if (config.frontReturn.enabled) {
      result.push({
        id: "front",
        points: [new THREE.Vector3(-hw, y, hd), new THREE.Vector3(hw, y, hd)],
        direction: "down",
        mid: [0, y - 0.001, hd],
        planeW: 2 * hw,
        planeH: GLOW_WIDTH,
      });
    }
    if (config.backUpstand.enabled || config.backReturn.enabled) {
      result.push({
        id: "back",
        points: [new THREE.Vector3(-hw, y, -hd), new THREE.Vector3(hw, y, -hd)],
        direction: config.backUpstand.enabled ? "up" : "down",
        mid: [0, y - 0.001, -hd],
        planeW: 2 * hw,
        planeH: GLOW_WIDTH,
      });
    }
    if (config.leftReturn.enabled) {
      result.push({
        id: "left",
        points: [new THREE.Vector3(-hw, y, -hd), new THREE.Vector3(-hw, y, hd)],
        direction: "down",
        mid: [-hw, y - 0.001, 0],
        planeW: GLOW_WIDTH,
        planeH: 2 * hd,
      });
    }
    if (config.rightReturn.enabled) {
      result.push({
        id: "right",
        points: [new THREE.Vector3(hw, y, -hd), new THREE.Vector3(hw, y, hd)],
        direction: "down",
        mid: [hw, y - 0.001, 0],
        planeW: GLOW_WIDTH,
        planeH: 2 * hd,
      });
    }
    return result;
  }, [hw, hd, gauge, config]);

  // Pre-build line objects so they aren't recreated each render
  const lineObjects = useMemo(
    () =>
      lines.map((line) => {
        const geo = new THREE.BufferGeometry().setFromPoints(line.points);
        const color = line.direction === "up" ? 0x4488cc : 0xcc6644;
        const mat = new THREE.LineDashedMaterial({
          color,
          dashSize: 0.08,
          gapSize: 0.06,
          opacity: 0.5,
          transparent: true,
        });
        const l = new THREE.Line(geo, mat);
        l.computeLineDistances();
        return l;
      }),
    [lines]
  );

  // Fade in when flat, fade out when folded
  useFrame(() => {
    if (!groupRef.current) return;
    const opacity = 1 - foldRef.current;
    groupRef.current.visible = opacity > 0.01;
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Line) {
        (child.material as THREE.LineDashedMaterial).opacity = opacity * 0.5;
      } else if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshBasicMaterial;
        if (mat.blending === THREE.AdditiveBlending) {
          mat.opacity = opacity * 0.18;
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      {lines.map((line, i) => {
        const color = line.direction === "up" ? 0x4488cc : 0xcc6644;
        return (
          <group key={line.id}>
            <primitive object={lineObjects[i]} />
            {/* Soft glow plane behind the dashed line */}
            <mesh position={line.mid} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[line.planeW, line.planeH]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.18}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ── Draggable split / cut-line (visible when sheet exceeds panel limit) ──

interface SplitMeta {
  points: THREE.Vector3[];
  mid: [number, number, number];
  planeW: number;
  planeH: number;
  hitW: number;
  hitH: number;
  isVertical: boolean;
  dir: "vertical" | "horizontal";
  total: number;
  offsetD: number;
  minPos: number;
  maxPos: number;
}

function DraggableSplitLine({
  hw,
  hd,
  gauge,
  width,
  depth,
  config,
}: {
  hw: number;
  hd: number;
  gauge: number;
  width: number;
  depth: number;
  config: WorktopConfig;
}) {
  const setWorktopConfig = useConfiguratorStore((s) => s.setWorktopConfig);
  const { camera, gl, controls } = useThree();
  const isDragging = useRef(false);

  const splitMeta = useMemo((): SplitMeta | null => {
    const hasLeft = config.leftReturn.enabled;
    const hasRight = config.rightReturn.enabled;
    const hasFront = config.frontReturn.enabled;
    const hasBack = config.backUpstand.enabled || config.backReturn.enabled;

    const leftD = hasLeft ? config.leftReturn.depth : 0;
    const rightD = hasRight ? config.rightReturn.depth : 0;
    const frontD = hasFront ? config.frontReturn.depth : 0;
    const backD = config.backUpstand.enabled
      ? config.backUpstand.depth
      : config.backReturn.enabled
        ? config.backReturn.depth
        : 0;

    const BA = 5;
    const bendW = (hasLeft ? 1 : 0) + (hasRight ? 1 : 0);
    const bendH = (hasFront ? 1 : 0) + (hasBack ? 1 : 0);
    const totalW = leftD + width + rightD - bendW * BA;
    const totalH = frontD + depth + backD - bendH * BA;

    if (totalW <= 2000 && totalH <= 1000) return null;

    const dir = config.splitDirection ?? (totalW > 2000 ? "vertical" : "horizontal");
    const maxSheet = dir === "vertical" ? 2000 : 1000;
    const total = dir === "vertical" ? totalW : totalH;
    const offsetD = dir === "vertical" ? leftD : backD;
    const pos =
      config.splitPosition ?? Math.round(total / 2);

    // Clamp so each resulting panel ≤ max sheet size and ≥ 200mm
    const minPos = Math.max(200, total - maxSheet);
    const maxPos = Math.min(total - 200, maxSheet);
    const clamped = Math.max(minPos, Math.min(maxPos, pos));

    const y = gauge / 2 + 0.003;

    if (dir === "vertical") {
      const localX = clamped - leftD;
      if (localX < 0 || localX > width) return null;
      const sx = localX * SCALE - hw;
      return {
        points: [new THREE.Vector3(sx, y, -hd), new THREE.Vector3(sx, y, hd)],
        mid: [sx, y - 0.001, 0] as [number, number, number],
        planeW: GLOW_WIDTH,
        planeH: 2 * hd,
        hitW: 0.3,
        hitH: 2 * hd + 0.2,
        isVertical: true,
        dir,
        total,
        offsetD,
        minPos,
        maxPos,
      };
    } else {
      const localY = clamped - backD;
      if (localY < 0 || localY > depth) return null;
      const sz = localY * SCALE - hd;
      return {
        points: [new THREE.Vector3(-hw, y, sz), new THREE.Vector3(hw, y, sz)],
        mid: [0, y - 0.001, sz] as [number, number, number],
        planeW: 2 * hw,
        planeH: GLOW_WIDTH,
        hitW: 2 * hw + 0.2,
        hitH: 0.3,
        isVertical: false,
        dir,
        total,
        offsetD,
        minPos,
        maxPos,
      };
    }
  }, [hw, hd, gauge, width, depth, config]);

  // Horizontal plane at slab surface for raycasting during drag
  const dragPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), -(gauge / 2 + 0.003)),
    [gauge]
  );

  const handlePointerDown = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      if (!splitMeta) return;
      e.stopPropagation();
      isDragging.current = true;
      // Disable orbit controls so camera doesn't move while dragging
      if (controls && "enabled" in controls) {
        (controls as { enabled: boolean }).enabled = false;
      }
      gl.domElement.style.cursor = splitMeta.isVertical
        ? "col-resize"
        : "row-resize";

      const rc = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const hit = new THREE.Vector3();

      const onMove = (ev: PointerEvent) => {
        const rect = gl.domElement.getBoundingClientRect();
        mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
        rc.setFromCamera(mouse, camera);

        if (rc.ray.intersectPlane(dragPlane, hit)) {
          const latest = useConfiguratorStore.getState().worktopConfig;
          if (splitMeta.isVertical) {
            const localX = (hit.x + hw) / SCALE;
            const splitPos = Math.round(localX + splitMeta.offsetD);
            const clamped = Math.max(
              splitMeta.minPos,
              Math.min(splitMeta.maxPos, splitPos)
            );
            setWorktopConfig({
              ...latest,
              splitPosition: clamped,
              splitDirection: "vertical",
            });
          } else {
            const localY = (hit.z + hd) / SCALE;
            const splitPos = Math.round(localY + splitMeta.offsetD);
            const clamped = Math.max(
              splitMeta.minPos,
              Math.min(splitMeta.maxPos, splitPos)
            );
            setWorktopConfig({
              ...latest,
              splitPosition: clamped,
              splitDirection: "horizontal",
            });
          }
        }
      };

      const onUp = () => {
        isDragging.current = false;
        // Re-enable orbit controls
        if (controls && "enabled" in controls) {
          (controls as { enabled: boolean }).enabled = true;
        }
        gl.domElement.style.cursor = "";
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [splitMeta, camera, gl, controls, dragPlane, hw, hd, setWorktopConfig]
  );

  const lineObj = useMemo(() => {
    if (!splitMeta) return null;
    const geo = new THREE.BufferGeometry().setFromPoints(splitMeta.points);
    const mat = new THREE.LineDashedMaterial({
      color: 0xb8860b,
      dashSize: 0.12,
      gapSize: 0.04,
      opacity: 0.7,
      transparent: true,
    });
    const l = new THREE.Line(geo, mat);
    l.computeLineDistances();
    return l;
  }, [splitMeta]);

  if (!splitMeta || !lineObj) return null;

  return (
    <group>
      <primitive object={lineObj} />
      {/* Amber glow */}
      <mesh position={splitMeta.mid} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[splitMeta.planeW, splitMeta.planeH]} />
        <meshBasicMaterial
          color={0xb8860b}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Invisible hit area for drag interaction */}
      <mesh
        position={splitMeta.mid}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerEnter={() => {
          if (!isDragging.current)
            gl.domElement.style.cursor = splitMeta.isVertical
              ? "col-resize"
              : "row-resize";
        }}
        onPointerLeave={() => {
          if (!isDragging.current) gl.domElement.style.cursor = "";
        }}
      >
        <planeGeometry args={[splitMeta.hitW, splitMeta.hitH]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ── Component ───────────────────────────────────────────────────

export function WorktopModel({
  width,
  depth,
  thickness,
  baseMetal,
  isAged,
  config,
}: WorktopModelProps) {
  const viewMode = useConfiguratorStore((s) => s.viewMode);
  const w = width * SCALE;
  const d = depth * SCALE;
  const hw = w / 2;
  const hd = d / 2;
  const gauge = thickness * SCALE;
  const cutout = config.cutout;
  const hasCutout = cutout.enabled;

  // Pre-compute cutout dimensions (needed for slab hole, return/lip ring, and flat strips)
  const cxs = cutout.offsetX * SCALE;
  const czs = cutout.offsetZ * SCALE;
  const hasCutoutEdge = cutout.returns.enabled || cutout.lip.enabled;
  const cutoutGoesUp = cutout.lip.enabled;
  const cutEdgeDepthMm = cutout.returns.enabled ? cutout.returns.depth : cutout.lip.depth;
  const cutReturnDepthScaled = cutEdgeDepthMm * SCALE;
  const chwScaled = (cutout.width * SCALE) / 2;
  const chdScaled =
    ((cutout.shape === "square" ? cutout.width : cutout.depth) * SCALE) / 2;
  // Visible corner radius for rectangular cutouts — user-controlled via slider
  const cutoutCR =
    hasCutout && cutout.shape !== "oval"
      ? Math.min(cutout.cornerRadius * SCALE, chwScaled * 0.45, chdScaled * 0.45)
      : 0;

  // ── Fold animation ──
  // foldRef: 0 = flat, 1 = folded (3D)
  // Default positions are FLAT. Fold rotation creates the 3D state.
  const foldRef = useRef(1);
  const targetFold = viewMode === "flat" ? 0 : 1;
  const frontPivotRef = useRef<THREE.Group>(null);
  const backPivotRef = useRef<THREE.Group>(null);
  const leftPivotRef = useRef<THREE.Group>(null);
  const rightPivotRef = useRef<THREE.Group>(null);
  // Cutout return ring — Y-scale animation (shrinks to 0 when flat)
  const cutoutRingWrapperRef = useRef<THREE.Group>(null);
  // Worktop corner pieces — crossfade animation
  const cornerPiece3DRef = useRef<THREE.Group>(null);
  const cornerStripRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const speed = 2.5;
    foldRef.current = THREE.MathUtils.lerp(
      foldRef.current,
      targetFold,
      1 - Math.exp(-speed * delta)
    );

    const fold = foldRef.current;

    // Front return: flat = in +Z plane, folded = hangs down (-Y)
    // Rotating around X at front edge: +PI/2 maps +Z → -Y
    if (frontPivotRef.current) {
      frontPivotRef.current.rotation.x = fold * Math.PI / 2;
    }

    // Back upstand: flat = in -Z plane, folded = stands up (+Y)
    // Rotating around X at back edge: -PI/2 maps -Z → +Y
    // Back return: flat = in -Z plane, folded = hangs down (-Y)
    // Rotating around X at back edge: +PI/2 maps -Z → ... wait
    if (backPivotRef.current) {
      const isUpstand = config.backUpstand.enabled;
      // For upstand: fold UP → rotation.x = -fold * PI/2
      //   Mesh at (0, 0, -backD/2), rotate -PI/2: Z'→Y, so -backD/2 → -backD/2... no
      //   Let me use the math: rotation around X by θ:
      //     Y' = Y*cos(θ) - Z*sin(θ)
      //     Z' = Y*sin(θ) + Z*cos(θ)
      //   Point (0, 0, -backD/2), θ = -PI/2:
      //     Y' = 0 - (-backD/2)*(-1) = -backD/2  → goes DOWN, wrong!
      //   Point (0, 0, -backD/2), θ = PI/2:
      //     Y' = 0 - (-backD/2)*(1) = backD/2  → goes UP, correct!
      // For return (down): θ = -PI/2: Y' = -backD/2 → goes DOWN, correct!
      backPivotRef.current.rotation.x = fold * Math.PI / 2 * (isUpstand ? 1 : -1);
    }

    // Left return: flat = extends in -X, folded = hangs down (-Y)
    if (leftPivotRef.current) {
      leftPivotRef.current.rotation.z = fold * Math.PI / 2;
    }

    // Right return: flat = extends in +X, folded = hangs down (-Y)
    if (rightPivotRef.current) {
      rightPivotRef.current.rotation.z = -fold * Math.PI / 2;
    }

    // ── Cutout return/lip ring — shrinks to 0 when going flat ──
    // (both oval and rectangular use the same Y-scale crossfade)
    if (cutoutRingWrapperRef.current) {
      cutoutRingWrapperRef.current.scale.y = Math.max(0.001, fold);
      cutoutRingWrapperRef.current.visible = fold > 0.005;
    }

    // ── Worktop corner pieces — 3D pieces shrink when flat ──
    if (cornerPiece3DRef.current) {
      cornerPiece3DRef.current.scale.y = Math.max(0.001, fold);
      cornerPiece3DRef.current.visible = fold > 0.005;
    }
    // ── Corner flat strips — scale each mesh individually at its own center ──
    if (cornerStripRef.current) {
      const t = 1 - fold;
      const s = Math.max(0.001, t);
      cornerStripRef.current.visible = t > 0.005;
      for (const child of cornerStripRef.current.children) {
        child.scale.set(s, s, s);
      }
    }
  });

  // Corner radii
  const rMax = Math.max(
    0,
    Math.min(config.cornerRadius * SCALE, hw * 0.4, hd * 0.4)
  );
  const rf = rMax;
  const rb = config.backUpstand.enabled ? 0 : rMax;

  // ── Main slab geometry (with optional cutout hole) ──
  const slabGeo = useMemo(() => {
    const shape = buildSlabShape(hw, hd, rf, rb);

    if (hasCutout) {
      const hole = new THREE.Path();

      if (cutout.shape === "oval") {
        hole.absellipse(cxs, czs, chwScaled, chdScaled, 0, Math.PI * 2, true, 0);
      } else if (cutoutCR > 0.0001) {
        hole.moveTo(cxs - chwScaled + cutoutCR, czs - chdScaled);
        hole.lineTo(cxs + chwScaled - cutoutCR, czs - chdScaled);
        hole.absarc(cxs + chwScaled - cutoutCR, czs - chdScaled + cutoutCR, cutoutCR, -Math.PI / 2, 0, false);
        hole.lineTo(cxs + chwScaled, czs + chdScaled - cutoutCR);
        hole.absarc(cxs + chwScaled - cutoutCR, czs + chdScaled - cutoutCR, cutoutCR, 0, Math.PI / 2, false);
        hole.lineTo(cxs - chwScaled + cutoutCR, czs + chdScaled);
        hole.absarc(cxs - chwScaled + cutoutCR, czs + chdScaled - cutoutCR, cutoutCR, Math.PI / 2, Math.PI, false);
        hole.lineTo(cxs - chwScaled, czs - chdScaled + cutoutCR);
        hole.absarc(cxs - chwScaled + cutoutCR, czs - chdScaled + cutoutCR, cutoutCR, Math.PI, Math.PI * 1.5, false);
      } else {
        hole.moveTo(cxs - chwScaled, czs - chdScaled);
        hole.lineTo(cxs + chwScaled, czs - chdScaled);
        hole.lineTo(cxs + chwScaled, czs + chdScaled);
        hole.lineTo(cxs - chwScaled, czs + chdScaled);
      }
      hole.closePath();
      shape.holes.push(hole);
    }

    return smoothGeo(
      new THREE.ExtrudeGeometry(shape, {
        depth: gauge,
        bevelEnabled: false,
        curveSegments: 64,
      })
    );
  }, [
    hw, hd, rf, rb, gauge, hasCutout,
    cxs, czs, chwScaled, chdScaled, cutoutCR, cutout.shape,
  ]);

  // ── Return/upstand geometries — shortened by corner radii ──

  const hasFrontEdge = config.frontReturn.enabled;
  const frontReturnDepthScaled = config.frontReturn.depth * SCALE;
  const shortFrontW = rf > 0.0001 ? w - 2 * rf : w;
  const frontReturnGeo = useMemo(() => {
    if (!hasFrontEdge) return null;
    const shape = buildRectShape(shortFrontW, frontReturnDepthScaled);
    return smoothGeo(
      new THREE.ExtrudeGeometry(shape, { depth: gauge, bevelEnabled: false })
    );
  }, [shortFrontW, gauge, frontReturnDepthScaled, hasFrontEdge]);

  const isBackUpstand = config.backUpstand.enabled;
  const isBackReturn = config.backReturn.enabled && !isBackUpstand;
  const backDepthScaled = isBackUpstand
    ? config.backUpstand.depth * SCALE
    : isBackReturn
      ? config.backReturn.depth * SCALE
      : 0;
  const shortBackW = rb > 0.0001 ? w - 2 * rb : w;
  const backGeo = useMemo(() => {
    if (!isBackUpstand && !isBackReturn) return null;
    const shape = buildRectShape(shortBackW, backDepthScaled);
    return smoothGeo(
      new THREE.ExtrudeGeometry(shape, { depth: gauge, bevelEnabled: false })
    );
  }, [shortBackW, gauge, backDepthScaled, isBackUpstand, isBackReturn]);

  const hasLeftEdge = config.leftReturn.enabled;
  const leftDepthScaled = config.leftReturn.depth * SCALE;
  const shortSideD = d - rf - rb;
  const sideReturnOffsetZ = (rb - rf) / 2;
  const leftReturnGeo = useMemo(() => {
    if (!hasLeftEdge) return null;
    const usedD = shortSideD > 0.001 ? shortSideD : d;
    const shape = buildRectShape(leftDepthScaled, usedD);
    return smoothGeo(
      new THREE.ExtrudeGeometry(shape, { depth: gauge, bevelEnabled: false })
    );
  }, [shortSideD, d, gauge, leftDepthScaled, hasLeftEdge]);

  const hasRightEdge = config.rightReturn.enabled;
  const rightDepthScaled = config.rightReturn.depth * SCALE;
  const rightReturnGeo = useMemo(() => {
    if (!hasRightEdge) return null;
    const usedD = shortSideD > 0.001 ? shortSideD : d;
    const shape = buildRectShape(rightDepthScaled, usedD);
    return smoothGeo(
      new THREE.ExtrudeGeometry(shape, { depth: gauge, bevelEnabled: false })
    );
  }, [shortSideD, d, gauge, rightDepthScaled, hasRightEdge]);

  // ── Worktop corner pieces (quarter-annulus, crossfade animated) ──

  interface CornerPieceDef {
    id: string;
    cx: number;
    cz: number;
    r: number;
    startAngle: number;
    endAngle: number;
    returnDepth: number;
    flatX: number;
    flatZ: number;
    flatRotY: number;
  }

  const cornerPieces = useMemo((): CornerPieceDef[] => {
    const pieces: CornerPieceDef[] = [];
    const hasFront = config.frontReturn.enabled;
    const hasBack = isBackUpstand || isBackReturn;
    const hasLeft = config.leftReturn.enabled;
    const hasRight = config.rightReturn.enabled;
    const fD = frontReturnDepthScaled;
    const bD = backDepthScaled;
    const lD = leftDepthScaled;
    const rD = rightDepthScaled;
    // Anchor flat strips from the OUTER side: outermost vertices align
    // with the returns' outer edges. As corner radius grows the strip
    // expands inward toward the slab, scaling naturally.
    // Formula: flatCoord = ±(hw + retD − hDiag − PAD)
    const PAD = 0.04;   // visual gap between strip and return outer edges

    // Front-right
    if (rf > 0.0001 && hasFront && hasRight) {
      const retD = Math.min(fD, rD);
      const arcL = Math.PI * rf / 2;
      const hDiag = Math.SQRT1_2 * (arcL + retD) / 2;
      pieces.push({
        id: "fr", cx: hw - rf, cz: hd - rf, r: rf,
        startAngle: 0, endAngle: Math.PI / 2,
        returnDepth: retD,
        flatX: hw + retD - hDiag - PAD, flatZ: hd + retD - hDiag - PAD,
        flatRotY: Math.PI / 4,
      });
    }
    // Front-left
    if (rf > 0.0001 && hasFront && hasLeft) {
      const retD = Math.min(fD, lD);
      const arcL = Math.PI * rf / 2;
      const hDiag = Math.SQRT1_2 * (arcL + retD) / 2;
      pieces.push({
        id: "fl", cx: -hw + rf, cz: hd - rf, r: rf,
        startAngle: Math.PI / 2, endAngle: Math.PI,
        returnDepth: retD,
        flatX: -(hw + retD - hDiag - PAD), flatZ: hd + retD - hDiag - PAD,
        flatRotY: -Math.PI / 4,
      });
    }
    // Back-right
    if (rb > 0.0001 && hasBack && hasRight) {
      const retD = Math.min(bD, rD);
      const arcL = Math.PI * rb / 2;
      const hDiag = Math.SQRT1_2 * (arcL + retD) / 2;
      pieces.push({
        id: "br", cx: hw - rb, cz: -hd + rb, r: rb,
        startAngle: -Math.PI / 2, endAngle: 0,
        returnDepth: retD,
        flatX: hw + retD - hDiag - PAD, flatZ: -(hd + retD - hDiag - PAD),
        flatRotY: -Math.PI / 4,
      });
    }
    // Back-left
    if (rb > 0.0001 && hasBack && hasLeft) {
      const retD = Math.min(bD, lD);
      const arcL = Math.PI * rb / 2;
      const hDiag = Math.SQRT1_2 * (arcL + retD) / 2;
      pieces.push({
        id: "bl", cx: -hw + rb, cz: -hd + rb, r: rb,
        startAngle: Math.PI, endAngle: Math.PI * 1.5,
        returnDepth: retD,
        flatX: -(hw + retD - hDiag - PAD), flatZ: -(hd + retD - hDiag - PAD),
        flatRotY: Math.PI / 4,
      });
    }

    return pieces;
  }, [hw, hd, rf, rb, config, isBackUpstand, isBackReturn,
      frontReturnDepthScaled, backDepthScaled, leftDepthScaled, rightDepthScaled]);

  // 3D corner piece geometries (quarter-annulus extruded by return depth)
  const cornerGeos = useMemo(
    () =>
      cornerPieces.map((p) => {
        const shape = buildCornerPieceShape(p.r, gauge, p.startAngle, p.endAngle);
        return smoothGeo(
          new THREE.ExtrudeGeometry(shape, {
            depth: p.returnDepth,
            bevelEnabled: false,
            curveSegments: 32,
          })
        );
      }),
    [cornerPieces, gauge]
  );

  // Flat corner strip geometries (unrolled arc: width = π×r/2, height = returnDepth)
  const cornerStripGeos = useMemo(
    () =>
      cornerPieces.map((p) => {
        const arcLen = (Math.PI * p.r) / 2;
        const shape = buildRectShape(arcLen, p.returnDepth);
        return smoothGeo(
          new THREE.ExtrudeGeometry(shape, {
            depth: gauge,
            bevelEnabled: false,
          })
        );
      }),
    [cornerPieces, gauge]
  );

  // ── Cutout return geometries ──

  // Oval: ring geometry that scales Y for smooth fold animation
  const ovalReturnGeo = useMemo(() => {
    if (!hasCutout || !hasCutoutEdge || cutout.shape !== "oval")
      return null;
    const ring = new THREE.Shape();
    ring.absellipse(0, 0, chwScaled, chdScaled, 0, Math.PI * 2, false, 0);
    const inner = new THREE.Path();
    inner.absellipse(
      0, 0,
      chwScaled - gauge, chdScaled - gauge,
      0, Math.PI * 2, true, 0
    );
    ring.holes.push(inner);
    return smoothGeo(
      new THREE.ExtrudeGeometry(ring, {
        depth: cutReturnDepthScaled,
        bevelEnabled: false,
        curveSegments: 64,
      })
    );
  }, [hasCutout, hasCutoutEdge, cutout.shape,
      chwScaled, chdScaled, cutReturnDepthScaled, gauge]);

  // Rectangular: welded ring geometry (shrinks via Y-scale during transition)
  const rectReturnGeo = useMemo(() => {
    if (!hasCutout || !hasCutoutEdge || cutout.shape === "oval")
      return null;
    const shape = buildRectCutoutReturnShape(cxs, czs, chwScaled, chdScaled, cutoutCR, gauge);
    return smoothGeo(
      new THREE.ExtrudeGeometry(shape, {
        depth: cutReturnDepthScaled,
        bevelEnabled: false,
        curveSegments: 48,
      })
    );
  }, [hasCutout, hasCutoutEdge, cutout.shape,
      cxs, czs, chwScaled, chdScaled, cutoutCR, cutReturnDepthScaled, gauge]);

  return (
    <group>
      {/* ── Main slab ──
          ExtrudeGeometry is in XY, extruded along +Z.
          rotation=[PI/2, 0, 0] maps XY→XZ, extrusion(Z)→-Y.
          position=[0, gauge/2, 0] so the top surface sits at Y=gauge. */}
      <mesh
        geometry={slabGeo}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, gauge / 2, 0]}
      >
        <MetalMaterial baseMetal={baseMetal} isAged={isAged} />
      </mesh>

      {/* ── Subtle bend-line annotations (visible when unfolded) ── */}
      <BendLineAnnotations
        hw={hw}
        hd={hd}
        gauge={gauge}
        config={config}
        foldRef={foldRef}
      />

      {/* ── Draggable split / cut line ── */}
      <DraggableSplitLine
        hw={hw}
        hd={hd}
        gauge={gauge}
        width={width}
        depth={depth}
        config={config}
      />

      {/* ── Front return ──
          Pivot at front edge of slab. Default (flat) = extends in +Z.
          Fold rotation.x = PI/2 maps +Z → -Y (hangs down). */}
      {frontReturnGeo && (
        <group position={[0, gauge / 2, hd]}>
          <group ref={frontPivotRef}>
            <mesh
              geometry={frontReturnGeo}
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, 0, frontReturnDepthScaled / 2]}
            >
              <MetalMaterial baseMetal={baseMetal} isAged={isAged} />
            </mesh>
          </group>
        </group>
      )}

      {/* ── Back upstand/return ──
          Pivot at back edge of slab. Default (flat) = extends in -Z.
          Upstand fold rotation.x = PI/2 maps -Z → +Y (stands up).
          Return fold rotation.x = -PI/2 maps -Z → -Y (hangs down). */}
      {backGeo && (
        <group position={[0, gauge / 2, -hd]}>
          <group ref={backPivotRef}>
            <mesh
              geometry={backGeo}
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, 0, -backDepthScaled / 2]}
            >
              <MetalMaterial baseMetal={baseMetal} isAged={isAged} />
            </mesh>
          </group>
        </group>
      )}

      {/* ── Left return ──
          Pivot at left edge of slab. Default (flat) = extends in -X.
          Fold rotation.z = PI/2 maps -X → -Y (hangs down).
          Shortened by corner radii, offset Z for asymmetric corners. */}
      {leftReturnGeo && (
        <group position={[-hw, gauge / 2, 0]}>
          <group ref={leftPivotRef}>
            <mesh
              geometry={leftReturnGeo}
              rotation={[Math.PI / 2, 0, 0]}
              position={[-leftDepthScaled / 2, 0, sideReturnOffsetZ]}
            >
              <MetalMaterial baseMetal={baseMetal} isAged={isAged} />
            </mesh>
          </group>
        </group>
      )}

      {/* ── Right return ──
          Pivot at right edge of slab. Default (flat) = extends in +X.
          Fold rotation.z = -PI/2 maps +X → -Y (hangs down).
          Shortened by corner radii, offset Z for asymmetric corners. */}
      {rightReturnGeo && (
        <group position={[hw, gauge / 2, 0]}>
          <group ref={rightPivotRef}>
            <mesh
              geometry={rightReturnGeo}
              rotation={[Math.PI / 2, 0, 0]}
              position={[rightDepthScaled / 2, 0, sideReturnOffsetZ]}
            >
              <MetalMaterial baseMetal={baseMetal} isAged={isAged} />
            </mesh>
          </group>
        </group>
      )}

      {/* ── Worktop corner pieces (3D) — quarter-annulus, hangs from slab top like returns ── */}
      {cornerPieces.length > 0 && (
        <group position={[0, gauge / 2, 0]}>
          <group ref={cornerPiece3DRef}>
            {cornerPieces.map((p, i) => (
              <mesh
                key={p.id}
                geometry={cornerGeos[i]}
                rotation={[Math.PI / 2, 0, 0]}
                position={[p.cx, 0, p.cz]}
              >
                <MetalMaterial baseMetal={baseMetal} isAged={isAged} doubleSide />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* ── Worktop corner flat strips — visible when flat, arc circumference width ── */}
      {cornerPieces.length > 0 && (
        <group ref={cornerStripRef}>
          {cornerPieces.map((p, i) => (
            <mesh
              key={`strip-${p.id}`}
              geometry={cornerStripGeos[i]}
              rotation={[Math.PI / 2, 0, p.flatRotY]}
              position={[p.flatX, gauge / 2, p.flatZ]}
            >
              <MetalMaterial baseMetal={baseMetal} isAged={isAged} />
            </mesh>
          ))}
        </group>
      )}

      {/* ── Cutout return/lip ring — shrinks via Y-scale during transition ── */}
      {hasCutout && hasCutoutEdge && (
        <group position={[0, cutoutGoesUp ? gauge / 2 : -gauge / 2, 0]}>
          <group ref={cutoutRingWrapperRef}>
            {cutout.shape === "oval" && ovalReturnGeo && (
              <mesh
                geometry={ovalReturnGeo}
                rotation={[cutoutGoesUp ? -Math.PI / 2 : Math.PI / 2, 0, 0]}
                position={[cxs, 0, czs]}
              >
                <MetalMaterial baseMetal={baseMetal} isAged={isAged} doubleSide />
              </mesh>
            )}
            {cutout.shape !== "oval" && rectReturnGeo && (
              <mesh
                geometry={rectReturnGeo}
                rotation={[cutoutGoesUp ? -Math.PI / 2 : Math.PI / 2, 0, 0]}
                position={[0, 0, 0]}
              >
                <MetalMaterial baseMetal={baseMetal} isAged={isAged} doubleSide />
              </mesh>
            )}
          </group>
        </group>
      )}

      {/* ── Cutout return/lip flat strips — grow via scale during transition ── */}
      {hasCutout && hasCutoutEdge && (
        <CutoutStrips
          cutout={cutout}
          gauge={gauge}
          hd={hd}
          baseMetal={baseMetal}
          isAged={isAged}
          config={config}
          foldRef={foldRef}
          cutoutCR={cutoutCR}
        />
      )}
    </group>
  );
}
