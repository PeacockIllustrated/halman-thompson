# Flat Sheet Calculator & Flatten View — Design Spec

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this spec task-by-task.

**Goal:** Calculate the true flat metal sheet dimensions for a worktop (including all returns and upstand), show the real gauge thickness in 3D, provide an animated fold/unfold transition to a 2D flatten view, and export the flat pattern as SVG/DXF cut files.

**Architecture:** Flat sheet as derived state. A pure function calculates flat dimensions and bend lines from the existing worktop config. The 3D model uses real gauge thickness. A flatten view mode shows the unfolded pattern with an animated transition. Export generates SVG and DXF from the calculated data.

**Tech Stack:** Three.js + React Three Fiber (3D & animation), Zustand (state), SVG generation (client-side), DXF text format writer (client-side). No new dependencies — animation uses `useFrame` + `THREE.MathUtils.lerp`.

---

## Context

The worktop is fabricated from a single flat metal sheet that gets bent along fold lines. The configurator currently shows a solid 30mm slab, but in reality the metal is 0.7–1.5mm thick. The true flat sheet size determines:

- Whether the piece fits on a single sheet (max 2000mm x 1000mm)
- When multi-panel fabrication is needed
- The actual material cost
- The cut file for fabrication

Cutout returns (sink hole edge rings) are **welded and attached separately** — they are NOT part of the flat sheet.

### Bend Allowance

HT uses a fixed 5mm bend allowance per fold (2.5mm each side of the bend for stretch). This is deducted from the total flat dimensions. All exports include the note: "5mm bend allowance per fold has been applied."

---

## Section 1: Flat Sheet Calculator

A pure function `calculateFlatSheet()` that takes the worktop config, dimensions, and thickness, and returns the complete flat pattern data.

### Function Signature

```typescript
function calculateFlatSheet(
  width: number,        // worktop visible width (mm)
  depth: number,        // worktop visible depth (mm)
  thickness: number,    // metal gauge (mm) — e.g. 0.9
  config: WorktopConfig
): FlatSheet
```

### Types

```typescript
interface BendLine {
  id: string;                         // e.g. "front-return", "back-upstand"
  startX: number;                     // start position on flat sheet (mm)
  startY: number;
  endX: number;                       // end position on flat sheet (mm)
  endY: number;
  direction: "up" | "down";           // fold direction (up = upstand, down = return)
  label: string;                      // e.g. "Front Return Fold"
}

interface FlatSegment {
  id: string;                         // e.g. "main-surface", "front-return"
  label: string;                      // human-readable label
  x: number;                          // position on flat sheet (mm)
  y: number;
  width: number;                      // segment width (mm)
  height: number;                     // segment height (mm)
}

interface FlatSheet {
  // Total flat dimensions (mm) after bend allowance
  totalWidth: number;
  totalHeight: number;

  // Metal gauge (mm) — for export annotations
  thickness: number;

  // Individual segments with positions on the flat sheet
  segments: FlatSegment[];

  // Bend lines with positions and directions
  bendLines: BendLine[];

  // Panel split
  requiresSplit: boolean;
  splitPosition: number | null;
  splitDirection: "horizontal" | "vertical" | null;

  // Bend allowance
  bendAllowanceMm: number;               // 5 (constant)
  bendCount: number;                      // number of folds
  totalBendDeduction: number;             // 5mm x number of bends
}
```

### Flat Layout Logic

The flat sheet is laid out as a **cross shape** when unfolded. The main surface is the centre rectangle. Returns and upstand extend outward from the edges of the main surface.

**Cross-shape constraint:** Side returns (left/right) span only the main surface depth — they do NOT extend into the front/back return zones. Similarly, front/back returns span only the main surface width — they do NOT extend into the side return zones. This prevents overlapping geometry at the corners of the cross.

```
                 ┌─────────────────────┐
                 │   Back Upstand      │  (width x upstandDepth)
                 │                     │
  ┌──────────────┼─────────────────────┼──────────────┐
  │ Left Return  │   Main Surface      │ Right Return │
  │              │   (width x depth)   │              │
  │ (depth x     │                     │ (depth x     │
  │  returnDepth)│                     │  returnDepth)│
  └──────────────┼─────────────────────┼──────────────┘
                 │   Front Return      │  (width x returnDepth)
                 │                     │
                 └─────────────────────┘
```

