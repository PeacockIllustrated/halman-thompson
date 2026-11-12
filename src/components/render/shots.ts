// ─── Marketing render shots ─────────────────────────────────────
// Each shot is a worktop configuration + a set dressing + a camera.
// Units: configuration in mm; camera/scene in scene units (1 = 100mm).

import { DEFAULT_WORKTOP_CONFIG } from "@/stores/configurator";
import type { WorktopConfig } from "@/types";

export type SetStyle = "limewash" | "inkwell" | "studio";

// Keep each piece's flat blank (top + returns + upstand) within one
// 2000 × 1000 sheet, so no fabrication split line is drawn on the model.

export interface RenderShot {
  id: string;
  title: string;
  finishSlug: string;
  width: number;
  depth: number;
  thickness: number;
  config: WorktopConfig;
  set: SetStyle;
  /** Show the under-mount sink and tap when the config has a cut-out */
  sink: boolean;
  props: boolean;
  camera: { position: [number, number, number]; target: [number, number, number]; fov: number };
  /** Real-world width (mm) one texture tile represents — larger = fewer repeats */
  textureSpanMm: number;
  aspect: "landscape" | "portrait" | "square";
}

const withCutout = (
  overrides: Partial<WorktopConfig["cutout"]> = {}
): WorktopConfig => ({
  ...DEFAULT_WORKTOP_CONFIG,
  cutout: {
    ...DEFAULT_WORKTOP_CONFIG.cutout,
    enabled: true,
    width: 500,
    depth: 380,
    offsetX: -380,
    offsetZ: 30,
    ...overrides,
  },
});

const noUpstand: WorktopConfig = {
  ...DEFAULT_WORKTOP_CONFIG,
  backUpstand: { enabled: false, depth: 100 },
  backReturn: { enabled: true, depth: 45 },
};

export const SHOTS: RenderShot[] = [
  {
    id: "northumberland-kitchen",
    title: "Northumberland copper worktop with under-mount sink",
    finishSlug: "northumberland",
    width: 1900,
    depth: 620,
    thickness: 1.2,
    config: withCutout(),
    set: "limewash",
    sink: true,
    props: true,
    camera: { position: [12, 7, 15.5], target: [0.3, -1.8, 0], fov: 36 },
    textureSpanMm: 2000,
    aspect: "landscape",
  },
  {
    id: "northumberland-detail",
    title: "Northumberland copper: folded front return detail",
    finishSlug: "northumberland",
    width: 1900,
    depth: 620,
    thickness: 1.2,
    config: withCutout(),
    set: "limewash",
    sink: true,
    props: true,
    camera: { position: [11.5, 1.6, 8.5], target: [6.5, -0.6, 2.2], fov: 30 },
    textureSpanMm: 2000,
    aspect: "portrait",
  },
  {
    id: "antique-brass-inkwell",
    title: "Antique Brass worktop on ink-black cabinetry",
    finishSlug: "antique-brass",
    width: 1800,
    depth: 650,
    thickness: 1.2,
    config: withCutout({ shape: "oval", width: 460, depth: 360, offsetX: 360 }),
    set: "inkwell",
    sink: true,
    props: true,
    camera: { position: [-11.5, 6.8, 15], target: [0.6, -1.9, 0], fov: 36 },
    textureSpanMm: 2000,
    aspect: "landscape",
  },
  {
    id: "antique-brass-sink",
    title: "Antique Brass: oval under-mount sink and black tap",
    finishSlug: "antique-brass",
    width: 1800,
    depth: 650,
    thickness: 1.2,
    config: withCutout({ shape: "oval", width: 460, depth: 360, offsetX: 360 }),
    set: "inkwell",
    sink: true,
    props: true,
    camera: { position: [-2.5, 8.5, 12.5], target: [3.0, -0.4, -1.0], fov: 34 },
    textureSpanMm: 2000,
    aspect: "square",
  },
  {
    id: "ayrshire-studio",
    title: "Ayrshire copper island top in the studio",
    finishSlug: "ayrshire",
    width: 1600,
    depth: 800,
    thickness: 1.2,
    config: noUpstand,
    set: "studio",
    sink: false,
    props: false,
    camera: { position: [12, 6.2, 13.5], target: [0, -2.2, 0], fov: 36 },
    textureSpanMm: 2000,
    aspect: "landscape",
  },
  {
    id: "ayrshire-corner",
    title: "Ayrshire copper: rounded corner and returns",
    finishSlug: "ayrshire",
    width: 1600,
    depth: 800,
    thickness: 1.2,
    config: noUpstand,
    set: "studio",
    sink: false,
    props: false,
    camera: { position: [11.5, 4.2, 9.5], target: [6.2, -0.8, 3.0], fov: 32 },
    textureSpanMm: 2000,
    aspect: "portrait",
  },
];

export function getShot(id: string | null | undefined): RenderShot {
  return SHOTS.find((s) => s.id === id) ?? SHOTS[0];
}
