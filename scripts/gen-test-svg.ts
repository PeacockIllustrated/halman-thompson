import { calculateFlatSheet } from "../src/lib/worktop/flatSheet";
import { generateSvg } from "../src/lib/worktop/exportSvg";
import { writeFileSync } from "fs";
import { join } from "path";

// ── Config A: Rectangle cutout with returns + corner radius ──
const configRect = {
  cornerRadius: 12,
  frontReturn: { enabled: true, depth: 45 },
  backUpstand: { enabled: true, depth: 100 },
  backReturn: { enabled: false, depth: 45 },
  leftReturn: { enabled: true, depth: 45 },
  rightReturn: { enabled: false, depth: 45 },
  cutout: {
    enabled: true,
    shape: "rectangle" as const,
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

// ── Config B: Oval cutout with returns + corner radius ──
const configOval = {
  cornerRadius: 20,
  frontReturn: { enabled: true, depth: 45 },
  backUpstand: { enabled: false, depth: 100 },
  backReturn: { enabled: true, depth: 45 },
  leftReturn: { enabled: true, depth: 45 },
  rightReturn: { enabled: true, depth: 45 },
  cutout: {
    enabled: true,
    shape: "oval" as const,
    width: 500,
    depth: 400,
    cornerRadius: 0,
    offsetX: 0,
    offsetZ: 0,
    returns: { enabled: true, depth: 30 },
    lip: { enabled: false, depth: 30 },
  },
  splitPosition: null,
  splitDirection: null,
};

// ── Config C: No cutout, no radius — edge case ──
const configPlain = {
  cornerRadius: 0,
  frontReturn: { enabled: true, depth: 45 },
  backUpstand: { enabled: true, depth: 100 },
  backReturn: { enabled: false, depth: 45 },
  leftReturn: { enabled: false, depth: 45 },
  rightReturn: { enabled: false, depth: 45 },
  cutout: {
    enabled: false,
    shape: "rectangle" as const,
    width: 450,
    depth: 350,
    cornerRadius: 15,
    offsetX: 0,
    offsetZ: 0,
    returns: { enabled: false, depth: 30 },
    lip: { enabled: false, depth: 30 },
  },
  splitPosition: null,
  splitDirection: null,
};

// ── Config D: Large oval that needs multi-strip ──
const configLargeOval = {
  cornerRadius: 30,
  frontReturn: { enabled: true, depth: 45 },
  backUpstand: { enabled: false, depth: 100 },
  backReturn: { enabled: false, depth: 45 },
  leftReturn: { enabled: false, depth: 45 },
  rightReturn: { enabled: false, depth: 45 },
  cutout: {
    enabled: true,
    shape: "oval" as const,
    width: 900,
    depth: 700,
    cornerRadius: 0,
    offsetX: 0,
    offsetZ: 0,
    returns: { enabled: true, depth: 30 },
    lip: { enabled: false, depth: 30 },
  },
  splitPosition: null,
  splitDirection: null,
};

const tests = [
  { name: "rect", config: configRect, w: 1200, d: 600 },
  { name: "oval", config: configOval, w: 1400, d: 700 },
  { name: "plain", config: configPlain, w: 900, d: 600 },
  { name: "large-oval", config: configLargeOval, w: 1800, d: 900 },
];

for (const t of tests) {
  const flatSheet = calculateFlatSheet(t.w, t.d, 1.2, t.config);
  for (const mode of ["workshop", "production"] as const) {
    const svg = generateSvg({
      flatSheet,
      config: t.config,
      finishName: "Northumberland",
      width: t.w,
      depth: t.d,
      thickness: 1.2,
      productName: "Worktop",
      mode,
    });
    const outPath = join(__dirname, "..", `test-fab-${t.name}-${mode}.svg`);
    writeFileSync(outPath, svg);
    console.log(`${t.name}/${mode}: ${svg.length} bytes`);
  }
}
