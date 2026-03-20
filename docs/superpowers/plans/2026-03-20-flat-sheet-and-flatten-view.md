# Flat Sheet Calculator & Flatten View — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Calculate true flat metal sheet dimensions for worktops, show real gauge thickness in 3D, animated fold/unfold to a 2D flatten view, and export SVG/DXF cut files.

**Architecture:** Pure `calculateFlatSheet()` function as derived state. 3D model uses real gauge thickness with separate meshes per segment. Animation interpolates fold angles via `useFrame` + `lerp`. SVG/DXF export from flat sheet data.

**Tech Stack:** Next.js 14, Three.js + React Three Fiber, Zustand, TypeScript, pnpm

**Spec:** `docs/superpowers/specs/2026-03-20-flat-sheet-and-flatten-view-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/index.ts` | Modify | Add FlatSheet, BendLine, FlatSegment types; update WorktopConfig, ViewMode |
| `src/lib/worktop/flatSheet.ts` | Create | Pure flat sheet calculator — dimensions, segments, bend lines |
| `src/lib/worktop/__tests__/flatSheet.test.ts` | Create | Unit tests for flat sheet calculator |
| `src/lib/worktop/exportSvg.ts` | Create | SVG string generation from FlatSheet data |
| `src/lib/worktop/exportDxf.ts` | Create | DXF string generation from FlatSheet data |
| `src/stores/configurator.ts` | Modify | Add flatSheet derived state, replace panel layout, update defaults |
| `src/components/three/WorktopModel.tsx` | Major rework | Thin-wall geometry, separate meshes per segment, fold animation |
| `src/components/three/ProductViewer.tsx` | Modify | Pass thickness, camera transitions for flat mode |
| `src/components/three/SceneEnvironment.tsx` | Modify | ViewMode-aware controls (orbit vs pan) |
| `src/components/configurator/ViewModeToggle.tsx` | Create | 3D/Flat toggle button |
| `src/components/configurator/SplitLineOverlay.tsx` | Create | Draggable split line HTML overlay |
| `src/components/configurator/ExportButton.tsx` | Create | Export dropdown (SVG/DXF download) |
| `src/components/configurator/WorktopOptions.tsx` | Modify | Wire up split controls |
| `src/lib/pricing/engine.ts` | Modify | Use flat sheet area for worktop pricing |
| `src/app/api/pricing/calculate/route.ts` | Modify | Accept flatWidth/flatHeight |

---

### Task 1: Types & Flat Sheet Calculator

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/lib/worktop/flatSheet.ts`
- Create: `src/lib/worktop/__tests__/flatSheet.test.ts`

- [ ] **Step 1: Add new types to `src/types/index.ts`**

Add `BendLine`, `FlatSegment`, and `FlatSheet` interfaces. Update `ViewMode` to include `"flat"`. Add `splitPosition` and `splitDirection` to `WorktopConfig`.

```typescript
// Add to ViewMode (line 54)
export type ViewMode = "3d" | "front" | "side" | "room" | "flat";

// Add after CutoutConfig interface
export interface BendLine {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  direction: "up" | "down";
  label: string;
}