**Dimension formulas:**
- `totalWidth = (leftReturn.enabled ? leftReturn.depth : 0) + width + (rightReturn.enabled ? rightReturn.depth : 0) - (bendCount_width * 5)`
- `totalHeight = (frontReturn.enabled ? frontReturn.depth : 0) + depth + (backEdgeDepth) - (bendCount_height * 5)`
- Where `backEdgeDepth = backUpstand.enabled ? backUpstand.depth : backReturn.enabled ? backReturn.depth : 0`
- `bendCount_width` = number of enabled side returns (0, 1, or 2)
- `bendCount_height` = number of enabled front/back edges (0, 1, or 2)

**Segment dimensions:**
- Main surface: `width x depth`
- Front return: `width x frontReturn.depth` (same width as main surface)
- Back upstand/return: `width x backEdge.depth` (same width as main surface)
- Left return: `leftReturn.depth x depth` (same depth as main surface, NOT including front/back)
- Right return: `rightReturn.depth x depth` (same depth as main surface, NOT including front/back)

### File Location

- `src/lib/worktop/flatSheet.ts` — pure function, no React/Three.js dependencies
- `src/lib/worktop/__tests__/flatSheet.test.ts` — unit tests with known input/output pairs

---

## Section 2: Thin-Wall 3D Model

Replace the current solid slab extrusion with true gauge-thickness sheet geometry.

### Changes

- **Remove `SLAB_THICKNESS` constant** (currently 0.3 / 30mm)
- **Remove `METAL_GAUGE` constant** (currently 0.02 / 2mm)
- **Use real thickness from store:** `thickness * SCALE` (e.g. 0.9mm -> 0.009 scene units)
- The worktop becomes a thin shell rather than a solid block
- **Add `thickness` to `WorktopModelProps`** — threaded through from `ProductViewer.tsx`

### Props Change

```typescript
interface WorktopModelProps {
  width: number;
  depth: number;
  thickness: number;    // NEW — metal gauge in mm
  baseMetal: MetalType;
  isAged: boolean;
  config: WorktopConfig;
}
```

### Geometry

Each segment (main surface, returns, upstand) is a thin strip extruded by the gauge thickness:

- **Main surface:** width x depth rectangle, extruded by gauge thickness
- **Front return:** width x returnDepth strip, rotated 90 degrees down at front edge
- **Back upstand:** width x upstandHeight strip, rotated 90 degrees up at back edge
- **Back return:** width x returnDepth strip, rotated 90 degrees down at back edge (when upstand disabled)
- **Left/right returns:** depth x returnDepth strips, rotated 90 degrees down at side edges
- **Cutout returns:** separate welded pieces (unchanged, not part of sheet)

Each segment is a **separate mesh** (important for the fold animation — each pivots independently around its bend line).

### Visual Impact

The worktop will look like a real bent metal sheet — thin profile visible from the side, hollow interior visible at edges. This is accurate to the actual fabricated product.

### File Changes

- `src/components/three/WorktopModel.tsx` — major rework of geometry building, dynamic gauge thickness
- `src/components/three/ProductViewer.tsx` — pass `thickness` from store to `WorktopModel`

---

## Section 3: Flatten View & Animated Transition

### View Modes

Extend `ViewMode` type by adding `"flat"` to the existing union: `"3d" | "front" | "side" | "room" | "flat"`. A toggle button in the UI switches between 3D and flat.

### Flatten View (2D)

When in flat mode:

- **Camera:** Top-down orthographic, looking straight down at the unfolded sheet
- **Layout:** The flat pattern rendered showing:
  - Labelled regions (main surface, front return, back upstand, etc.)
  - Dimensions on each segment
  - Dashed bend lines with fold direction indicators (mountain/valley arrows)
  - Overall total dimensions on the outside edges
  - Note: "5mm bend allowance per fold has been applied"
- **Panel split:** If the sheet requires a split, a draggable split line that the user can reposition
- **Panel indicators:** "Panel 1 of 2" labels on each side of the split

### Animated Fold/Unfold Transition

When toggling between 3D and flat:

1. Each return/upstand segment animates from its folded position (90 degrees) to flat (0 degrees) or vice versa
2. Each segment pivots around its bend line
3. Camera simultaneously transitions from perspective orbit to top-down view
4. Duration: ~0.8 seconds with ease-in-out timing
5. All segments fold/unfold simultaneously

