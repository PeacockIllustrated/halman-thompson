import { create } from "zustand";
import type {
  ConfiguratorState,
  Finish,
  ProductType,
  MountingType,
  LacquerType,
  ViewMode,
  SignageConfig,
  ConfigSnapshot,
  PanelLayout,
  WorktopConfig,
} from "@/types";
import { calculateFlatSheet } from "@/lib/worktop/flatSheet";

export const DEFAULT_WORKTOP_CONFIG: WorktopConfig = {
  cornerRadius: 12,
  frontReturn: { enabled: true, depth: 45 },
  backUpstand: { enabled: true, depth: 100 },
  backReturn: { enabled: false, depth: 45 },
  leftReturn: { enabled: true, depth: 45 },
  rightReturn: { enabled: true, depth: 45 },
  cutout: {
    enabled: false,
    shape: "rectangle",
    width: 450,
    depth: 350,
    cornerRadius: 15,
    offsetX: 0,
    offsetZ: 0,
    returns: { enabled: true, depth: 30 },
    lip: { enabled: false, depth: 30 },
  },
  splitPosition: null,
  splitDirection: null,
};

/**
 * Calculate the panel layout when dimensions exceed the max single sheet size.
 * Max single sheet: 2000mm × 1000mm
 */
function calculatePanelLayout(
  width: number,
  height: number
): PanelLayout | null {
  const MAX_WIDTH = 2000;
  const MAX_HEIGHT = 1000;

  if (width <= MAX_WIDTH && height <= MAX_HEIGHT) {
    return null; // Single panel — no layout needed
  }

  const panelsWide = Math.ceil(width / MAX_WIDTH);
  const panelsHigh = Math.ceil(height / MAX_HEIGHT);
  const panelCount = panelsWide * panelsHigh;

  const panelWidth = width / panelsWide;
  const panelHeight = height / panelsHigh;

  const panels = [];
  for (let row = 0; row < panelsHigh; row++) {
    for (let col = 0; col < panelsWide; col++) {
      panels.push({
        index: row * panelsWide + col,
        width: panelWidth,
        height: panelHeight,
        position: { x: col * panelWidth, y: row * panelHeight },
      });
    }
  }

  const joinDirection =
    panelsWide > 1 && panelsHigh > 1
      ? "grid"
      : panelsWide > 1
        ? "horizontal"
        : "vertical";

  // £50 per additional panel beyond the first
  const surcharge = (panelCount - 1) * 50;

  return { panelCount, panels, joinDirection, surcharge } as PanelLayout;
}

/**
 * For worktops, derive panel count from flat sheet dimensions.
 */
