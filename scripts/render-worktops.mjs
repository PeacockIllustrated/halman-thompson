// Capture marketing stills from the /render studio.
//
//   pnpm dev            # in another terminal
//   node scripts/render-worktops.mjs [outDir] [shotId ...]
//
// Needs Playwright with Chromium available (npx playwright install chromium).
// Writes one PNG per shot at RENDER_DPR × the frame size (default 1.5×,
// e.g. 2400 × 1500 for landscape shots).
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// CommonJS require so a globally installed Playwright (NODE_PATH) also resolves
const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.env.RENDER_BASE_URL ?? "http://localhost:3000";
const [outDir = "renders", ...only] = process.argv.slice(2);
const ALL = [
  "northumberland-kitchen",
  "northumberland-detail",
  "antique-brass-inkwell",
  "antique-brass-sink",
  "ayrshire-studio",
  "ayrshire-corner",
];
const shots = only.length ? only : ALL;
const DPR = Number(process.env.RENDER_DPR ?? 1.5);

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

for (const id of shots) {
  const page = await browser.newPage({ viewport: { width: 1700, height: 1400 } });
  page.on("pageerror", (e) => console.error(`[${id}]`, e.message));
  const t0 = Date.now();
  await page.goto(`${BASE}/render?shot=${id}&clean&dpr=${DPR}`, { waitUntil: "domcontentloaded" });
  // Poll from Node: in-page polling can starve while software WebGL is busy.
  for (let ready = false; !ready; ) {
    if (Date.now() - t0 > 600_000) throw new Error(`${id}: timed out waiting for render`);
    await new Promise((r) => setTimeout(r, 3000));
    ready = await page.evaluate(() => window.__renderReady === true);
  }
  const data = await page.evaluate(() => document.querySelector("#render-frame canvas").toDataURL("image/png"));
  writeFileSync(join(outDir, `${id}.png`), Buffer.from(data.split(",")[1], "base64"));
  console.log(`${id}: ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  await page.close();
}
await browser.close();
