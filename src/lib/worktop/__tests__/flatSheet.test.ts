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
    cornerRadius: 15,
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
