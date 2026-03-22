"use client";

/**
 * DimensionHandles — interactive 3D drag handles for the worktop configurator.
 *
 * Horizontal handles:  width, depth, returns, cutout size, corner radius
 * Vertical handles:    back upstand↔return, cutout lip↔returns  (auto-switch)
 *
 * Follows the same raycast-to-plane drag pattern used by `DraggableSplitLine`
 * in WorktopModel.tsx.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useConfiguratorStore } from "@/stores/configurator";
import type { WorktopConfig } from "@/types";

// ── Constants ──────────────────────────────────────────────────

const SCALE = 0.01; // 1 mm = 0.01 scene units
const HANDLE_Y = 0.005; // offset above slab surface
const HIT_THICKNESS = 0.4; // 40 mm generous hit zone
const BAR_W = 0.04; // visual bar thickness (slightly bolder)
const BAR_W_SM = 0.03; // thinner bar for secondary handles
const ARROW_R = 0.014; // arrow cone base radius
const ARROW_H = 0.035; // arrow cone height
const DEAD_ZONE = 5; // mm — vertical handle flip threshold

// ── Horizontal handle ─────────────────────────────────────────

interface HDef {
  id: string;
  label: string;
  dragAxis: "x" | "z";
  position: [number, number, number];
  barLen: number;
  hitLen: number;
  barThick?: number; // override BAR_W for secondary handles
  alwaysShowLabel?: boolean; // show label even when not hovered
  snap: number;
  min: number;
  max: number;
  getValue: () => number;
  hitToValue: (hit: THREE.Vector3) => number;
  apply: (mm: number) => void;
}

function HHandle({ def, gauge }: { def: HDef; gauge: number }) {
  const { camera, gl, controls } = useThree();
  const [hovered, setHovered] = useState(false);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Clean up dangling listeners on unmount (e.g. view-mode switch mid-drag)
  useEffect(() => () => { cleanupRef.current?.(); }, []);

  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), -(gauge / 2 + HANDLE_Y)),
    [gauge]
  );

  const cursor = def.dragAxis === "x" ? "ew-resize" : "ns-resize";
  const bw = def.barThick ?? BAR_W;

  const onPointerDown = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      e.stopPropagation();
      draggingRef.current = true;
      setDragging(true);
      if (controls && "enabled" in controls)
        (controls as { enabled: boolean }).enabled = false;
      gl.domElement.style.cursor = cursor;

      const rc = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const hit = new THREE.Vector3();

      const onMove = (ev: PointerEvent) => {
        const rect = gl.domElement.getBoundingClientRect();
        mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
        rc.setFromCamera(mouse, camera);
        if (rc.ray.intersectPlane(plane, hit)) {
          const raw = def.hitToValue(hit);
          const snapped = Math.round(raw / def.snap) * def.snap;
          const clamped = Math.max(def.min, Math.min(def.max, snapped));
          def.apply(clamped);
        }
      };

      const cleanup = () => {
        draggingRef.current = false;
        setDragging(false);
        if (controls && "enabled" in controls)
          (controls as { enabled: boolean }).enabled = true;
        try { gl.domElement.style.cursor = ""; } catch { /* unmounted */ }
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        cleanupRef.current = null;
        useConfiguratorStore.getState().calculatePrice();
      };

      const onUp = () => cleanup();

      cleanupRef.current = cleanup;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [def, camera, gl, controls, plane, cursor]
  );

  const active = hovered || dragging;
  const isX = def.dragAxis === "x";

  // After rotation [-PI/2, 0, 0]: planeGeo(w,h) → w along X, h along Z
  const barArgs: [number, number] = isX
    ? [bw, def.barLen]
    : [def.barLen, bw];
  const hitArgs: [number, number] = isX
    ? [HIT_THICKNESS, def.hitLen]
    : [def.hitLen, HIT_THICKNESS];
  const glowArgs: [number, number] = isX
    ? [bw * 3.5, def.barLen * 1.15]
    : [def.barLen * 1.15, bw * 3.5];

  const arrowGap = 0.045;
  const arrows: { pos: THREE.Vector3Tuple; rot: THREE.Vector3Tuple }[] = isX
    ? [
        { pos: [arrowGap, 0, 0], rot: [0, 0, -Math.PI / 2] },
        { pos: [-arrowGap, 0, 0], rot: [0, 0, Math.PI / 2] },
      ]
    : [
        { pos: [0, 0, arrowGap], rot: [Math.PI / 2, 0, 0] },
        { pos: [0, 0, -arrowGap], rot: [-Math.PI / 2, 0, 0] },
      ];

  return (
    <group position={def.position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={barArgs} />
        <meshBasicMaterial
          color={0xb8860b}
          transparent
          opacity={active ? 1.0 : 0.7}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={glowArgs} />
        <meshBasicMaterial
          color={0xb8860b}
          transparent
          opacity={active ? 0.25 : 0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {arrows.map((a, i) => (
        <mesh key={i} position={a.pos} rotation={a.rot}>
          <coneGeometry args={[ARROW_R, ARROW_H, 6]} />
          <meshBasicMaterial
            color={0xb8860b}
            transparent
            opacity={active ? 1.0 : 0.55}
          />
        </mesh>
      ))}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={onPointerDown}
        onPointerEnter={() => {
          setHovered(true);
          if (!draggingRef.current) gl.domElement.style.cursor = cursor;
        }}
        onPointerLeave={() => {
          setHovered(false);
          if (!draggingRef.current) gl.domElement.style.cursor = "";
        }}
      >
        <planeGeometry args={hitArgs} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {(active || def.alwaysShowLabel) && (
        <Html center style={{ pointerEvents: "none" }} position={[0, 0.15, 0]}>
          <div
            className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold tabular-nums text-white shadow-lg transition-opacity duration-200"
            style={{
              backgroundColor: "#92700a",
              opacity: active ? 1 : 0.65,
            }}
          >
            {def.label} {def.getValue()}mm
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Vertical handle (above / below auto-switch) ───────────────

interface VDef {
  id: string;
  /** Fixed edge position — group is placed here */
  edgePos: [number, number, number];
  /** Width of the bar along the edge */
  barAlong: number;
  /** Width of the hit zone along the edge */
  hitAlong: number;
  /** Plane axis: "z" (front/back edges) or "x" (left/right edges) */
  planeAxis?: "z" | "x";
  /** Coordinate for the vertical raycast plane along planeAxis */
  planeZ: number;
  snap: number;
  min: number; // most negative (deepest return)
  max: number; // most positive (tallest upstand/lip)
  /** Signed value: positive = above surface, negative = below */
  getValue: () => number;
  /** Convert hit.y → signed mm using slab gauge */
  hitToValue: (hitY: number) => number;
  apply: (signedMm: number) => void;
  upLabel: string;
  downLabel: string;
}

function VHandle({ def, gauge }: { def: VDef; gauge: number }) {
  const { camera, gl, controls } = useThree();
  const [hovered, setHovered] = useState(false);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => { cleanupRef.current?.(); }, []);

  // Vertical plane at the edge position
  const vPlane = useMemo(() => {
    const axis = def.planeAxis ?? "z";
    const normal = axis === "z"
      ? new THREE.Vector3(0, 0, 1)
      : new THREE.Vector3(1, 0, 0);
    return new THREE.Plane(normal, -def.planeZ);
  }, [def.planeZ, def.planeAxis]);

  const onPointerDown = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      e.stopPropagation();
      draggingRef.current = true;
      setDragging(true);
      if (controls && "enabled" in controls)
        (controls as { enabled: boolean }).enabled = false;
      gl.domElement.style.cursor = "ns-resize";

      const rc = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const hit = new THREE.Vector3();

      const onMove = (ev: PointerEvent) => {
        const rect = gl.domElement.getBoundingClientRect();
        mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
        rc.setFromCamera(mouse, camera);
        if (rc.ray.intersectPlane(vPlane, hit)) {
          const raw = def.hitToValue(hit.y);
          const snapped = Math.round(raw / def.snap) * def.snap;
          const clamped = Math.max(def.min, Math.min(def.max, snapped));
          def.apply(clamped);
        }
      };

      const cleanup = () => {
        draggingRef.current = false;
        setDragging(false);
        if (controls && "enabled" in controls)
          (controls as { enabled: boolean }).enabled = true;
        try { gl.domElement.style.cursor = ""; } catch { /* unmounted */ }
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        cleanupRef.current = null;
        useConfiguratorStore.getState().calculatePrice();
      };

      const onUp = () => cleanup();

      cleanupRef.current = cleanup;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [def, camera, gl, controls, vPlane]
  );

  const active = hovered || dragging;
  const val = def.getValue();
  const absVal = Math.abs(val);
  const extent = absVal * SCALE;
  const isUp = val > 0;

  // Bar: extends from slab edge vertically
  const barH = Math.max(0.05, extent);
  const barMidY = isUp
    ? gauge / 2 + barH / 2
    : val < 0
      ? -gauge / 2 - barH / 2
      : 0;

  // Hit zone: generous vertical area (covers both up and down)
  const hitH = 0.8;

  // Arrow positions (above/below slab)
  const upArrowY = Math.max(gauge / 2 + extent, gauge / 2) + 0.045;
  const dnArrowY = Math.min(-gauge / 2 - extent, -gauge / 2) - 0.045;

  // Label
  const labelText =
    val > DEAD_ZONE
      ? `${def.upLabel} ${absVal}mm`
      : val < -DEAD_ZONE
        ? `${def.downLabel} ${absVal}mm`
        : "0mm";

  return (
    <group position={def.edgePos}>
      {/* Vertical bar (XY plane, no rotation → faces +Z toward camera) */}
      <mesh position={[0, barMidY, 0]}>
        <planeGeometry args={[BAR_W, barH]} />
        <meshBasicMaterial
          color={0xb8860b}
          transparent
          opacity={active ? 1.0 : 0.7}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Glow */}
      <mesh position={[0, barMidY, 0]}>
        <planeGeometry args={[BAR_W * 4, barH * 1.2]} />
        <meshBasicMaterial
          color={0xb8860b}
          transparent
          opacity={active ? 0.25 : 0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Up arrow — points +Y (default cone orientation) */}
      <mesh position={[0, upArrowY, 0]}>
        <coneGeometry args={[ARROW_R, ARROW_H, 6]} />
        <meshBasicMaterial
          color={0xb8860b}
          transparent
          opacity={active ? 1.0 : 0.55}
        />
      </mesh>

      {/* Down arrow — points -Y (flipped) */}
      <mesh position={[0, dnArrowY, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[ARROW_R, ARROW_H, 6]} />
        <meshBasicMaterial
          color={0xb8860b}
          transparent
          opacity={active ? 1.0 : 0.55}
        />
      </mesh>

      {/* Invisible hit zone — vertical, generous */}
      <mesh
        onPointerDown={onPointerDown}
        onPointerEnter={() => {
          setHovered(true);
          if (!draggingRef.current) gl.domElement.style.cursor = "ns-resize";
        }}
        onPointerLeave={() => {
          setHovered(false);
          if (!draggingRef.current) gl.domElement.style.cursor = "";
        }}
      >
        <planeGeometry args={[def.hitAlong, hitH]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Label */}
      {active && (
        <Html
          center
          style={{ pointerEvents: "none" }}
          position={[def.barAlong / 2 + 0.15, barMidY, 0]}
        >
          <div
            className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold tabular-nums text-white shadow-lg"
            style={{ backgroundColor: isUp ? "#6a5d10" : "#7a4a0a" }}
          >
            {labelText}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── DimensionHandles (parent) ─────────────────────────────────

interface Props {
  width: number;
  depth: number;
  thickness: number;
  config: WorktopConfig;
}

export function DimensionHandles({ width, depth, thickness, config }: Props) {
  const setWidth = useConfiguratorStore((s) => s.setWidth);
  const setHeight = useConfiguratorStore((s) => s.setHeight);
  const setWorktopConfig = useConfiguratorStore((s) => s.setWorktopConfig);

  const gauge = thickness * SCALE;
  const hw = (width * SCALE) / 2;
  const hd = (depth * SCALE) / 2;
  const y = gauge / 2 + HANDLE_Y;

  const cutout = config.cutout;
  const hasCutout = cutout.enabled;
  const cxS = cutout.offsetX * SCALE;
  const czS = cutout.offsetZ * SCALE;
  const chwS = (cutout.width * SCALE) / 2;
  const cutoutDMm = cutout.shape === "square" ? cutout.width : cutout.depth;
  const chdS = (cutoutDMm * SCALE) / 2;

  // Clamped corner radius (mirrors WorktopModel logic)
  const rMax = Math.min(config.cornerRadius, width * 0.2, depth * 0.2);
  const rScene = rMax * SCALE;

  // ── Horizontal handles ──

  const hHandles = useMemo((): HDef[] => {
    const defs: HDef[] = [];

    const barZ = Math.min(depth * SCALE * 0.35, 0.6);
    const barX = Math.min(width * SCALE * 0.35, 0.6);
    const hitZ = Math.min(depth * SCALE * 0.55, 1.2);
    const hitX = Math.min(width * SCALE * 0.55, 1.2);

    // ── Width (left / right) ──
    defs.push({
      id: "w-r", label: "W", dragAxis: "x",
      position: [hw, y, 0], barLen: barZ, hitLen: hitZ,
      snap: 10, min: 200, max: 3000,
      getValue: () => width,
      hitToValue: (h) => (Math.abs(h.x) * 2) / SCALE,
      apply: setWidth,
    });
    defs.push({
      id: "w-l", label: "W", dragAxis: "x",
      position: [-hw, y, 0], barLen: barZ, hitLen: hitZ,
      snap: 10, min: 200, max: 3000,
      getValue: () => width,
      hitToValue: (h) => (Math.abs(h.x) * 2) / SCALE,
      apply: setWidth,
    });

    // ── Depth (front / back) ──
    defs.push({
      id: "d-f", label: "D", dragAxis: "z",
      position: [-hw * 0.35, y, hd], barLen: barX * 0.5, hitLen: hitX * 0.5,
      snap: 10, min: 200, max: 1000,
      getValue: () => depth,
      hitToValue: (h) => (Math.abs(h.z) * 2) / SCALE,
      apply: setHeight,
    });
    defs.push({
      id: "d-b", label: "D", dragAxis: "z",
      position: [-hw * 0.35, y, -hd], barLen: barX * 0.5, hitLen: hitX * 0.5,
      snap: 10, min: 200, max: 1000,
      getValue: () => depth,
      hitToValue: (h) => (Math.abs(h.z) * 2) / SCALE,
      apply: setHeight,
    });

    // ── Return depth handles (horizontal, returns only) ──
    const retBarX = Math.min(width * SCALE * 0.55, 0.9);
    const retBarZ = Math.min(depth * SCALE * 0.55, 0.9);
    const retHitX = Math.min(width * SCALE * 0.7, 1.3);
    const retHitZ = Math.min(depth * SCALE * 0.7, 1.3);

    // Helper: when linked, propagate depth to all enabled returns
    const applyReturnDepth = (key: "frontReturn" | "leftReturn" | "rightReturn", v: number) => {
      const cfg = useConfiguratorStore.getState().worktopConfig;
      if (cfg.returnsLinked) {
        const patch: Partial<typeof cfg> = {};
        if (cfg.frontReturn.enabled) patch.frontReturn = { enabled: true, depth: v };
        if (cfg.leftReturn.enabled) patch.leftReturn = { enabled: true, depth: v };
        if (cfg.rightReturn.enabled) patch.rightReturn = { enabled: true, depth: v };
        setWorktopConfig({ ...cfg, ...patch });
      } else {
        setWorktopConfig({ ...cfg, [key]: { enabled: true, depth: v } });
      }
    };

    if (config.frontReturn.enabled) {
      const frD = config.frontReturn.depth;
      defs.push({
        id: "fr", label: config.returnsLinked ? "Return" : "FR",
        dragAxis: "z", alwaysShowLabel: true,
        position: [0, y, hd - 0.02],
        barLen: retBarX, hitLen: retHitX,
        snap: 5, min: 10, max: 200,
        getValue: () => frD,
        hitToValue: (h) => Math.max(0, (h.z - hd) / SCALE),
        apply: (v) => applyReturnDepth("frontReturn", v),
      });
    }

    if (config.leftReturn.enabled) {
      const lrD = config.leftReturn.depth;
      defs.push({
        id: "lr", label: config.returnsLinked ? "Return" : "LR",
        dragAxis: "x", alwaysShowLabel: true,
        position: [-hw + 0.02, y, 0],
        barLen: retBarZ, hitLen: retHitZ,
        snap: 5, min: 10, max: 200,
        getValue: () => lrD,
        hitToValue: (h) => Math.max(0, (-hw - h.x) / SCALE),
        apply: (v) => applyReturnDepth("leftReturn", v),
      });
    }

    if (config.rightReturn.enabled) {
      const rrD = config.rightReturn.depth;
      defs.push({
        id: "rr", label: config.returnsLinked ? "Return" : "RR",
        dragAxis: "x", alwaysShowLabel: true,
        position: [hw - 0.02, y, 0],
        barLen: retBarZ, hitLen: retHitZ,
        snap: 5, min: 10, max: 200,
        getValue: () => rrD,
        hitToValue: (h) => Math.max(0, (h.x - hw) / SCALE),
        apply: (v) => applyReturnDepth("rightReturn", v),
      });
    }

    // ── Corner radius (front-right corner) ──
    {
      const rCap = Math.floor(Math.min(width * 0.2, depth * 0.2));
      defs.push({
        id: "cr", label: "R", dragAxis: "x", barThick: BAR_W_SM,
        position: [hw - rScene, y, hd - 0.015],
        barLen: 0.08, hitLen: 0.35,
        snap: 1, min: 0, max: rCap,
        getValue: () => Math.round(Math.min(rMax, rCap)),
        hitToValue: (h) => (hw - h.x) / SCALE,
        apply: (v) => {
          const cfg = useConfiguratorStore.getState().worktopConfig;
          setWorktopConfig({ ...cfg, cornerRadius: Math.min(Math.max(0, v), rCap) });
        },
      });
    }

    // ── Cutout size handles ──
    if (hasCutout) {
      const cBarZ = Math.min(cutoutDMm * SCALE * 0.4, 0.35);
      const cBarX = Math.min(cutout.width * SCALE * 0.4, 0.35);
      const cHitZ = Math.min(cutoutDMm * SCALE * 0.65, 0.7);
      const cHitX = Math.min(cutout.width * SCALE * 0.65, 0.7);

      defs.push({
        id: "cw-r", label: "CW", dragAxis: "x",
        position: [cxS + chwS, y, czS], barLen: cBarZ, hitLen: cHitZ,
        snap: 5, min: 100, max: width - 100,
        getValue: () => cutout.width,
        hitToValue: (h) => (Math.abs(h.x - cxS) * 2) / SCALE,
        apply: (v) => {
          const cfg = useConfiguratorStore.getState().worktopConfig;
          setWorktopConfig({ ...cfg, cutout: { ...cfg.cutout, width: v } });
        },
      });
      defs.push({
        id: "cw-l", label: "CW", dragAxis: "x",
        position: [cxS - chwS, y, czS], barLen: cBarZ, hitLen: cHitZ,
        snap: 5, min: 100, max: width - 100,
        getValue: () => cutout.width,
        hitToValue: (h) => (Math.abs(h.x - cxS) * 2) / SCALE,
        apply: (v) => {
          const cfg = useConfiguratorStore.getState().worktopConfig;
          setWorktopConfig({ ...cfg, cutout: { ...cfg.cutout, width: v } });
        },
      });
      defs.push({
        id: "cd-f", label: "CD", dragAxis: "z",
        position: [cxS, y, czS + chdS], barLen: cBarX, hitLen: cHitX,
        snap: 5, min: 100, max: depth - 100,
        getValue: () => cutoutDMm,
        hitToValue: (h) => (Math.abs(h.z - czS) * 2) / SCALE,
        apply: (v) => {
          const cfg = useConfiguratorStore.getState().worktopConfig;
          if (cutout.shape === "square") {
            setWorktopConfig({ ...cfg, cutout: { ...cfg.cutout, width: v } });
          } else {
            setWorktopConfig({ ...cfg, cutout: { ...cfg.cutout, depth: v } });
          }
        },
      });
      defs.push({
        id: "cd-b", label: "CD", dragAxis: "z",
        position: [cxS, y, czS - chdS], barLen: cBarX, hitLen: cHitX,
        snap: 5, min: 100, max: depth - 100,
        getValue: () => cutoutDMm,
        hitToValue: (h) => (Math.abs(h.z - czS) * 2) / SCALE,
        apply: (v) => {
          const cfg = useConfiguratorStore.getState().worktopConfig;
          if (cutout.shape === "square") {
            setWorktopConfig({ ...cfg, cutout: { ...cfg.cutout, width: v } });
          } else {
            setWorktopConfig({ ...cfg, cutout: { ...cfg.cutout, depth: v } });
          }
        },
      });

      // ── Cutout corner radius (front-right corner of cutout) ──
      if (cutout.shape !== "oval") {
        const ccrMax = Math.min(
          cutout.cornerRadius,
          cutout.width * 0.45,
          cutoutDMm * 0.45,
        );
        const ccrS = ccrMax * SCALE;
        defs.push({
          id: "ccr", label: "CR", dragAxis: "x", barThick: BAR_W_SM,
          position: [cxS + chwS - ccrS, y, czS + chdS - 0.01],
          barLen: 0.06, hitLen: 0.3,
          snap: 1, min: 0,
          max: Math.floor(Math.min(cutout.width * 0.45, cutoutDMm * 0.45)),
          getValue: () => Math.round(ccrMax),
          hitToValue: (h) => (cxS + chwS - h.x) / SCALE,
          apply: (v) => {
            const cfg = useConfiguratorStore.getState().worktopConfig;
            setWorktopConfig({
              ...cfg,
              cutout: { ...cfg.cutout, cornerRadius: Math.max(0, v) },
            });
          },
        });
      }
    }

    return defs;
  }, [
    width, depth, hw, hd, y, rMax, rScene,
    config, hasCutout, cutout, cutoutDMm,
    cxS, czS, chwS, chdS,
    setWidth, setHeight, setWorktopConfig,
  ]);

  // ── Vertical handles ──

  const vHandles = useMemo((): VDef[] => {
    const defs: VDef[] = [];
    const edgeBarX = Math.min(width * SCALE * 0.25, 0.5);
    const edgeHitX = Math.min(width * SCALE * 0.4, 0.8);

    // ── Back edge — upstand ↔ return auto-switch ──
    const backVal = config.backUpstand.enabled
      ? config.backUpstand.depth
      : config.backReturn.enabled
        ? -config.backReturn.depth
        : 0;

    defs.push({
      id: "back-v",
      edgePos: [0, 0, -hd],
      barAlong: edgeBarX,
      hitAlong: edgeHitX,
      planeZ: -hd,
      snap: 5, min: -200, max: 300,
      getValue: () => backVal,
      hitToValue: (hitY: number) => {
        if (hitY > gauge / 2) return (hitY - gauge / 2) / SCALE;
        if (hitY < -gauge / 2) return (hitY + gauge / 2) / SCALE;
        return 0;
      },
      apply: (v: number) => {
        const cfg = useConfiguratorStore.getState().worktopConfig;
        const absV = Math.abs(v);
        if (v > DEAD_ZONE) {
          setWorktopConfig({
            ...cfg,
            backUpstand: { enabled: true, depth: absV },
            backReturn: { enabled: false, depth: cfg.backReturn.depth },
          });
        } else if (v < -DEAD_ZONE) {
          setWorktopConfig({
            ...cfg,
            backUpstand: { enabled: false, depth: cfg.backUpstand.depth },
            backReturn: { enabled: true, depth: absV },
          });
        } else {
          setWorktopConfig({
            ...cfg,
            backUpstand: { enabled: false, depth: cfg.backUpstand.depth },
            backReturn: { enabled: false, depth: cfg.backReturn.depth },
          });
        }
      },
      upLabel: "Upstand",
      downLabel: "Return",
    });

    // ── Cutout edge — lip ↔ returns auto-switch ──
    if (hasCutout && (cutout.returns.enabled || cutout.lip.enabled)) {
      const cutVal = cutout.lip.enabled
        ? cutout.lip.depth
        : cutout.returns.enabled
          ? -cutout.returns.depth
          : 0;

      const cutEdgeBarX = Math.min(cutout.width * SCALE * 0.3, 0.35);
      const cutEdgeHitX = Math.min(cutout.width * SCALE * 0.5, 0.6);

      defs.push({
        id: "cut-v",
        edgePos: [cxS, 0, czS + chdS],
        barAlong: cutEdgeBarX,
        hitAlong: cutEdgeHitX,
        planeZ: czS + chdS,
        snap: 5, min: -100, max: 100,
        getValue: () => cutVal,
        hitToValue: (hitY: number) => {
          if (hitY > gauge / 2) return (hitY - gauge / 2) / SCALE;
          if (hitY < -gauge / 2) return (hitY + gauge / 2) / SCALE;
          return 0;
        },
        apply: (v: number) => {
          const cfg = useConfiguratorStore.getState().worktopConfig;
          const absV = Math.abs(v);
          if (v > DEAD_ZONE) {
            setWorktopConfig({
              ...cfg,
              cutout: {
                ...cfg.cutout,
                lip: { enabled: true, depth: absV },
                returns: { enabled: false, depth: cfg.cutout.returns.depth },
              },
            });
          } else if (v < -DEAD_ZONE) {
            setWorktopConfig({
              ...cfg,
              cutout: {
                ...cfg.cutout,
                lip: { enabled: false, depth: cfg.cutout.lip.depth },
                returns: { enabled: true, depth: absV },
              },
            });
          } else {
            setWorktopConfig({
              ...cfg,
              cutout: {
                ...cfg.cutout,
                lip: { enabled: false, depth: cfg.cutout.lip.depth },
                returns: { enabled: false, depth: cfg.cutout.returns.depth },
              },
            });
          }
        },
        upLabel: "Lip",
        downLabel: "Returns",
      });
    }

    return defs;
  }, [
    width, gauge, hd, config,
    hasCutout, cutout, cutoutDMm,
    cxS, czS, chdS,
    setWorktopConfig,
  ]);

  return (
    <group>
      {hHandles.map((h) => (
        <HHandle key={h.id} def={h} gauge={gauge} />
      ))}
      {vHandles.map((v) => (
        <VHandle key={v.id} def={v} gauge={gauge} />
      ))}
    </group>
  );
}