### Animation Implementation

Uses `useFrame` + `THREE.MathUtils.lerp` (no new dependencies). A `foldProgress` ref (0 = flat, 1 = fully folded) is interpolated each frame toward the target value based on `viewMode`.

Each segment's rotation is derived from `foldProgress`:
- Front return: rotates `-foldProgress * Math.PI/2` around front edge X axis
- Back upstand: rotates `+foldProgress * Math.PI/2` around back edge X axis
- Side returns: rotate `-foldProgress * Math.PI/2` around their respective Z axes

### Camera Transition

Animate the perspective camera to a fixed top-down position with a very narrow FOV to approximate orthographic. At the end of the transition, swap to a true orthographic camera. On return to 3D, reverse the process. This avoids the problem of smoothly interpolating between camera projection types.

- In flat mode: disable orbit, enable pan/zoom only
- In 3D mode: re-enable orbit controls

### Draggable Split Line

Implemented as an **HTML overlay** positioned on top of the canvas (not raycasting in 3D). This is simpler and more reliable for 2D interaction in the flat/orthographic view. The overlay converts pixel coordinates to mm using the camera's projection.

### File Changes

- `src/components/three/WorktopModel.tsx` — fold animation logic, segment pivot points
- `src/components/three/ProductViewer.tsx` — camera transition, viewMode-aware controls
- `src/components/three/SceneEnvironment.tsx` — orbit controls viewMode-aware (orbit in 3D, pan in flat)
- `src/components/configurator/ViewModeToggle.tsx` — new component, 3D/Flat toggle button
- `src/components/configurator/SplitLineOverlay.tsx` — new component, draggable split line HTML overlay

---

## Section 4: Export (SVG & DXF)

### SVG Export

Generated client-side from the `FlatSheet` data:

- Clean vector paths for: outline, bend lines (dashed), cutout hole, split line
- Labelled dimensions as text elements
- Colour coding:
  - Outline: black
  - Bend lines: red dashed
  - Cutout: blue
  - Split line: green dashed
- Note at bottom: "5mm bend allowance per fold applied"
- Filename: `HT-{finishName}-{width}x{depth}-flat.svg`

### DXF Export

Same geometry as SVG in DXF format for CAD/CNC software:

- Layers: `OUTLINE`, `BEND_LINES`, `CUTOUT`, `SPLIT_LINE`, `DIMENSIONS`, `NOTES`
- 2D lines/arcs only (DXF for 2D is a simple text format)
- Lightweight writer — hand-rolled, no heavy CAD dependency
- Filename: `HT-{finishName}-{width}x{depth}-flat.dxf`

### UI

- Download button visible only in flatten view
- Dropdown: "Export SVG" / "Export DXF"

### File Changes

- `src/lib/worktop/exportSvg.ts` — SVG generation from FlatSheet data
- `src/lib/worktop/exportDxf.ts` — DXF generation from FlatSheet data
- `src/components/configurator/ExportButton.tsx` — new component, export dropdown button

---

## Section 5: Panel Split Logic

### Replaces Current `calculatePanelLayout`

The existing function in `configurator.ts` (lines 37-78) divides evenly by visible surface dimensions. The new logic uses **flat sheet dimensions** instead.

### Behaviour

- Auto-detect: split needed when `flatSheet.totalWidth > 2000mm` or `flatSheet.totalHeight > 1000mm`
- Auto-suggest split at midpoint when first detected
- In flatten view: split line is **draggable** by the user (HTML overlay, see Section 3)
- Constraints:
  - Split must be at least 200mm from either edge
  - Split must not coincide with a bend line (maintain at least 20mm clearance from any bend)
- Split direction auto-determined:
  - `totalWidth > 2000` → vertical split
  - `totalHeight > 1000` → horizontal split
  - Both exceed → vertical split (more common), user can toggle

### Storage

Split state stored in `worktopConfig`:
```typescript
splitPosition: number | null;    // mm from left edge (vertical) or top edge (horizontal)
splitDirection: "horizontal" | "vertical" | null;
```

### Pricing

- Panel surcharge remains £50 per additional panel
- Material area for pricing uses flat sheet `totalWidth x totalHeight` (actual material used)
- MVP supports a single split (max 2 panels). Multi-split can be added in a future iteration if needed.