function panelCountFromFlatSheet(
  width: number,
  height: number,
  thickness: number,
  config: WorktopConfig
): number {
  const flat = calculateFlatSheet(width, height, thickness, config);
  return flat.requiresSplit ? 2 : 1;
}

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  // ─── Default State ──────────────────────────────────
  productType: "splashback",
  selectedFinish: null,
  baseMetal: "copper",
  width: 900,
  height: 600,
  thickness: 0.9,
  panelCount: 1,
  panelLayout: null,
  mountingType: "none",
  lacquerType: "matte",
  signageConfig: null,
  worktopConfig: DEFAULT_WORKTOP_CONFIG,
  calculatedPrice: null,
  priceBreakdown: null,
  isPriceLoading: false,
  viewMode: "3d",
  configStep: 0,
  isConfigComplete: false,

  // ─── Actions ────────────────────────────────────────

  setProductType: (type: ProductType) => {
    set({ productType: type, calculatedPrice: null, priceBreakdown: null });
  },

  setFinish: (finish: Finish) => {
    set({
      selectedFinish: finish,
      baseMetal: finish.baseMetal,
      calculatedPrice: null,
    });
    // Auto-recalculate price
    get().calculatePrice();
  },

  setWidth: (width: number) => {
    const state = get();
    if (state.productType === "worktop") {
      const count = panelCountFromFlatSheet(width, state.height, state.thickness, state.worktopConfig);
      set({ width, panelCount: count, panelLayout: null, calculatedPrice: null });
    } else {
      const layout = calculatePanelLayout(width, state.height);
      set({ width, panelLayout: layout, panelCount: layout?.panelCount ?? 1, calculatedPrice: null });
    }
  },

  setHeight: (height: number) => {
    const state = get();
    if (state.productType === "worktop") {
      const count = panelCountFromFlatSheet(state.width, height, state.thickness, state.worktopConfig);
      set({ height, panelCount: count, panelLayout: null, calculatedPrice: null });
    } else {
      const layout = calculatePanelLayout(state.width, height);
      set({ height, panelLayout: layout, panelCount: layout?.panelCount ?? 1, calculatedPrice: null });
    }
  },

  setThickness: (thickness: number) => {
    const state = get();
    if (state.productType === "worktop") {
      const count = panelCountFromFlatSheet(state.width, state.height, thickness, state.worktopConfig);
      set({ thickness, panelCount: count, calculatedPrice: null });
    } else {
      set({ thickness, calculatedPrice: null });
    }
  },

  setMountingType: (type: MountingType) => {
    set({ mountingType: type, calculatedPrice: null });
    get().calculatePrice();
  },

  setLacquerType: (type: LacquerType) => {
    set({ lacquerType: type });
  },

  setSignageConfig: (config: Partial<SignageConfig>) => {
    const current = get().signageConfig;
    set({
      signageConfig: { ...current, ...config } as SignageConfig,
      calculatedPrice: null,
    });
  },

  setWorktopConfig: (config: WorktopConfig) => {
    const state = get();
    const count = panelCountFromFlatSheet(state.width, state.height, state.thickness, config);
    set({ worktopConfig: config, panelCount: count, calculatedPrice: null });
  },

  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode });
  },

  calculatePrice: async () => {
    const state = get();
    if (!state.selectedFinish) return;

    set({ isPriceLoading: true });

    try {
      const flat = get().getFlatSheet();
      const response = await fetch("/api/pricing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: state.productType,
          finishId: state.selectedFinish.id,
          width: state.width,
          height: state.height,
          thickness: state.thickness,
          mountingType: state.mountingType,
          panelCount: state.panelCount,
          ...(flat ? { flatWidth: flat.totalWidth, flatHeight: flat.totalHeight } : {}),
        }),
      });

      const data = await response.json();

      set({
        calculatedPrice: data.totalPrice,
        priceBreakdown: data.breakdown,
        isPriceLoading: false,
        isConfigComplete: true,
      });
    } catch (error) {
      console.error("Price calculation failed:", error);
      set({ isPriceLoading: false });
    }
  },

  resetConfig: () => {
    set({
      productType: "splashback",
      selectedFinish: null,
      baseMetal: "copper",
      width: 900,
      height: 600,
      thickness: 0.9,
      panelCount: 1,
      panelLayout: null,
      mountingType: "none",
      lacquerType: "matte",
      signageConfig: null,
      worktopConfig: DEFAULT_WORKTOP_CONFIG,
      calculatedPrice: null,
      priceBreakdown: null,
      isPriceLoading: false,
      viewMode: "3d",
      configStep: 0,
      isConfigComplete: false,
    });
  },

  getSnapshot: (): ConfigSnapshot => {
    const s = get();
    return {
      p: s.productType,
      f: s.selectedFinish?.slug ?? "",
      w: s.width,
      h: s.height,
      t: s.thickness,
      m: s.mountingType,
      l: s.lacquerType,
      ...(s.signageConfig
        ? {
            st: s.signageConfig.text,
            sf: s.signageConfig.fontFamily,
            sm: s.signageConfig.fabricationMethod,
          }
        : {}),
    };
  },

  loadSnapshot: (snapshot: ConfigSnapshot) => {
    set({
      productType: snapshot.p,
      width: snapshot.w,
      height: snapshot.h,
      thickness: snapshot.t,
      mountingType: snapshot.m,
      lacquerType: snapshot.l,
    });
    // Finish and signage config need to be loaded after finishes are fetched
  },

  getFlatSheet: () => {
    const s = get();
    if (s.productType !== "worktop") return null;
    return calculateFlatSheet(s.width, s.height, s.thickness, s.worktopConfig);
  },
}));
