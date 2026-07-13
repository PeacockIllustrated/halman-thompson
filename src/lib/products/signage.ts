// ─── HT Fabrication Visualiser — Signage metadata ─────────────────
// Font + fabrication-method definitions shared by the signage 3D model
// and its options panel.

import type { FabricationMethod } from "@/types";

export interface SignageFont {
  id: string;
  label: string;
  /** Public URL of a font file troika-three-text can load (.otf/.ttf/.woff). */
  url: string;
}

// Only fonts shipped under /public/fonts are offered so the preview renders
// without any external font fetch.
export const SIGNAGE_FONTS: SignageFont[] = [
  { id: "serif", label: "Cinzel", url: "/fonts/Cinzel-Regular.otf" },
  { id: "serif-bold", label: "Cinzel Bold", url: "/fonts/Cinzel-Bold.otf" },
];

export function signageFontUrl(id: string): string {
  return (SIGNAGE_FONTS.find((f) => f.id === id) ?? SIGNAGE_FONTS[0]).url;
}

export interface FabricationMethodDef {
  id: FabricationMethod;
  label: string;
  description: string;
  /** Labour multiplier applied on top of the signage product labour. */
  labour: number;
}

// Signage fabrication methods (flat_sheet is not a signage method).
export const SIGNAGE_METHODS: FabricationMethodDef[] = [
  {
    id: "engraved",
    label: "Engraved",
    description: "Lettering cut as a recess into the metal face.",
    labour: 1.0,
  },
  {
    id: "etched",
    label: "Etched",
    description: "Shallow acid-etched detail with a matte finish.",
    labour: 0.9,
  },
  {
    id: "laser_cut",
    label: "Laser Cut",
    description: "Letters cut cleanly through the sheet.",
    labour: 1.15,
  },
  {
    id: "3d_effect",
    label: "3D Raised",
    description: "Built-up raised lettering standing proud of the face.",
    labour: 1.35,
  },
];

export function signageMethod(id: FabricationMethod): FabricationMethodDef {
  return SIGNAGE_METHODS.find((m) => m.id === id) ?? SIGNAGE_METHODS[0];
}