### Display

- Both panels shown in flatten view with a visual gap
- Each panel labelled with index and dimensions
- Panel count shown in price breakdown

---

## Section 6: Store & State Changes

### Updated Types

```typescript
// ViewMode — add "flat" to existing union
export type ViewMode = "3d" | "front" | "side" | "room" | "flat";

// WorktopConfig gains split state
export interface WorktopConfig {
  // ... existing fields (cornerRadius, frontReturn, backUpstand, etc.) ...
  splitPosition: number | null;
  splitDirection: "horizontal" | "vertical" | null;
}
```

### New Derived State

`flatSheet` — the full `FlatSheet` object, recalculated as a selector whenever width, depth, thickness, or worktopConfig changes. Exposed from the store as a computed value.

### Panel Layout

The existing `calculatePanelLayout()` function is replaced. Panel sizing now derives from flat sheet dimensions (including returns/upstand/bend allowance), not just the visible surface.

### Pricing Update

The pricing API request gains two new optional fields for worktops:

```typescript
interface PricingRequest {
  // ... existing fields ...
  flatWidth?: number;   // flat sheet totalWidth (mm) — worktops only
  flatHeight?: number;  // flat sheet totalHeight (mm) — worktops only
}
```

When `flatWidth` and `flatHeight` are provided, the pricing engine uses these for area calculation instead of `width x height`. This is backwards-compatible — splashbacks and other products continue using `width x height`.

### Default Config Update

```typescript
const DEFAULT_WORKTOP_CONFIG: WorktopConfig = {
  // ... existing fields ...
  splitPosition: null,
  splitDirection: null,
};
```

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/worktop/flatSheet.ts` | Create | Pure flat sheet calculator function |
| `src/lib/worktop/__tests__/flatSheet.test.ts` | Create | Unit tests for flat sheet calculator |
| `src/lib/worktop/exportSvg.ts` | Create | SVG export from FlatSheet data |
| `src/lib/worktop/exportDxf.ts` | Create | DXF export from FlatSheet data |
| `src/components/three/WorktopModel.tsx` | Major rework | Thin-wall geometry, fold animation, segment pivots |
| `src/components/three/ProductViewer.tsx` | Modify | Pass thickness, camera transitions, viewMode handling |
| `src/components/three/SceneEnvironment.tsx` | Modify | ViewMode-aware orbit/pan controls |
| `src/components/configurator/ViewModeToggle.tsx` | Create | 3D/Flat toggle button |
| `src/components/configurator/SplitLineOverlay.tsx` | Create | Draggable split line HTML overlay |
| `src/components/configurator/ExportButton.tsx` | Create | Export dropdown (SVG/DXF) |
| `src/components/configurator/WorktopOptions.tsx` | Modify | Add split line controls |
| `src/stores/configurator.ts` | Modify | New viewMode, flatSheet derived state, replace panel layout |
| `src/types/index.ts` | Modify | New types (FlatSheet, BendLine, FlatSegment), updated WorktopConfig, ViewMode |
| `src/lib/pricing/engine.ts` | Modify | Use flat sheet area for worktop material cost |
| `src/app/api/pricing/calculate/route.ts` | Modify | Accept flatWidth/flatHeight fields |

---

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Flat sheet as derived state | Clean separation, testable, keeps 3D and flat in sync |
| Cutout returns | Welded separately, excluded from flat sheet | Per HT fabrication process |
| Bend allowance | Fixed 5mm per bend (2.5mm each side) | HT standard, simpler than K-factor |
| Metal thickness in 3D | True to life (actual gauge) | Authentic representation of fabricated product |
| Fold animation | `useFrame` + `lerp`, no new deps | Keeps bundle small, R3F already provides everything needed |
| Camera transition | Animate to top-down then swap to ortho | Avoids the perspective↔orthographic interpolation problem |
| Export formats | SVG + DXF | SVG for visual, DXF for CNC/CAD |
| Panel split | User-draggable HTML overlay | Simpler than 3D raycasting for 2D interaction |
| Split scope | Single split max (MVP) | Covers vast majority of cases, multi-split later if needed |
| Split constraints | 200mm from edge + 20mm from bend lines | Prevents impractical offcuts and interference with folds |
| Cross-shape layout | Returns don't overlap at corners | Front/back span main width, sides span main depth only |
