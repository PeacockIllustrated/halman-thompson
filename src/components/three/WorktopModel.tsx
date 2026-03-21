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
 * Rectangular cutout return ring shape.
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
  s.moveTo(cx - chw + cr, cy - chd);
  s.lineTo(cx - chw, cy - chd + cr);
  s.lineTo(cx - chw, cy + chd - cr);
  s.lineTo(cx - chw + cr, cy + chd);
  s.lineTo(cx + chw - cr, cy + chd);
  s.lineTo(cx + chw, cy + chd - cr);
  s.lineTo(cx + chw, cy - chd + cr);
  s.lineTo(cx + chw - cr, cy - chd);
  s.closePath();

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

// ── Cutout return flat strips (visible in flat view) ──

function CutoutStrips({
  cutout,
  gauge,
  hd,
  baseMetal,
  isAged,
  config,
  foldRef,
}: {
  cutout: CutoutConfig;
  gauge: number;
  hd: number;
  baseMetal: MetalType;
  isAged: boolean;
  config: WorktopConfig;
  foldRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const strips = useMemo(() => {
    const returnD = cutout.returns.depth * SCALE;
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
      // Rectangle / square → 4 side strips
      const cw = cutout.width * SCALE;
      const cd =
        (cutout.shape === "square" ? cutout.width : cutout.depth) * SCALE;

      for (const { id, sw } of [
        { id: "cut-top", sw: cw },
        { id: "cut-bottom", sw: cw },
        { id: "cut-left", sw: cd },
        { id: "cut-right", sw: cd },
      ]) {
        result.push({ id, w: sw, h: returnD, x: 0, z: z + returnD / 2 });
        z += returnD + stripGap;
      }
    }

    return result;
  }, [cutout, gauge, hd, config]);

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

  // Show only when approaching flat state
  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.visible = foldRef.current < 0.5;
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

  // ── Fold animation ──
  // foldRef: 0 = flat, 1 = folded (3D)
  // Default positions are FLAT. Fold rotation creates the 3D state.
  const foldRef = useRef(1);
  const targetFold = viewMode === "flat" ? 0 : 1;
  const frontPivotRef = useRef<THREE.Group>(null);
  const backPivotRef = useRef<THREE.Group>(null);
  const leftPivotRef = useRef<THREE.Group>(null);
  const rightPivotRef = useRef<THREE.Group>(null);
  const cutoutRingRef = useRef<THREE.Group>(null);

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
    // Rotating around Z at left edge: +PI/2 maps -X → -Y
    //   rotation around Z by θ: X' = X*cos(θ) - Y*sin(θ), Y' = X*sin(θ) + Y*cos(θ)
    //   Point (-leftD/2, 0, 0), θ = PI/2:
    //     X' = 0, Y' = -leftD/2 → goes DOWN, correct!
    if (leftPivotRef.current) {
      leftPivotRef.current.rotation.z = fold * Math.PI / 2;
    }

    // Right return: flat = extends in +X, folded = hangs down (-Y)
    // Rotating around Z at right edge: -PI/2 maps +X → -Y
    //   Point (rightD/2, 0, 0), θ = -PI/2:
    //     X' = 0, Y' = -rightD/2 → goes DOWN, correct!
    if (rightPivotRef.current) {
      rightPivotRef.current.rotation.z = -fold * Math.PI / 2;
    }

    // ── Cutout ring visibility (3D ring hidden when flat, strips take over) ──
    if (cutoutRingRef.current) {
      cutoutRingRef.current.visible = fold > 0.5;
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
        depth: gauge,
        bevelEnabled: false,
        curveSegments: 64,
      })
    );
  }, [
    hw, hd, rf, rb, gauge, hasCutout,
    cutout.offsetX, cutout.offsetZ, cutout.width, cutout.depth, cutout.shape,
  ]);

  // ── Return/upstand geometries — ExtrudeGeometry for correct UV mapping ──

  const frontReturnDepthScaled = config.frontReturn.depth * SCALE;
  const frontReturnGeo = useMemo(() => {
    if (!config.frontReturn.enabled) return null;
    const shape = buildRectShape(w, frontReturnDepthScaled);
    return smoothGeo(
      new THREE.ExtrudeGeometry(shape, { depth: gauge, bevelEnabled: false })
    );
  }, [w, gauge, frontReturnDepthScaled, config.frontReturn.enabled]);

  const isBackUpstand = config.backUpstand.enabled;
  const isBackReturn = config.backReturn.enabled && !isBackUpstand;
  const backDepthScaled = isBackUpstand
    ? config.backUpstand.depth * SCALE
    : isBackReturn
      ? config.backReturn.depth * SCALE
      : 0;
  const backGeo = useMemo(() => {
    if (!isBackUpstand && !isBackReturn) return null;
    const shape = buildRectShape(w, backDepthScaled);
    return smoothGeo(
      new THREE.ExtrudeGeometry(shape, { depth: gauge, bevelEnabled: false })
    );
  }, [w, gauge, backDepthScaled, isBackUpstand, isBackReturn]);

  const leftDepthScaled = config.leftReturn.depth * SCALE;
  const leftReturnGeo = useMemo(() => {
    if (!config.leftReturn.enabled) return null;
    const shape = buildRectShape(leftDepthScaled, d);
    return smoothGeo(
      new THREE.ExtrudeGeometry(shape, { depth: gauge, bevelEnabled: false })
    );
  }, [d, gauge, leftDepthScaled, config.leftReturn.enabled]);

  const rightDepthScaled = config.rightReturn.depth * SCALE;
  const rightReturnGeo = useMemo(() => {
    if (!config.rightReturn.enabled) return null;
    const shape = buildRectShape(rightDepthScaled, d);
    return smoothGeo(
      new THREE.ExtrudeGeometry(shape, { depth: gauge, bevelEnabled: false })
    );
  }, [d, gauge, rightDepthScaled, config.rightReturn.enabled]);

  // ── Cutout return geometries (welded, no fold animation) ──

  const ovalReturnGeo = useMemo(() => {
    if (!hasCutout || !cutout.returns.enabled || cutout.shape !== "oval")
      return null;
    const chw = (cutout.width * SCALE) / 2;
    const chd = (cutout.depth * SCALE) / 2;
    const ring = new THREE.Shape();
    ring.absellipse(0, 0, chw, chd, 0, Math.PI * 2, false, 0);
    const inner = new THREE.Path();
    inner.absellipse(0, 0, chw - gauge, chd - gauge, 0, Math.PI * 2, true, 0);
    ring.holes.push(inner);
    return smoothGeo(
      new THREE.ExtrudeGeometry(ring, {
        depth: cutout.returns.depth * SCALE,
        bevelEnabled: false,
        curveSegments: 64,
      })
    );
  }, [hasCutout, cutout.returns.enabled, cutout.returns.depth,
      cutout.width, cutout.depth, cutout.shape, gauge]);

  const rectReturnGeo = useMemo(() => {
    if (!hasCutout || !cutout.returns.enabled || cutout.shape === "oval")
      return null;
    const cx = cutout.offsetX * SCALE;
    const cy = cutout.offsetZ * SCALE;
    const chw = (cutout.width * SCALE) / 2;
    const chd =
      ((cutout.shape === "square" ? cutout.width : cutout.depth) * SCALE) / 2;
    const cr = Math.min(0.005, chw * 0.1, chd * 0.1);
    const shape = buildRectCutoutReturnShape(cx, cy, chw, chd, cr, gauge);
    return smoothGeo(
      new THREE.ExtrudeGeometry(shape, {
        depth: cutout.returns.depth * SCALE,
        bevelEnabled: false,
        curveSegments: 32,
      })
    );
  }, [hasCutout, cutout.returns.enabled, cutout.returns.depth,
      cutout.offsetX, cutout.offsetZ, cutout.width, cutout.depth, cutout.shape, gauge]);

  const cxs = cutout.offsetX * SCALE;
  const czs = cutout.offsetZ * SCALE;

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
          Fold rotation.z = PI/2 maps -X → -Y (hangs down). */}
      {leftReturnGeo && (
        <group position={[-hw, gauge / 2, 0]}>
          <group ref={leftPivotRef}>
            <mesh
              geometry={leftReturnGeo}
              rotation={[Math.PI / 2, 0, 0]}
              position={[-leftDepthScaled / 2, 0, 0]}
            >
              <MetalMaterial baseMetal={baseMetal} isAged={isAged} />
            </mesh>
          </group>
        </group>
      )}

      {/* ── Right return ──
          Pivot at right edge of slab. Default (flat) = extends in +X.
          Fold rotation.z = -PI/2 maps +X → -Y (hangs down). */}
      {rightReturnGeo && (
        <group position={[hw, gauge / 2, 0]}>
          <group ref={rightPivotRef}>
            <mesh
              geometry={rightReturnGeo}
              rotation={[Math.PI / 2, 0, 0]}
              position={[rightDepthScaled / 2, 0, 0]}
            >
              <MetalMaterial baseMetal={baseMetal} isAged={isAged} />
            </mesh>
          </group>
        </group>
      )}

      {/* ── Cutout return ring (3D view — hidden when flat) ── */}
      {hasCutout && cutout.returns.enabled && (
        <group ref={cutoutRingRef}>
          {cutout.shape === "oval" && ovalReturnGeo && (
            <mesh
              geometry={ovalReturnGeo}
              rotation={[Math.PI / 2, 0, 0]}
              position={[cxs, -gauge / 2, czs]}
            >
              <MetalMaterial baseMetal={baseMetal} isAged={isAged} doubleSide />
            </mesh>
          )}
          {cutout.shape !== "oval" && rectReturnGeo && (
            <mesh
              geometry={rectReturnGeo}
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, -gauge / 2, 0]}
            >
              <MetalMaterial baseMetal={baseMetal} isAged={isAged} doubleSide />
            </mesh>
          )}
        </group>
      )}

      {/* ── Cutout return flat strips (flat view — replaces ring) ── */}
      {hasCutout && cutout.returns.enabled && (
        <CutoutStrips
          cutout={cutout}
          gauge={gauge}
          hd={hd}
          baseMetal={baseMetal}
          isAged={isAged}
          config={config}
          foldRef={foldRef}
        />
      )}
    </group>
  );
}
