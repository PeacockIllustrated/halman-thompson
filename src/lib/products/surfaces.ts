// ─── HT Fabrication Visualiser — Surface Products ──────────────────
// Bar tops, table tops and wall panels are fabricated the same way as
// worktops: a flat metal sheet folded to form returns / drop edges. They
// therefore share the parametric surface model (WorktopModel) and the
// folded-edge options panel, tuned per product via the specs below.

import type { ProductType, WorktopConfig } from "@/types";

export const SURFACE_PRODUCTS: ProductType[] = [
  "worktop",
  "bar_top",
  "table_top",
  "wall_panel",
];

/** True for products rendered with the folded-sheet surface model. */
export function isSurfaceProduct(pt: ProductType): boolean {
  return (SURFACE_PRODUCTS as string[]).includes(pt);
}

// ─── Per-product default edge configuration ───────────────────────

function edge(enabled: boolean, depth: number) {
  return { enabled, depth };
}

const NO_CUTOUT: WorktopConfig["cutout"] = {
  enabled: false,
  shape: "rectangle",
  width: 450,
  depth: 350,
  cornerRadius: 15,
  offsetX: 0,
  offsetZ: 0,
  returns: { enabled: true, depth: 30 },
  lip: { enabled: false, depth: 30 },
};

/**
 * Sensible default folded-edge configuration for each surface product,
 * reflecting how the piece is actually fabricated and installed.
 */
export function defaultSurfaceConfig(pt: ProductType): WorktopConfig {
  switch (pt) {
    case "bar_top":
      // Boxed bar top: apron/drop on all four sides, no wall upstand.
      return {
        cornerRadius: 6,
        returnsLinked: true,
        frontReturn: edge(true, 90),
        backUpstand: edge(false, 100),
        backReturn: edge(true, 90),
        leftReturn: edge(true, 90),
        rightReturn: edge(true, 90),
        cutout: { ...NO_CUTOUT },
        splitPosition: null,
        splitDirection: null,
      };
    case "table_top":
      // Freestanding slab with a folded drop edge all round.
      return {
        cornerRadius: 12,
        returnsLinked: true,
        frontReturn: edge(true, 40),
        backUpstand: edge(false, 100),
        backReturn: edge(true, 40),
        leftReturn: edge(true, 40),
        rightReturn: edge(true, 40),
        cutout: { ...NO_CUTOUT },
        splitPosition: null,
        splitDirection: null,
      };
    case "wall_panel":
      // Tray panel: shallow folded returns on every edge for a flush mount.
      return {
        cornerRadius: 0,
        returnsLinked: true,
        frontReturn: edge(true, 25),
        backUpstand: edge(false, 100),
        backReturn: edge(true, 25),
        leftReturn: edge(true, 25),
        rightReturn: edge(true, 25),
        cutout: { ...NO_CUTOUT },
        splitPosition: null,
        splitDirection: null,
      };
    case "worktop":
    default:
      return {
        cornerRadius: 12,
        returnsLinked: true,
        frontReturn: edge(true, 45),
        backUpstand: edge(true, 100),
        backReturn: edge(false, 45),
        leftReturn: edge(true, 45),
        rightReturn: edge(true, 45),
        cutout: { ...NO_CUTOUT },
        splitPosition: null,
        splitDirection: null,
      };
  }
}

// ─── Per-product options-panel UI spec ────────────────────────────

export interface SurfaceUISpec {
  /** Heading for the edge/returns section. */
  edgeTitle: string;
  /** Heading for the returns group. */
  returnsTitle: string;
  frontLabel: string;
  /** Label for the back edge control (upstand/return). */
  backLabel: string;
  /** Whether a back upstand (wall lip) is offered. */
  showUpstand: boolean;
  /** Whether a sink/well cutout is offered. */
  showCutout: boolean;
  cutoutTitle: string;
  cutoutToggleLabel: string;
  cornerRadiusMax: number;
  /** Depth range (mm) for the folded returns. */
  returnMin: number;
  returnMax: number;
  hint?: string;
}

export function surfaceUISpec(pt: ProductType): SurfaceUISpec {
  switch (pt) {
    case "bar_top":
      return {
        edgeTitle: "Bar Edge & Aprons",
        returnsTitle: "Aprons / Drop",
        frontLabel: "Bar Front",
        backLabel: "Back Apron",
        // Boxed bar top: a back apron (drop), never a wall upstand — offering
        // both on the same edge is physically contradictory.
        showUpstand: false,
        showCutout: true,
        cutoutTitle: "Sink / Well Cutout",
        cutoutToggleLabel: "Add Cutout",
        cornerRadiusMax: 40,
        returnMin: 40,
        returnMax: 150,
        hint: "Aprons form the boxed drop on each side; add a well cutout for a wet bar.",
      };
    case "table_top":
      return {
        edgeTitle: "Table Edge",
        returnsTitle: "Drop Edge",
        frontLabel: "Front",
        backLabel: "Back",
        showUpstand: false,
        showCutout: false,
        cutoutTitle: "",
        cutoutToggleLabel: "",
        cornerRadiusMax: 80,
        returnMin: 20,
        returnMax: 80,
        hint: "A folded drop edge gives the top its thickness; increase the corner radius for softer corners.",
      };
    case "wall_panel":
      return {
        edgeTitle: "Panel Edge",
        returnsTitle: "Panel Returns",
        frontLabel: "Front",
        backLabel: "Top",
        showUpstand: false,
        showCutout: false,
        cutoutTitle: "",
        cutoutToggleLabel: "",
        cornerRadiusMax: 30,
        returnMin: 15,
        returnMax: 60,
        hint: "Tray-style panel: shallow folded returns on every edge sit flush against the wall.",
      };
    case "worktop":
    default:
      return {
        edgeTitle: "Edge Profile",
        returnsTitle: "Returns",
        frontLabel: "Front",
        backLabel: "Back Upstand",
        showUpstand: true,
        showCutout: true,
        cutoutTitle: "Sink Cutout",
        cutoutToggleLabel: "Add Sink Cutout",
        cornerRadiusMax: 50,
        returnMin: 20,
        returnMax: 80,
      };
  }
}