export interface FlatSegment {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FlatSheet {
  totalWidth: number;
  totalHeight: number;
  thickness: number;
  segments: FlatSegment[];
  bendLines: BendLine[];
  requiresSplit: boolean;
  splitPosition: number | null;
  splitDirection: "horizontal" | "vertical" | null;
  bendAllowanceMm: number;
  bendCount: number;
  totalBendDeduction: number;
}

// Update WorktopConfig — add these two fields:
export interface WorktopConfig {
  // ... existing fields ...
  splitPosition: number | null;
  splitDirection: "horizontal" | "vertical" | null;
}
```

- [ ] **Step 2: Write failing tests for flat sheet calculator**

Create `src/lib/worktop/__tests__/flatSheet.test.ts`:

```typescript
import { calculateFlatSheet } from "../flatSheet";
import type { WorktopConfig } from "@/types";

const BASE_CONFIG: WorktopConfig = {
  cornerRadius: 12,
  frontReturn: { enabled: true, depth: 45 },
  backUpstand: { enabled: true, depth: 100 },
  backReturn: { enabled: false, depth: 45 },
  leftReturn: { enabled: false, depth: 45 },
  rightReturn: { enabled: false, depth: 45 },
  cutout: {
    enabled: false,
    shape: "rectangle",
    width: 450,
    depth: 350,
    offsetX: 0,
    offsetZ: 0,
    returns: { enabled: true, depth: 30 },
  },
  splitPosition: null,
  splitDirection: null,
};

describe("calculateFlatSheet", () => {
  test("basic worktop with front return and back upstand", () => {
    // 900mm wide, 600mm deep, 0.9mm thick
    // Front return: 45mm, Back upstand: 100mm
    // 2 bends (front + back) = 10mm deduction
    // totalWidth = 900 (no side returns)
    // totalHeight = 45 + 600 + 100 - 10 = 735
    const result = calculateFlatSheet(900, 600, 0.9, BASE_CONFIG);

    expect(result.totalWidth).toBe(900);
    expect(result.totalHeight).toBe(735);
    expect(result.thickness).toBe(0.9);
    expect(result.bendCount).toBe(2);
    expect(result.totalBendDeduction).toBe(10);
    expect(result.bendAllowanceMm).toBe(5);
    expect(result.requiresSplit).toBe(false);
  });

  test("worktop with all four returns (no upstand)", () => {
    const config: WorktopConfig = {
      ...BASE_CONFIG,
      backUpstand: { enabled: false, depth: 100 },
      backReturn: { enabled: true, depth: 45 },
      leftReturn: { enabled: true, depth: 45 },
      rightReturn: { enabled: true, depth: 45 },
    };
    // totalWidth = 45 + 900 + 45 - 10 = 980 (2 side bends)
    // totalHeight = 45 + 600 + 45 - 10 = 680 (2 front/back bends)
    const result = calculateFlatSheet(900, 600, 0.9, config);

    expect(result.totalWidth).toBe(980);
    expect(result.totalHeight).toBe(680);
    expect(result.bendCount).toBe(4);
    expect(result.totalBendDeduction).toBe(20);
  });

  test("worktop with no returns or upstand", () => {
    const config: WorktopConfig = {
      ...BASE_CONFIG,
      frontReturn: { enabled: false, depth: 45 },
      backUpstand: { enabled: false, depth: 100 },
    };
    const result = calculateFlatSheet(900, 600, 0.9, config);

    expect(result.totalWidth).toBe(900);
    expect(result.totalHeight).toBe(600);
    expect(result.bendCount).toBe(0);
    expect(result.totalBendDeduction).toBe(0);
  });

  test("segments are correctly positioned in cross shape", () => {
    const config: WorktopConfig = {
      ...BASE_CONFIG,
      leftReturn: { enabled: true, depth: 45 },
    };
    // Left return + front return + back upstand
    const result = calculateFlatSheet(900, 600, 0.9, config);

    // Main surface should be offset by left return depth
    const main = result.segments.find((s) => s.id === "main-surface");
    expect(main).toBeDefined();
    expect(main!.x).toBe(45); // offset by left return
    expect(main!.width).toBe(900);
    expect(main!.height).toBe(600);

    // Left return spans main surface depth only (not front/back)
    const left = result.segments.find((s) => s.id === "left-return");
    expect(left).toBeDefined();
    expect(left!.width).toBe(45);
    expect(left!.height).toBe(600); // same as main depth

    // Front return spans main surface width only (not side returns)
    const front = result.segments.find((s) => s.id === "front-return");
    expect(front).toBeDefined();
    expect(front!.width).toBe(900); // same as main width
  });

  test("bend lines have correct start/end positions", () => {
    const result = calculateFlatSheet(900, 600, 0.9, BASE_CONFIG);

    const frontBend = result.bendLines.find((b) => b.id === "front-return");
    expect(frontBend).toBeDefined();
    expect(frontBend!.direction).toBe("down");

    const backBend = result.bendLines.find((b) => b.id === "back-upstand");
    expect(backBend).toBeDefined();
    expect(backBend!.direction).toBe("up");
  });

  test("requires split when flat sheet exceeds max dimensions", () => {
    // 1800mm wide + 45 left + 45 right - 10 = 1880 < 2000 — no split
    const config: WorktopConfig = {
      ...BASE_CONFIG,
      leftReturn: { enabled: true, depth: 45 },
      rightReturn: { enabled: true, depth: 45 },
    };
    const noSplit = calculateFlatSheet(1800, 600, 0.9, config);
    expect(noSplit.requiresSplit).toBe(false);

    // 1950mm wide + 45 + 45 - 10 = 2030 > 2000 — needs split
    const needsSplit = calculateFlatSheet(1950, 600, 0.9, config);
    expect(needsSplit.requiresSplit).toBe(true);
    expect(needsSplit.splitDirection).toBe("vertical");
  });

  test("requires split on height when totalHeight exceeds 1000mm", () => {
    // 600mm depth + 45 front + 400 upstand - 10 = 1035 > 1000
    const config: WorktopConfig = {
      ...BASE_CONFIG,
      backUpstand: { enabled: true, depth: 400 },
    };
    const result = calculateFlatSheet(900, 600, 0.9, config);
    expect(result.requiresSplit).toBe(true);
    expect(result.splitDirection).toBe("horizontal");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm exec vitest run src/lib/worktop/__tests__/flatSheet.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Implement `calculateFlatSheet`**

Create `src/lib/worktop/flatSheet.ts`:

```typescript
import type { WorktopConfig, FlatSheet, FlatSegment, BendLine } from "@/types";

const BEND_ALLOWANCE_MM = 5; // 2.5mm each side of bend for stretch
const MAX_SHEET_WIDTH = 2000;
const MAX_SHEET_HEIGHT = 1000;

export function calculateFlatSheet(
  width: number,
  depth: number,
  thickness: number,
  config: WorktopConfig
): FlatSheet {
  const segments: FlatSegment[] = [];
  const bendLines: BendLine[] = [];

  // Determine which edges are active
  const hasLeft = config.leftReturn.enabled;
  const hasRight = config.rightReturn.enabled;
  const hasFront = config.frontReturn.enabled;
  const hasBack = config.backUpstand.enabled || config.backReturn.enabled;

  const leftDepth = hasLeft ? config.leftReturn.depth : 0;
  const rightDepth = hasRight ? config.rightReturn.depth : 0;
  const frontDepth = hasFront ? config.frontReturn.depth : 0;
  const backDepth = config.backUpstand.enabled
    ? config.backUpstand.depth
    : config.backReturn.enabled
      ? config.backReturn.depth
      : 0;

  // Count bends
  const bendCountWidth = (hasLeft ? 1 : 0) + (hasRight ? 1 : 0);
  const bendCountHeight = (hasFront ? 1 : 0) + (hasBack ? 1 : 0);
  const bendCount = bendCountWidth + bendCountHeight;
  const totalBendDeduction = bendCount * BEND_ALLOWANCE_MM;

  // Total flat dimensions
  const totalWidth =
    leftDepth + width + rightDepth - bendCountWidth * BEND_ALLOWANCE_MM;
  const totalHeight =
    frontDepth + depth + backDepth - bendCountHeight * BEND_ALLOWANCE_MM;

  // ── Segment positions ──
  // Main surface origin (top-left corner on the flat sheet)
  const mainX = leftDepth;
  const mainY = backDepth; // back is at top of flat sheet

  // Main surface
  segments.push({
    id: "main-surface",
    label: "Main Surface",
    x: mainX,
    y: mainY,
    width,
    height: depth,
  });

  // Front return (below main surface, same width)
  if (hasFront) {
    segments.push({
      id: "front-return",
      label: "Front Return",
      x: mainX,
      y: mainY + depth,
      width,
      height: frontDepth,
    });
  }

  // Back upstand or return (above main surface, same width)
  if (hasBack) {
    const label = config.backUpstand.enabled ? "Back Upstand" : "Back Return";
    segments.push({
      id: config.backUpstand.enabled ? "back-upstand" : "back-return",
      label,
      x: mainX,
      y: 0,
      width,
      height: backDepth,
    });
  }

  // Left return (left of main surface, spans main depth only)
  if (hasLeft) {
    segments.push({
      id: "left-return",
      label: "Left Return",
      x: 0,
      y: mainY,
      width: leftDepth,
      height: depth,
    });
  }

  // Right return (right of main surface, spans main depth only)
  if (hasRight) {
    segments.push({
      id: "right-return",
      label: "Right Return",
      x: mainX + width,
      y: mainY,
      width: rightDepth,
      height: depth,
    });
  }

  // ── Bend lines ──
  if (hasFront) {
    bendLines.push({
      id: "front-return",
      startX: mainX,
      startY: mainY + depth,
      endX: mainX + width,
      endY: mainY + depth,
      direction: "down",
      label: "Front Return Fold",
    });
  }

  if (hasBack) {
    bendLines.push({
      id: config.backUpstand.enabled ? "back-upstand" : "back-return",
      startX: mainX,
      startY: mainY,
      endX: mainX + width,
      endY: mainY,
      direction: config.backUpstand.enabled ? "up" : "down",
      label: config.backUpstand.enabled
        ? "Back Upstand Fold"
        : "Back Return Fold",
    });
  }

  if (hasLeft) {
    bendLines.push({
      id: "left-return",
      startX: mainX,
      startY: mainY,
      endX: mainX,
      endY: mainY + depth,
      direction: "down",
      label: "Left Return Fold",
    });
  }

  if (hasRight) {
    bendLines.push({
      id: "right-return",
      startX: mainX + width,
      startY: mainY,
      endX: mainX + width,
      endY: mainY + depth,
      direction: "down",
      label: "Right Return Fold",
    });
  }

  // ── Split detection ──
  let requiresSplit = false;
  let splitDirection: "horizontal" | "vertical" | null =
    config.splitDirection ?? null;
  let splitPosition: number | null = config.splitPosition ?? null;

  if (totalWidth > MAX_SHEET_WIDTH || totalHeight > MAX_SHEET_HEIGHT) {
    requiresSplit = true;
    if (!splitDirection) {
      splitDirection =
        totalWidth > MAX_SHEET_WIDTH ? "vertical" : "horizontal";
    }
    if (splitPosition === null) {
      splitPosition =
        splitDirection === "vertical"
          ? Math.round(totalWidth / 2)
          : Math.round(totalHeight / 2);
    }
  }

  return {
    totalWidth,
    totalHeight,
    thickness,
    segments,
    bendLines,
    requiresSplit,
    splitPosition,
    splitDirection,
    bendAllowanceMm: BEND_ALLOWANCE_MM,
    bendCount,
    totalBendDeduction,
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm exec vitest run src/lib/worktop/__tests__/flatSheet.test.ts`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/lib/worktop/flatSheet.ts src/lib/worktop/__tests__/flatSheet.test.ts
git commit -m "feat: add flat sheet calculator with types and tests"
```

---

### Task 2: Store Updates — Flat Sheet Derived State & Config

**Files:**
- Modify: `src/stores/configurator.ts`

- [ ] **Step 1: Update DEFAULT_WORKTOP_CONFIG**

Add `splitPosition: null` and `splitDirection: null` to the default config at line 15-31.

- [ ] **Step 2: Add flatSheet derived state**

Import `calculateFlatSheet` and add a `getFlatSheet` getter to the store:

```typescript
import { calculateFlatSheet } from "@/lib/worktop/flatSheet";

// Inside the store, add:
getFlatSheet: () => {
  const s = get();
  if (s.productType !== "worktop") return null;
  return calculateFlatSheet(s.width, s.height, s.thickness, s.worktopConfig);
},
```

Add `getFlatSheet` to the `ConfiguratorState` type in `src/types/index.ts`:

```typescript
getFlatSheet: () => FlatSheet | null;
```

- [ ] **Step 3: Replace `calculatePanelLayout` with flat-sheet-based logic**

Update `setWidth`, `setHeight`, `setThickness`, and `setWorktopConfig` to recalculate panel count from flat sheet dimensions instead of the old `calculatePanelLayout` function. Remove the old function.

```typescript
// Helper — replaces calculatePanelLayout
function panelCountFromFlatSheet(
  width: number,
  height: number,
  thickness: number,
  config: WorktopConfig
): number {
  const flat = calculateFlatSheet(width, height, thickness, config);
  return flat.requiresSplit ? 2 : 1;
}
```

- [ ] **Step 4: Update calculatePrice to send flat dimensions**

In the `calculatePrice` action, when productType is `"worktop"`, include `flatWidth` and `flatHeight` in the API request body:

```typescript
const flat = get().getFlatSheet();
body: JSON.stringify({
  // ... existing fields ...
  ...(flat ? { flatWidth: flat.totalWidth, flatHeight: flat.totalHeight } : {}),
}),
```

- [ ] **Step 5: Verify the app still loads without errors**

Run: `pnpm dev`
Check: configurator loads, worktop mode works, no console errors.

- [ ] **Step 6: Commit**

```bash
git add src/stores/configurator.ts src/types/index.ts
git commit -m "feat: add flat sheet derived state to store, replace panel layout"
```

---

### Task 3: Pricing Engine — Flat Sheet Area

**Files:**
- Modify: `src/lib/pricing/engine.ts`
- Modify: `src/app/api/pricing/calculate/route.ts`

- [ ] **Step 1: Update PricingRequest type**

In `src/lib/pricing/engine.ts` (or wherever PricingRequest is defined), add optional fields:

```typescript
interface PricingRequest {
  // ... existing fields ...
  flatWidth?: number;
  flatHeight?: number;
}
```

- [ ] **Step 2: Use flat dimensions for area when provided**

In the pricing engine's area calculation:

```typescript
const areaM2 = request.flatWidth && request.flatHeight
  ? (request.flatWidth * request.flatHeight) / 1_000_000
  : (request.width * request.height) / 1_000_000;
```

- [ ] **Step 3: Update API route to pass through flat dimensions**

In `src/app/api/pricing/calculate/route.ts`, extract `flatWidth` and `flatHeight` from the request body and pass them to the pricing engine.

- [ ] **Step 4: Verify pricing still works**

Run: `pnpm dev`
Check: select a worktop finish, verify price displays (may change value due to new area calc — that's expected).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pricing/engine.ts src/app/api/pricing/calculate/route.ts
git commit -m "feat: use flat sheet area for worktop pricing"
```

---

### Task 4: Thin-Wall 3D Model

**Files:**
- Modify: `src/components/three/WorktopModel.tsx`
- Modify: `src/components/three/ProductViewer.tsx`

This is the largest task. The WorktopModel needs a major rework to use real gauge thickness and separate meshes per segment (for fold animation later).

- [ ] **Step 1: Add `thickness` to WorktopModelProps**

```typescript
interface WorktopModelProps {
  width: number;
  depth: number;
  thickness: number; // metal gauge in mm
  baseMetal: MetalType;
  isAged: boolean;
  config: WorktopConfig;
}
```

- [ ] **Step 2: Pass thickness from ProductViewer**

In `src/components/three/ProductViewer.tsx`, read `thickness` from the store and pass it to `<WorktopModel>`:

```typescript
const thickness = useConfiguratorStore((s) => s.thickness);
// ...
<WorktopModel
  width={width}
  depth={height}
  thickness={thickness}
  baseMetal={baseMetal}
  isAged={isAged}
  config={worktopConfig}
/>
```

- [ ] **Step 3: Replace SLAB_THICKNESS and METAL_GAUGE with dynamic gauge**

In WorktopModel.tsx, remove the constants:

```typescript
// REMOVE:
// export const SLAB_THICKNESS = 0.3;
// const METAL_GAUGE = 0.02;
```

Inside the component, derive the gauge from props:

```typescript
const gauge = thickness * SCALE; // e.g. 0.9mm -> 0.009 scene units
```

Replace all uses of `SLAB_THICKNESS` with `gauge` and all uses of `METAL_GAUGE` with `gauge`.

- [ ] **Step 4: Rebuild geometry as separate meshes per segment**

Each segment (main surface, front return, back upstand/return, left return, right return) should be its own `<mesh>` within a `<group>`. The main surface is a flat rectangle extruded by `gauge`. Returns are strips extruded by `gauge`, positioned at their fold points.

Key geometry approach for each segment:
- Create a `THREE.Shape` for the segment footprint
- Use `THREE.ExtrudeGeometry` with `depth: gauge`
- Position at the correct fold point
- Rotate to the folded position (90 degrees for returns/upstand)

The cutout hole remains in the main surface shape. Cutout returns remain separate welded meshes (unchanged).

- [ ] **Step 5: Verify the 3D model renders correctly**

Run: `pnpm dev`
Check: worktop renders as a thin sheet, returns/upstand visible as thin bent edges, changing thickness in the configurator updates the visual gauge.

- [ ] **Step 6: Commit**

```bash
git add src/components/three/WorktopModel.tsx src/components/three/ProductViewer.tsx
git commit -m "feat: thin-wall 3D model with real gauge thickness"
```

---

### Task 5: Fold Animation

**Files:**
- Modify: `src/components/three/WorktopModel.tsx`

- [ ] **Step 1: Add foldProgress animation state**

```typescript
import { useFrame } from "@react-three/fiber";

// Inside the component:
const viewMode = useConfiguratorStore((s) => s.viewMode);
const foldRef = useRef(1); // 1 = folded (3D), 0 = flat
const targetFold = viewMode === "flat" ? 0 : 1;

useFrame((_, delta) => {
  const speed = 2.5; // ~0.8s for full transition
  foldRef.current = THREE.MathUtils.lerp(
    foldRef.current,
    targetFold,
    1 - Math.exp(-speed * delta)
  );
  // Update mesh rotations based on foldRef.current
});
```

- [ ] **Step 2: Apply fold rotation to each segment mesh**

Each segment mesh uses a `<group>` positioned at its pivot point (the bend line), with rotation derived from `foldRef.current`:

```typescript
// Front return group — pivots at front edge of main surface
<group position={[0, 0, frontEdgeZ]}>
  <group rotation={[-foldRef.current * Math.PI / 2, 0, 0]}>
    <mesh geometry={frontReturnGeo}>
      <MetalMaterial ... />
    </mesh>
  </group>
</group>

// Back upstand — pivots at back edge, folds up
<group position={[0, 0, backEdgeZ]}>
  <group rotation={[foldRef.current * Math.PI / 2, 0, 0]}>
    <mesh geometry={backUpstandGeo}>
      <MetalMaterial ... />
    </mesh>
  </group>
</group>
```

Use refs on the rotation groups and update them in `useFrame` for performance.

- [ ] **Step 3: Verify fold animation works**

Run: `pnpm dev`
Check: toggling viewMode between "3d" and "flat" in the store (via dev tools or temporary button) smoothly animates the segments folding/unfolding.

- [ ] **Step 4: Commit**

```bash
git add src/components/three/WorktopModel.tsx
git commit -m "feat: fold/unfold animation for worktop segments"
```

---

### Task 6: Camera Transition & View Controls

**Files:**
- Modify: `src/components/three/ProductViewer.tsx`
- Modify: `src/components/three/SceneEnvironment.tsx`

- [ ] **Step 1: Add camera transition logic in ProductViewer**

When `viewMode === "flat"`:
- Animate camera to top-down position: `(0, cameraHeight, 0)` looking at `(0, 0, 0)`
- Increase distance and narrow FOV to approximate orthographic
- Disable orbit, enable pan/zoom only

When `viewMode !== "flat"`:
- Restore normal perspective orbit camera

Use `useFrame` to interpolate camera position/rotation smoothly.

- [ ] **Step 2: Update SceneEnvironment controls**

Make orbit controls viewMode-aware:

```typescript
const viewMode = useConfiguratorStore((s) => s.viewMode);

<OrbitControls
  enableRotate={viewMode !== "flat"}
  enablePan={true}
  enableZoom={true}
/>
```

- [ ] **Step 3: Verify camera transition**

Run: `pnpm dev`
Check: switching to flat mode smoothly transitions camera to top-down, orbit disabled, pan/zoom works.

- [ ] **Step 4: Commit**

```bash
git add src/components/three/ProductViewer.tsx src/components/three/SceneEnvironment.tsx
git commit -m "feat: camera transition between 3D and flat view modes"
```

---

### Task 7: View Mode Toggle UI

**Files:**
- Create: `src/components/configurator/ViewModeToggle.tsx`
- Modify: `src/components/configurator/ConfigSidebar.tsx` (or wherever the sidebar lives)

- [ ] **Step 1: Create ViewModeToggle component**

```typescript
"use client";

import { useConfiguratorStore } from "@/stores/configurator";

export function ViewModeToggle() {
  const { viewMode, setViewMode, productType } = useConfiguratorStore();

  if (productType !== "worktop") return null;

  return (
    <div className="flex gap-1 rounded-lg border border-ht-dark/10 p-1">
      <button
        type="button"
        onClick={() => setViewMode("3d")}
        className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode !== "flat"
            ? "bg-ht-gold text-white"
            : "text-ht-dark/60 hover:bg-ht-dark/5"
        }`}
      >
        3D View
      </button>
      <button
        type="button"
        onClick={() => setViewMode("flat")}
        className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode === "flat"
            ? "bg-ht-gold text-white"
            : "text-ht-dark/60 hover:bg-ht-dark/5"
        }`}
      >
        Flat Pattern
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add ViewModeToggle to the sidebar**

Import and place `<ViewModeToggle />` in the configurator sidebar, above or below the dimension controls.

- [ ] **Step 3: Verify the toggle works end-to-end**

Run: `pnpm dev`
Check: clicking "Flat Pattern" triggers the fold-out animation and camera transition. Clicking "3D View" folds back up.

- [ ] **Step 4: Commit**

```bash
git add src/components/configurator/ViewModeToggle.tsx src/components/configurator/ConfigSidebar.tsx
git commit -m "feat: add 3D/Flat Pattern view mode toggle"
```

---

### Task 8: Flat View Annotations (Labels, Dimensions, Bend Lines)

**Files:**
- Modify: `src/components/three/WorktopModel.tsx` (or create a new `FlatViewAnnotations.tsx`)

- [ ] **Step 1: Add 2D annotations visible only in flat mode**

When `foldProgress` is near 0 (flat), render HTML overlays or Three.js `<Html>` elements from `@react-three/drei` showing:

- Segment labels ("Main Surface", "Front Return", etc.)
- Dimension values on each segment
- Total dimensions on outer edges
- Dashed bend lines (can be `<Line>` elements from drei)
- Direction arrows on bend lines
- Note: "5mm bend allowance per fold has been applied"

Fade annotations in/out based on `foldProgress` (opacity = `1 - foldProgress`).

- [ ] **Step 2: Verify annotations display correctly**

Run: `pnpm dev`
Check: flatten the worktop, labels and dimensions appear, fold back up and they fade out.

- [ ] **Step 3: Commit**

```bash
git add src/components/three/WorktopModel.tsx
git commit -m "feat: flat view annotations — labels, dimensions, bend lines"
```

---

### Task 9: SVG Export

**Files:**
- Create: `src/lib/worktop/exportSvg.ts`

- [ ] **Step 1: Implement SVG generator**

```typescript
import type { FlatSheet } from "@/types";

export function generateSvg(
  flatSheet: FlatSheet,
  finishName: string
): string {
  const padding = 40;
  const svgWidth = flatSheet.totalWidth + padding * 2;
  const svgHeight = flatSheet.totalHeight + padding * 2 + 30; // extra for note

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">\n`;
  svg += `<style>text { font-family: Arial, sans-serif; font-size: 12px; }</style>\n`;

  // Segments (outlines)
  for (const seg of flatSheet.segments) {
    svg += `<rect x="${seg.x + padding}" y="${seg.y + padding}" width="${seg.width}" height="${seg.height}" fill="none" stroke="black" stroke-width="1"/>\n`;
    // Label
    svg += `<text x="${seg.x + padding + seg.width / 2}" y="${seg.y + padding + seg.height / 2}" text-anchor="middle" dominant-baseline="middle" fill="#333">${seg.label}</text>\n`;
    // Dimension
    svg += `<text x="${seg.x + padding + seg.width / 2}" y="${seg.y + padding + seg.height / 2 + 16}" text-anchor="middle" fill="#666" font-size="10">${seg.width}mm × ${seg.height}mm</text>\n`;
  }

  // Bend lines (dashed red)
  for (const bend of flatSheet.bendLines) {
    svg += `<line x1="${bend.startX + padding}" y1="${bend.startY + padding}" x2="${bend.endX + padding}" y2="${bend.endY + padding}" stroke="red" stroke-width="1" stroke-dasharray="8,4"/>\n`;
    // Label
    const mx = (bend.startX + bend.endX) / 2 + padding;
    const my = (bend.startY + bend.endY) / 2 + padding - 8;
    svg += `<text x="${mx}" y="${my}" text-anchor="middle" fill="red" font-size="9">${bend.label} (${bend.direction})</text>\n`;
  }

  // Split line (green dashed)
  if (flatSheet.requiresSplit && flatSheet.splitPosition !== null) {
    if (flatSheet.splitDirection === "vertical") {
      svg += `<line x1="${flatSheet.splitPosition + padding}" y1="${padding}" x2="${flatSheet.splitPosition + padding}" y2="${flatSheet.totalHeight + padding}" stroke="green" stroke-width="1.5" stroke-dasharray="10,5"/>\n`;
    } else {
      svg += `<line x1="${padding}" y1="${flatSheet.splitPosition + padding}" x2="${flatSheet.totalWidth + padding}" y2="${flatSheet.splitPosition + padding}" stroke="green" stroke-width="1.5" stroke-dasharray="10,5"/>\n`;
    }
  }

  // Total dimensions
  svg += `<text x="${svgWidth / 2}" y="${padding - 10}" text-anchor="middle" fill="black" font-size="14" font-weight="bold">${flatSheet.totalWidth}mm</text>\n`;
  svg += `<text x="${padding - 10}" y="${padding + flatSheet.totalHeight / 2}" text-anchor="middle" fill="black" font-size="14" font-weight="bold" transform="rotate(-90, ${padding - 10}, ${padding + flatSheet.totalHeight / 2})">${flatSheet.totalHeight}mm</text>\n`;

  // Note
  svg += `<text x="${svgWidth / 2}" y="${svgHeight - 8}" text-anchor="middle" fill="#999" font-size="10">5mm bend allowance per fold has been applied | ${finishName} | ${flatSheet.thickness}mm gauge</text>\n`;

  svg += `</svg>`;
  return svg;
}

export function downloadSvg(flatSheet: FlatSheet, finishName: string, width: number, depth: number) {
  const svg = generateSvg(flatSheet, finishName);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `HT-${finishName}-${width}x${depth}-flat.svg`;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Verify SVG generation with a manual test**

Temporarily call `generateSvg()` with known data in the browser console or a test, verify the SVG renders correctly when opened in a browser.

- [ ] **Step 3: Commit**

```bash
git add src/lib/worktop/exportSvg.ts
git commit -m "feat: SVG export for flat sheet pattern"
```

---

### Task 10: DXF Export

**Files:**
- Create: `src/lib/worktop/exportDxf.ts`

- [ ] **Step 1: Implement DXF generator**

DXF for 2D lines is a simple text format. Generate entities on named layers.

```typescript
import type { FlatSheet } from "@/types";

function dxfHeader(): string {
  return `0\nSECTION\n2\nHEADER\n0\nENDSEC\n`;
}

function dxfTables(): string {
  // Define layers
  let s = `0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n`;
  const layers = [
    { name: "OUTLINE", color: 7 },      // white/black
    { name: "BEND_LINES", color: 1 },    // red
    { name: "CUTOUT", color: 5 },        // blue
    { name: "SPLIT_LINE", color: 3 },    // green
    { name: "DIMENSIONS", color: 8 },    // grey
    { name: "NOTES", color: 8 },
  ];
  for (const l of layers) {
    s += `0\nLAYER\n2\n${l.name}\n70\n0\n62\n${l.color}\n6\nCONTINUOUS\n`;
  }
  s += `0\nENDTAB\n0\nENDSEC\n`;
  return s;
}

function dxfLine(layer: string, x1: number, y1: number, x2: number, y2: number): string {
  return `0\nLINE\n8\n${layer}\n10\n${x1}\n20\n${y1}\n30\n0\n11\n${x2}\n21\n${y2}\n31\n0\n`;
}

function dxfRect(layer: string, x: number, y: number, w: number, h: number): string {
  return (
    dxfLine(layer, x, y, x + w, y) +
    dxfLine(layer, x + w, y, x + w, y + h) +
    dxfLine(layer, x + w, y + h, x, y + h) +
    dxfLine(layer, x, y + h, x, y)
  );
}

function dxfText(layer: string, x: number, y: number, height: number, text: string): string {
  return `0\nTEXT\n8\n${layer}\n10\n${x}\n20\n${y}\n30\n0\n40\n${height}\n1\n${text}\n`;
}

export function generateDxf(flatSheet: FlatSheet, finishName: string): string {
  let entities = `0\nSECTION\n2\nENTITIES\n`;

  // Segments
  for (const seg of flatSheet.segments) {
    entities += dxfRect("OUTLINE", seg.x, seg.y, seg.width, seg.height);
    entities += dxfText("DIMENSIONS", seg.x + seg.width / 2, seg.y + seg.height / 2, 8, `${seg.label} ${seg.width}x${seg.height}`);
  }

  // Bend lines
  for (const bend of flatSheet.bendLines) {
    entities += dxfLine("BEND_LINES", bend.startX, bend.startY, bend.endX, bend.endY);
  }

  // Split line
  if (flatSheet.requiresSplit && flatSheet.splitPosition !== null) {
    if (flatSheet.splitDirection === "vertical") {
      entities += dxfLine("SPLIT_LINE", flatSheet.splitPosition, 0, flatSheet.splitPosition, flatSheet.totalHeight);
    } else {
      entities += dxfLine("SPLIT_LINE", 0, flatSheet.splitPosition, flatSheet.totalWidth, flatSheet.splitPosition);
    }
  }

  // Note
  entities += dxfText("NOTES", 0, -20, 6, `5mm bend allowance per fold applied | ${finishName} | ${flatSheet.thickness}mm gauge`);

  entities += `0\nENDSEC\n`;

  return dxfHeader() + dxfTables() + entities + `0\nEOF\n`;
}

export function downloadDxf(flatSheet: FlatSheet, finishName: string, width: number, depth: number) {
  const dxf = generateDxf(flatSheet, finishName);
  const blob = new Blob([dxf], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `HT-${finishName}-${width}x${depth}-flat.dxf`;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/worktop/exportDxf.ts
git commit -m "feat: DXF export for flat sheet pattern"
```

---

### Task 11: Export Button UI

**Files:**
- Create: `src/components/configurator/ExportButton.tsx`
- Modify: `src/components/configurator/ConfigSidebar.tsx`

- [ ] **Step 1: Create ExportButton component**

```typescript
"use client";

import { useState } from "react";
import { useConfiguratorStore } from "@/stores/configurator";
import { downloadSvg } from "@/lib/worktop/exportSvg";
import { downloadDxf } from "@/lib/worktop/exportDxf";

export function ExportButton() {
  const { viewMode, productType, width, height, selectedFinish, getFlatSheet } =
    useConfiguratorStore();
  const [open, setOpen] = useState(false);

  if (productType !== "worktop" || viewMode !== "flat") return null;

  const flatSheet = getFlatSheet();
  if (!flatSheet) return null;

  const finishName = selectedFinish?.name ?? "Custom";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full rounded-lg bg-ht-dark px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ht-dark/90"
      >
        Export Cut File
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-full rounded-lg border border-ht-dark/10 bg-white p-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              downloadSvg(flatSheet, finishName, width, height);
              setOpen(false);
            }}
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-ht-dark/5"
          >
            Export SVG
          </button>
          <button
            type="button"
            onClick={() => {
              downloadDxf(flatSheet, finishName, width, height);
              setOpen(false);
            }}
            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-ht-dark/5"
          >
            Export DXF
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add ExportButton to sidebar**

Import and place below the ViewModeToggle in the sidebar.

- [ ] **Step 3: Verify export works end-to-end**

Run: `pnpm dev`
Check: switch to flat view, click "Export Cut File", download SVG, open in browser — should show the flat pattern with labels, bend lines, dimensions.

- [ ] **Step 4: Commit**

```bash
git add src/components/configurator/ExportButton.tsx src/components/configurator/ConfigSidebar.tsx
git commit -m "feat: export button for SVG/DXF download in flat view"
```

---

### Task 12: Split Line Overlay

**Files:**
- Create: `src/components/configurator/SplitLineOverlay.tsx`
- Modify: `src/components/configurator/WorktopOptions.tsx`

- [ ] **Step 1: Create SplitLineOverlay component**

An HTML div overlay positioned on top of the 3D canvas. Renders a draggable line when the flat sheet requires a split and the view is in flat mode.

```typescript
"use client";

import { useCallback, useRef } from "react";
import { useConfiguratorStore } from "@/stores/configurator";

export function SplitLineOverlay() {
  const { viewMode, productType, worktopConfig, setWorktopConfig, getFlatSheet } =
    useConfiguratorStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const flatSheet = getFlatSheet();

  if (
    productType !== "worktop" ||
    viewMode !== "flat" ||
    !flatSheet?.requiresSplit
  )
    return null;

  const isVertical = flatSheet.splitDirection === "vertical";
  const position = flatSheet.splitPosition ?? 0;
  const total = isVertical ? flatSheet.totalWidth : flatSheet.totalHeight;
  const percent = (position / total) * 100;

  const handleDrag = useCallback(
    (e: React.MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const onMove = (ev: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const ratio = isVertical
          ? (ev.clientX - rect.left) / rect.width
          : (ev.clientY - rect.top) / rect.height;
        const newPos = Math.round(ratio * total);
        // Clamp: 200mm from edges, 20mm from any bend line
        const minPos = 200;
        const maxPos = total - 200;
        const clamped = Math.max(minPos, Math.min(maxPos, newPos));
        setWorktopConfig({
          ...worktopConfig,
          splitPosition: clamped,
          splitDirection: flatSheet.splitDirection,
        });
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [isVertical, total, worktopConfig, setWorktopConfig, flatSheet.splitDirection]
  );

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-10"
    >
      <div
        className="pointer-events-auto absolute cursor-col-resize"
        style={
          isVertical
            ? { left: `${percent}%`, top: 0, bottom: 0, width: 8, transform: "translateX(-50%)" }
            : { top: `${percent}%`, left: 0, right: 0, height: 8, transform: "translateY(-50%)", cursor: "row-resize" }
        }
        onMouseDown={handleDrag}
      >
        <div
          className={`bg-green-500 ${isVertical ? "h-full w-0.5 mx-auto" : "w-full h-0.5 my-auto"}`}
          style={{ opacity: 0.8 }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add SplitLineOverlay to ProductViewer wrapper**

Place the `<SplitLineOverlay />` as a sibling to the `<Canvas>`, inside the same relative-positioned container.

- [ ] **Step 3: Add flat sheet info to WorktopOptions**

In `WorktopOptions.tsx`, display the flat sheet dimensions and panel count when in worktop mode:

```typescript
const flatSheet = useConfiguratorStore((s) => s.getFlatSheet());

// Render below the existing controls:
{flatSheet && (
  <div className="rounded-lg border border-ht-dark/10 p-3 space-y-1">
    <h3 className="font-serif text-lg font-semibold">Flat Sheet</h3>
    <p className="text-sm text-ht-dark/60">
      {flatSheet.totalWidth}mm × {flatSheet.totalHeight}mm
    </p>
    <p className="text-sm text-ht-dark/60">
      {flatSheet.bendCount} bends ({flatSheet.totalBendDeduction}mm allowance)
    </p>
    {flatSheet.requiresSplit && (
      <p className="text-sm text-amber-600 font-medium">
        ⚠ Requires 2 panels (exceeds max sheet size)
      </p>
    )}
  </div>
)}
```

- [ ] **Step 4: Verify split line is draggable**

Run: `pnpm dev`
Check: set a wide worktop (e.g. 1900mm with side returns) that triggers a split, switch to flat view, drag the green split line.

- [ ] **Step 5: Commit**

```bash
git add src/components/configurator/SplitLineOverlay.tsx src/components/configurator/WorktopOptions.tsx src/components/three/ProductViewer.tsx
git commit -m "feat: draggable split line overlay and flat sheet info display"
```

---

### Task 13: Final Integration & Polish

**Files:**
- Various — integration testing and fixes

- [ ] **Step 1: End-to-end walkthrough**

Test the full flow:
1. Select worktop product type
2. Choose a textured finish (Northumberland)
3. Set dimensions (e.g. 1200mm × 600mm)
4. Enable front return (45mm), back upstand (100mm), left return (45mm)
5. Verify flat sheet info shows: 1240mm × 735mm, 3 bends
6. Toggle to flat view — animation plays, annotations appear
7. Export SVG — open and verify correct layout
8. Export DXF — open in a text editor, verify structure
9. Toggle back to 3D — animation folds back up
10. Set width to 1950mm with side returns — verify split detection
11. Drag split line — verify it updates

- [ ] **Step 2: Fix any issues found during walkthrough**

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration fixes for flat sheet feature"
```

- [ ] **Step 4: Run build to verify no TypeScript errors**

Run: `pnpm build`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Final commit if needed**

```bash
git add -A
git commit -m "chore: clean up flat sheet implementation"
```
