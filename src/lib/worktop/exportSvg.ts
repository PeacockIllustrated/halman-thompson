import type { FlatSheet, WorktopConfig } from "@/types";

// ── Print units: 1mm = 2.835pt ─────────────────────────────────
const MM_TO_PT = 842 / 297;

// ── Base chrome sizes (designed at A4/842pt reference) ─────────
const B_BORDER = 20;
const B_HEADER = 48;
const B_HEADER_GAP = 22;
const B_FOOTER = 78;
const B_SIDE = 36;
const B_DPAD = 28;
const B_SIDEBAR = 220;
const B_SIDEBAR_GAP = 24;

const SCALE_THRESHOLD = 10000; // mm — scale to 1:10 above this
const STANDARD_SCALES = [1, 1.5, 2, 2.5, 5, 10, 15, 20, 25, 50, 100];

// ── Brand colours (chrome only) ────────────────────────────────
const NAVY = "#1a1a2e";
const GOLD = "#b8860b";
const COPPER = "#b87333";

// ── Drawing colours ────────────────────────────────────────────
const K = "#000";
const G = "#666";
const LG = "#999";
const BEND = "#cc0000";
const SPLIT = "#009933";
const FM = "#f5f5f5";
const FS = "#ebebeb";

// ── Types ──────────────────────────────────────────────────────

export type SvgExportMode = "workshop" | "production";

export interface SvgExportOptions {
  flatSheet: FlatSheet;
  config: WorktopConfig;
  finishName: string;
  width: number;
  depth: number;
  thickness: number;
  productName?: string;
  mode?: SvgExportMode;
}

// ── Helpers ────────────────────────────────────────────────────

function pickScale(aw: number, ah: number, rw: number, rh: number): number {
  const n = Math.max((rw * MM_TO_PT) / aw, (rh * MM_TO_PT) / ah);
  for (const s of STANDARD_SCALES) if (s >= n * 1.08) return s;
  return Math.ceil(n);
}

function p(mm: number, sc: number): number {
  return (mm * MM_TO_PT) / sc;
}

/** Horizontal dimension line */
function hD(x1: number, y: number, x2: number, off: number, label: string, S: number, color = K, fs = 7): string {
  const dy = y + off;
  const mx = (x1 + x2) / 2;
  const tk = 3 * S;
  const sw = 0.4 * S;
  let s = "";
  s += `<line x1="${x1}" y1="${y}" x2="${x1}" y2="${dy}" stroke="${color}" stroke-width="${sw * 0.7}"/>\n`;
  s += `<line x1="${x2}" y1="${y}" x2="${x2}" y2="${dy}" stroke="${color}" stroke-width="${sw * 0.7}"/>\n`;
  s += `<line x1="${x1}" y1="${dy}" x2="${x2}" y2="${dy}" stroke="${color}" stroke-width="${sw}"/>\n`;
  s += `<line x1="${x1 - tk}" y1="${dy - tk}" x2="${x1 + tk}" y2="${dy + tk}" stroke="${color}" stroke-width="${sw * 1.5}"/>\n`;
  s += `<line x1="${x2 - tk}" y1="${dy - tk}" x2="${x2 + tk}" y2="${dy + tk}" stroke="${color}" stroke-width="${sw * 1.5}"/>\n`;
  s += `<text x="${mx}" y="${dy - 3 * S}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${fs * S}" fill="${color}">${label}</text>\n`;
  return s;
}

/** Vertical dimension line */
function vD(x: number, y1: number, y2: number, off: number, label: string, S: number, color = K, fs = 7): string {
  const dx = x + off;
  const my = (y1 + y2) / 2;
  const tk = 3 * S;
  const sw = 0.4 * S;
  let s = "";
  s += `<line x1="${x}" y1="${y1}" x2="${dx}" y2="${y1}" stroke="${color}" stroke-width="${sw * 0.7}"/>\n`;
  s += `<line x1="${x}" y1="${y2}" x2="${dx}" y2="${y2}" stroke="${color}" stroke-width="${sw * 0.7}"/>\n`;
  s += `<line x1="${dx}" y1="${y1}" x2="${dx}" y2="${y2}" stroke="${color}" stroke-width="${sw}"/>\n`;
  s += `<line x1="${dx - tk}" y1="${y1 - tk}" x2="${dx + tk}" y2="${y1 + tk}" stroke="${color}" stroke-width="${sw * 1.5}"/>\n`;
  s += `<line x1="${dx - tk}" y1="${y2 - tk}" x2="${dx + tk}" y2="${y2 + tk}" stroke="${color}" stroke-width="${sw * 1.5}"/>\n`;
  s += `<text x="${dx - 4 * S}" y="${my}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${fs * S}" fill="${color}" transform="rotate(-90,${dx - 4 * S},${my})">${label}</text>\n`;
  return s;
}

/** Ramanujan's approximation for ellipse circumference */
function ellipseCirc(a: number, b: number): number {
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}

/** SVG path for rectangle with independent corner radii (top-left, top-right, bottom-right, bottom-left) */
function rrPath(x: number, y: number, w: number, h: number,
                rtl: number, rtr: number, rbr: number, rbl: number): string {
  let d = `M ${x + rtl},${y}`;
  d += ` L ${x + w - rtr},${y}`;
  if (rtr > 0) d += ` A ${rtr},${rtr} 0 0 1 ${x + w},${y + rtr}`;
  d += ` L ${x + w},${y + h - rbr}`;
  if (rbr > 0) d += ` A ${rbr},${rbr} 0 0 1 ${x + w - rbr},${y + h}`;
  d += ` L ${x + rbl},${y + h}`;
  if (rbl > 0) d += ` A ${rbl},${rbl} 0 0 1 ${x},${y + h - rbl}`;
  d += ` L ${x},${y + rtl}`;
  if (rtl > 0) d += ` A ${rtl},${rtl} 0 0 1 ${x + rtl},${y}`;
  d += ` Z`;
  return d;
}

/** Corner seam mark (× with dashed circle) */
function seamMark(sx: number, sy: number, S: number): string {
  const sz = 3 * S;
  let s = "";
  s += `<line x1="${sx - sz}" y1="${sy - sz}" x2="${sx + sz}" y2="${sy + sz}" stroke="${BEND}" stroke-width="${0.5 * S}"/>\n`;
  s += `<line x1="${sx + sz}" y1="${sy - sz}" x2="${sx - sz}" y2="${sy + sz}" stroke="${BEND}" stroke-width="${0.5 * S}"/>\n`;
  s += `<circle cx="${sx}" cy="${sy}" r="${sz * 1.4}" fill="none" stroke="${BEND}" stroke-width="${0.3 * S}" stroke-dasharray="${2 * S},${2 * S}"/>\n`;
  return s;
}

// ══════════════════════════════════════════════════════════════
// CHROME (branded overlay — all sizes × S)
// ══════════════════════════════════════════════════════════════

function svgDefs(): string {
  return `<defs>
<linearGradient id="gG" x1="0%" x2="100%"><stop offset="0%" stop-color="#8a6508"/><stop offset="30%" stop-color="${GOLD}"/><stop offset="50%" stop-color="#d4a830"/><stop offset="70%" stop-color="${GOLD}"/><stop offset="100%" stop-color="#8a6508"/></linearGradient>
<linearGradient id="cG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a0622a"/><stop offset="50%" stop-color="${COPPER}"/><stop offset="100%" stop-color="#c9885a"/></linearGradient>
<pattern id="ha" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="${G}" stroke-width="0.4"/></pattern>
<symbol id="co" viewBox="0 0 40 40"><path d="M0,0 L40,0 L40,4 L4,4 L4,40 L0,40 Z" fill="url(#gG)"/><path d="M8,8 L40,8 L40,10 L10,10 L10,40 L8,40 Z" fill="${GOLD}" opacity="0.4"/><circle cx="5" cy="5" r="2.5" fill="${GOLD}"/></symbol>
<symbol id="dv" viewBox="0 0 200 10"><line x1="0" y1="5" x2="80" y2="5" stroke="url(#gG)" stroke-width="0.75"/><circle cx="88" cy="5" r="2" fill="${GOLD}"/><circle cx="100" cy="5" r="3" fill="url(#cG)"/><circle cx="112" cy="5" r="2" fill="${GOLD}"/><line x1="120" y1="5" x2="200" y2="5" stroke="url(#gG)" stroke-width="0.75"/></symbol>
</defs>\n`;
}

function svgChrome(pw: number, ph: number, S: number): string {
  const cs = 24 * S; // corner size
  let s = "";
  s += `<rect width="${pw}" height="${ph}" fill="#fff"/>\n`;
  s += `<rect x="${14 * S}" y="${14 * S}" width="${pw - 28 * S}" height="${ph - 28 * S}" rx="${S}" fill="none" stroke="${NAVY}" stroke-width="${2 * S}"/>\n`;
  s += `<rect x="${B_BORDER * S}" y="${B_BORDER * S}" width="${pw - B_BORDER * 2 * S}" height="${ph - B_BORDER * 2 * S}" rx="${0.5 * S}" fill="none" stroke="${NAVY}" stroke-width="${0.75 * S}"/>\n`;
  s += `<rect x="${17 * S}" y="${17 * S}" width="${pw - 34 * S}" height="${ph - 34 * S}" rx="${0.75 * S}" fill="none" stroke="url(#gG)" stroke-width="${0.5 * S}"/>\n`;
  s += `<use href="#co" x="${14 * S}" y="${14 * S}" width="${cs}" height="${cs}"/>\n`;
  s += `<g transform="translate(${pw - 14 * S},${14 * S}) scale(-1,1)"><use href="#co" width="${cs}" height="${cs}"/></g>\n`;
  s += `<g transform="translate(${14 * S},${ph - 14 * S}) scale(1,-1)"><use href="#co" width="${cs}" height="${cs}"/></g>\n`;
  s += `<g transform="translate(${pw - 14 * S},${ph - 14 * S}) scale(-1,-1)"><use href="#co" width="${cs}" height="${cs}"/></g>\n`;
  return s;
}

function svgHeader(pw: number, S: number, title?: string, subtitle?: string): string {
  const hx = B_BORDER * S;
  const hy = B_BORDER * S;
  const hw = pw - B_BORDER * 2 * S;
  const hh = B_HEADER * S;
  let s = "";
  s += `<rect x="${hx}" y="${hy}" width="${hw}" height="${hh}" fill="${NAVY}" rx="${0.5 * S}"/>\n`;
  s += `<line x1="${hx}" y1="${hy + hh}" x2="${hx + hw}" y2="${hy + hh}" stroke="url(#gG)" stroke-width="${S}"/>\n`;
  s += `<circle cx="${hx + 36 * S}" cy="${hy + 24 * S}" r="${15 * S}" fill="none" stroke="${GOLD}" stroke-width="${0.75 * S}" opacity="0.7"/>\n`;
  s += `<text x="${hx + 36 * S}" y="${hy + 29 * S}" font-family="Georgia,serif" font-size="${13 * S}" font-weight="bold" fill="${GOLD}" text-anchor="middle" letter-spacing="${S}">HT</text>\n`;
  s += `<text x="${hx + 62 * S}" y="${hy + 22 * S}" font-family="Georgia,serif" font-size="${15 * S}" fill="#fff" letter-spacing="${3 * S}">HALMAN THOMPSON</text>\n`;
  s += `<text x="${hx + 62 * S}" y="${hy + 35 * S}" font-family="Arial,sans-serif" font-size="${7 * S}" fill="${GOLD}" letter-spacing="${2.5 * S}" font-weight="300">BESPOKE METAL CREATIONS</text>\n`;
  // Right-aligned title & subtitle inside the navy bar
  if (title) {
    s += `<text x="${hx + hw - 12 * S}" y="${hy + 22 * S}" text-anchor="end" font-family="Arial,sans-serif" font-size="${10 * S}" fill="#fff" letter-spacing="${2.5 * S}" font-weight="bold">${title}</text>\n`;
  }
  if (subtitle) {
    s += `<text x="${hx + hw - 12 * S}" y="${hy + 35 * S}" text-anchor="end" font-family="Arial,sans-serif" font-size="${7 * S}" fill="${GOLD}" letter-spacing="${1.5 * S}">${subtitle}</text>\n`;
  }
  return s;
}

function svgSpec(pw: number, ph: number, S: number, fin: string, sc: string, th: number, prod: string, w: number, d: number): string {
  const tbw = 260 * S;
  const tbh = 56 * S;
  const tbx = pw - B_BORDER * S - tbw - 4 * S;
  const tby = ph - B_BORDER * S - B_FOOTER * S + 6 * S;
  const f = S; // font scale
  let s = "";
  s += `<rect x="${tbx}" y="${tby}" width="${tbw}" height="${tbh}" fill="#fff" rx="${S}"/>\n`;
  s += `<rect x="${tbx}" y="${tby}" width="${tbw}" height="${tbh}" fill="none" stroke="${NAVY}" stroke-width="${0.75 * S}" rx="${S}"/>\n`;
  // Grid
  for (const r of [14, 28, 42]) s += `<line x1="${tbx}" y1="${tby + r * f}" x2="${tbx + tbw}" y2="${tby + r * f}" stroke="${NAVY}" stroke-width="${0.3 * S}" opacity="0.25"/>\n`;
  s += `<line x1="${tbx + 70 * f}" y1="${tby + 14 * f}" x2="${tbx + 70 * f}" y2="${tby + tbh}" stroke="${NAVY}" stroke-width="${0.3 * S}" opacity="0.25"/>\n`;
  s += `<line x1="${tbx + 165 * f}" y1="${tby + 14 * f}" x2="${tbx + 165 * f}" y2="${tby + 42 * f}" stroke="${NAVY}" stroke-width="${0.3 * S}" opacity="0.25"/>\n`;
  // Title
  s += `<text x="${tbx + tbw / 2}" y="${tby + 10 * f}" font-family="Georgia,serif" font-size="${7 * f}" fill="${NAVY}" text-anchor="middle" letter-spacing="${2 * f}" font-weight="bold">SPECIFICATION</text>\n`;
  const lx = tbx + 4 * f;
  const vx = tbx + 74 * f;
  const rl = tbx + 170 * f;
  const rv = tbx + 214 * f;
  const lfs = 5.5 * f;
  const vfs = 6 * f;
  // Rows
  s += `<text x="${lx}" y="${tby + 24 * f}" font-family="Arial,sans-serif" font-size="${lfs}" fill="${LG}" letter-spacing="${0.8 * f}">PRODUCT</text>\n`;
  s += `<text x="${vx}" y="${tby + 24 * f}" font-family="Arial,sans-serif" font-size="${vfs}" fill="${NAVY}">${prod}</text>\n`;
  s += `<text x="${rl}" y="${tby + 24 * f}" font-family="Arial,sans-serif" font-size="${lfs}" fill="${LG}" letter-spacing="${0.8 * f}">FINISH</text>\n`;
  s += `<text x="${rv}" y="${tby + 24 * f}" font-family="Arial,sans-serif" font-size="${vfs}" fill="${NAVY}">${fin}</text>\n`;
  s += `<text x="${lx}" y="${tby + 38 * f}" font-family="Arial,sans-serif" font-size="${lfs}" fill="${LG}" letter-spacing="${0.8 * f}">SIZE</text>\n`;
  s += `<text x="${vx}" y="${tby + 38 * f}" font-family="Arial,sans-serif" font-size="${vfs}" fill="${NAVY}">${w} × ${d} mm</text>\n`;
  s += `<text x="${rl}" y="${tby + 38 * f}" font-family="Arial,sans-serif" font-size="${lfs}" fill="${LG}" letter-spacing="${0.8 * f}">GAUGE</text>\n`;
  s += `<text x="${rv}" y="${tby + 38 * f}" font-family="Arial,sans-serif" font-size="${vfs}" fill="${NAVY}">${th}mm</text>\n`;
  const today = new Date().toISOString().slice(0, 10);
  s += `<text x="${lx}" y="${tby + 52 * f}" font-family="Arial,sans-serif" font-size="${lfs}" fill="${LG}" letter-spacing="${0.8 * f}">SCALE</text>\n`;
  s += `<text x="${vx}" y="${tby + 52 * f}" font-family="Arial,sans-serif" font-size="${vfs}" fill="${NAVY}">${sc}</text>\n`;
  s += `<text x="${rl}" y="${tby + 52 * f}" font-family="Arial,sans-serif" font-size="${lfs}" fill="${LG}" letter-spacing="${0.8 * f}">DATE</text>\n`;
  s += `<text x="${rv}" y="${tby + 52 * f}" font-family="Arial,sans-serif" font-size="${vfs}" fill="${NAVY}">${today}</text>\n`;
  return s;
}

function svgFooter(pw: number, ph: number, S: number): string {
  const fy = ph - B_BORDER * S - B_FOOTER * S + 6 * S;
  const fx = B_SIDE * S;
  const f = S;
  let s = "";
  s += `<line x1="${fx}" y1="${fy - 2 * f}" x2="${pw / 2}" y2="${fy - 2 * f}" stroke="#d4cfc5" stroke-width="${0.4 * S}" opacity="0.3"/>\n`;
  s += `<g transform="translate(${fx},${fy + 4 * f})"><use href="#dv" width="${100 * f}" height="${5 * f}"/></g>\n`;
  s += `<text x="${fx}" y="${fy + 18 * f}" font-family="Arial,sans-serif" font-size="${6 * f}" fill="${NAVY}" opacity="0.5">Halman Thompson Ltd  |  75 Darras Road, Ponteland, Newcastle upon Tyne NE20 9PQ</text>\n`;
  s += `<text x="${fx}" y="${fy + 29 * f}" font-family="Arial,sans-serif" font-size="${6 * f}" fill="${NAVY}" opacity="0.5">T: +44 7703 567916  |  E: Sales@halmanthompson.com  |  W: www.halmanthompson.com</text>\n`;
  s += `<text x="${fx}" y="${fy + 44 * f}" font-family="Arial,sans-serif" font-size="${4.5 * f}" fill="${LG}">All dimensions in millimetres. Each piece is hand-finished — natural variations in patina are inherent to the artisan process.</text>\n`;
  s += `<text x="${fx}" y="${fy + 53 * f}" font-family="Arial,sans-serif" font-size="${4.5 * f}" fill="${LG}">This document is the property of Halman Thompson Ltd. Reproduction without permission is prohibited.</text>\n`;
  return s;
}

// ══════════════════════════════════════════════════════════════
// DRAWING CONTENT (industry standard — fonts × S)
// ══════════════════════════════════════════════════════════════

function drawPattern(fs: FlatSheet, cfg: WorktopConfig, ox: number, oy: number, scale: number, S: number, areaW?: number, areaH?: number): string {
  let s = "";
  const pw = p(fs.totalWidth, scale);
  const ph = p(fs.totalHeight, scale);
  const sw = 0.8 * S; // stroke width

  // Annotation margins around the pattern rectangle
  const annL = 24 * S;  // vertical dimension lines on left
  const annT = 20 * S;  // horizontal dimension line above
  const annR = 32 * S;  // segment dimension lines on right
  const annB = 36 * S;  // notes + segment dims below

  // Centre the pattern in available area, or fall back to fixed padding
  let cx: number, cy: number;
  if (areaW !== undefined && areaH !== undefined) {
    const drawW = annL + pw + annR;
    const drawH = annT + ph + annB;
    const padX = Math.max(0, (areaW - drawW) / 2);
    const padY = Math.max(0, (areaH - drawH) / 2);
    cx = ox + annL + padX;
    cy = oy + annT + padY;
  } else {
    const dp = B_DPAD * S;
    cx = ox + dp;
    cy = oy + dp;
  }

  // ── Corner radius analysis ──
  const mainSeg = fs.segments.find((x) => x.id === "main-surface")!;
  const rClamp = cfg.cornerRadius > 0 ? Math.min(cfg.cornerRadius, mainSeg.width / 2, mainSeg.height / 2) : 0;
  const rfMm = rClamp;
  const rbMm = cfg.backUpstand.enabled ? 0 : rClamp;
  const isWLonger = mainSeg.width >= mainSeg.height;
  const hasFr = cfg.frontReturn.enabled;
  const hasBk = cfg.backUpstand.enabled || cfg.backReturn.enabled;
  const hasLt = cfg.leftReturn.enabled;
  const hasRt = cfg.rightReturn.enabled;

  // Segments with corner radius adjustments on returns
  for (const seg of fs.segments) {
    let segX = seg.x;
    let segY = seg.y;
    let segW = seg.width;
    let segH = seg.height;
    const main = seg.id === "main-surface";
    let isOvercut = false;

    if (!main && rClamp > 0) {
      const isFB = seg.id === "front-return" || seg.id.startsWith("back-");
      const isLR = seg.id === "left-return" || seg.id === "right-return";
      if (isFB) {
        const cR = seg.id === "front-return" ? rfMm : rbMm;
        const rL = (cR > 0 && hasLt) ? cR : 0;
        const rR = (cR > 0 && hasRt) ? cR : 0;
        if (rL > 0 || rR > 0) {
          if (isWLonger) {
            segX += rL; segW -= (rL + rR);
          } else {
            const arcL = rL > 0 ? (Math.PI * rL / 2) : 0;
            const arcR = rR > 0 ? (Math.PI * rR / 2) : 0;
            segX -= (arcL > 0 ? (arcL - rL) : 0);
            segW = (seg.width - rL - rR) + arcL + arcR;
            isOvercut = true;
          }
        }
      } else if (isLR) {
        const rT = (rbMm > 0 && hasBk) ? rbMm : 0;
        const rB = (rfMm > 0 && hasFr) ? rfMm : 0;
        if (rT > 0 || rB > 0) {
          if (!isWLonger) {
            segY += rT; segH -= (rT + rB);
          } else {
            const arcT = rT > 0 ? (Math.PI * rT / 2) : 0;
            const arcB = rB > 0 ? (Math.PI * rB / 2) : 0;
            segY -= (arcT > 0 ? (arcT - rT) : 0);
            segH = (seg.height - rT - rB) + arcT + arcB;
            isOvercut = true;
          }
        }
      }
    }

    const sx = cx + p(segX, scale);
    const sy = cy + p(segY, scale);
    const w = p(segW, scale);
    const h = p(segH, scale);
    const labelW = Math.round(segW);
    const labelH = Math.round(segH);

    if (main && rClamp > 0) {
      const rfPt = p(rfMm, scale);
      const rbPt = p(rbMm, scale);
      s += `<path d="${rrPath(sx, sy, w, h, rbPt, rbPt, rfPt, rfPt)}" fill="${FM}" stroke="${K}" stroke-width="${sw}"/>\n`;
    } else {
      s += `<rect x="${sx}" y="${sy}" width="${w}" height="${h}" fill="${main ? FM : FS}" stroke="${K}" stroke-width="${main ? sw : sw * 0.6}"/>\n`;
    }

    // Dashed lines on overcut returns showing arc–straight boundary
    if (isOvercut) {
      const isFB = seg.id === "front-return" || seg.id.startsWith("back-");
      if (isFB) {
        const cR = seg.id === "front-return" ? rfMm : rbMm;
        if ((cR > 0 && hasLt)) {
          const lx = cx + p(seg.x, scale);
          s += `<line x1="${lx}" y1="${sy}" x2="${lx}" y2="${sy + h}" stroke="${LG}" stroke-width="${0.4 * S}" stroke-dasharray="${2 * S},${2 * S}"/>\n`;
        }
        if ((cR > 0 && hasRt)) {
          const rx2 = cx + p(seg.x + seg.width, scale);
          s += `<line x1="${rx2}" y1="${sy}" x2="${rx2}" y2="${sy + h}" stroke="${LG}" stroke-width="${0.4 * S}" stroke-dasharray="${2 * S},${2 * S}"/>\n`;
        }
      } else {
        if ((rbMm > 0 && hasBk)) {
          const ty = cy + p(seg.y, scale);
          s += `<line x1="${sx}" y1="${ty}" x2="${sx + w}" y2="${ty}" stroke="${LG}" stroke-width="${0.4 * S}" stroke-dasharray="${2 * S},${2 * S}"/>\n`;
        }
        if ((rfMm > 0 && hasFr)) {
          const by = cy + p(seg.y + seg.height, scale);
          s += `<line x1="${sx}" y1="${by}" x2="${sx + w}" y2="${by}" stroke="${LG}" stroke-width="${0.4 * S}" stroke-dasharray="${2 * S},${2 * S}"/>\n`;
        }
      }
    }

    s += `<text x="${sx + w / 2}" y="${sy + h / 2 - 2 * S}" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="${(main ? 8 : 6) * S}" fill="${K}">${seg.label}${isOvercut ? " (incl. arc)" : ""}</text>\n`;
    s += `<text x="${sx + w / 2}" y="${sy + h / 2 + 8 * S}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${5 * S}" fill="${G}">${labelW} × ${labelH}</text>\n`;
  }

  // Corner seam marks
  {
    const msx = cx + p(mainSeg.x, scale);
    const msy = cy + p(mainSeg.y, scale);
    const msw = p(mainSeg.width, scale);
    const msh = p(mainSeg.height, scale);
    if (hasFr && hasLt) s += seamMark(msx, msy + msh, S);
    if (hasFr && hasRt) s += seamMark(msx + msw, msy + msh, S);
    if (hasBk && hasLt) s += seamMark(msx, msy, S);
    if (hasBk && hasRt) s += seamMark(msx + msw, msy, S);
  }

  // Cutout
  if (cfg.cutout.enabled) {
    const ms = fs.segments.find((x) => x.id === "main-surface");
    if (ms) {
      const c = cfg.cutout;
      const ccx = ms.x + ms.width / 2 + c.offsetX;
      const ccy = ms.y + ms.height / 2 + c.offsetZ;
      const rx = cx + p(ccx - c.width / 2, scale);
      const ry = cy + p(ccy - c.depth / 2, scale);
      const rw = p(c.width, scale);
      const rh = p(c.depth, scale);
      if (c.shape === "oval")
        s += `<ellipse cx="${rx + rw / 2}" cy="${ry + rh / 2}" rx="${rw / 2}" ry="${rh / 2}" fill="#fff" stroke="${K}" stroke-width="${sw * 0.9}" stroke-dasharray="${6 * S},${2 * S},${2 * S},${2 * S}"/>\n`;
      else
        s += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="#fff" stroke="${K}" stroke-width="${sw * 0.9}" stroke-dasharray="${6 * S},${2 * S},${2 * S},${2 * S}"/>\n`;
      s += `<text x="${rx + rw / 2}" y="${ry + rh / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="${6 * S}" fill="${K}">CUTOUT</text>\n`;
      s += `<text x="${rx + rw / 2}" y="${ry + rh / 2 + 9 * S}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${5 * S}" fill="${G}">${c.width} × ${c.depth}</text>\n`;
    }
  }

  // Bend lines
  for (const b of fs.bendLines) {
    const x1 = cx + p(b.startX, scale);
    const y1 = cy + p(b.startY, scale);
    const x2 = cx + p(b.endX, scale);
    const y2 = cy + p(b.endY, scale);
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${BEND}" stroke-width="${sw * 0.9}" stroke-dasharray="${6 * S},${3 * S}"/>\n`;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const hz = Math.abs(b.startY - b.endY) < 1;
    if (hz) s += `<text x="${mx}" y="${my - 4 * S}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${4.5 * S}" fill="${BEND}">${b.label} (${b.direction})</text>\n`;
    else s += `<text x="${mx + 6 * S}" y="${my}" text-anchor="start" font-family="Arial,sans-serif" font-size="${4.5 * S}" fill="${BEND}" transform="rotate(-90,${mx + 6 * S},${my})">${b.label} (${b.direction})</text>\n`;
  }

  // Split
  if (fs.requiresSplit && fs.splitPosition !== null) {
    if (fs.splitDirection === "vertical") {
      const sx2 = cx + p(fs.splitPosition, scale);
      s += `<line x1="${sx2}" y1="${cy - 3 * S}" x2="${sx2}" y2="${cy + ph + 3 * S}" stroke="${SPLIT}" stroke-width="${S}" stroke-dasharray="${8 * S},${4 * S}"/>\n`;
      const s1 = fs.splitPosition;
      const s2 = fs.totalWidth - s1;
      s += `<text x="${cx + p(s1 / 2, scale)}" y="${cy + ph + 14 * S}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${5.5 * S}" fill="${SPLIT}" font-weight="bold">Sheet 1: ${Math.round(s1)}mm</text>\n`;
      s += `<text x="${cx + p(s1 + s2 / 2, scale)}" y="${cy + ph + 14 * S}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${5.5 * S}" fill="${SPLIT}" font-weight="bold">Sheet 2: ${Math.round(s2)}mm</text>\n`;
    }
  }

  // Dimensions
  s += hD(cx, cy, cx + pw, -14 * S, `${fs.totalWidth}mm`, S);
  s += vD(cx, cy, cy + ph, -18 * S, `${fs.totalHeight}mm`, S);

  if (fs.segments.length > 1) {
    let off = 12 * S;
    for (const seg of fs.segments) {
      if (seg.id !== "main-surface" && seg.id !== "left-return" && seg.id !== "right-return") {
        const st = cy + p(seg.y, scale);
        const sb = st + p(seg.height, scale);
        s += vD(cx + pw, st, sb, off, `${seg.height}mm`, S, G, 5.5);
        off += 14 * S;
      }
    }
    const ms = fs.segments.find((x) => x.id === "main-surface");
    if (ms) {
      const msx = cx + p(ms.x, scale);
      const msb = cy + p(ms.y + ms.height, scale);
      s += hD(msx, msb, msx + p(ms.width, scale), 14 * S, `${ms.width}mm`, S, G, 5.5);
    }
  }

  const rNote = rClamp > 0 ? `  |  R${rClamp}mm corners (arc ${Math.round(Math.PI * rClamp / 2)}mm)` : "";
  s += `<text x="${cx}" y="${cy + ph + 28 * S}" font-family="Arial,sans-serif" font-size="${5 * S}" fill="${LG}">5mm bend allowance per fold  |  ${fs.bendCount} bend${fs.bendCount !== 1 ? "s" : ""}  |  ${fs.thickness}mm gauge${rNote}</text>\n`;
  return s;
}

function drawPreview(w: number, d: number, cfg: WorktopConfig, ox: number, oy: number, aw: number, ah: number, S: number): string {
  let s = "";
  s += `<text x="${ox + aw / 2}" y="${oy + 10 * S}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${7 * S}" fill="${G}" letter-spacing="${S}">FINISHED PIECE</text>\n`;
  const hasBack = cfg.backUpstand.enabled || cfg.backReturn.enabled;
  const bkD = cfg.backUpstand.enabled ? cfg.backUpstand.depth : cfg.backReturn.enabled ? cfg.backReturn.depth : 0;
  const vH = d + (hasBack ? Math.min(bkD, 20) : 0);
  const tp = 22 * S;
  const pd = 18 * S;
  const sc = pickScale(aw - pd * 2, ah - tp - pd, w, vH + 40);
  const pw = p(w, sc);
  const ph = p(d, sc);
  const pcx = ox + (aw - pw) / 2;
  const pcy = oy + tp + (hasBack ? p(Math.min(bkD, 20), sc) : 0);
  const stW = Math.max(4, p(45, sc));

  // Main surface with corner radius
  if (cfg.cornerRadius > 0) {
    const rMax = Math.min(cfg.cornerRadius, w / 2, d / 2);
    const rfp = p(rMax, sc);
    const rbp = cfg.backUpstand.enabled ? 0 : p(rMax, sc);
    s += `<path d="${rrPath(pcx, pcy, pw, ph, rbp, rbp, rfp, rfp)}" fill="${FM}" stroke="${K}" stroke-width="${0.7 * S}"/>\n`;
  } else {
    s += `<rect x="${pcx}" y="${pcy}" width="${pw}" height="${ph}" fill="${FM}" stroke="${K}" stroke-width="${0.7 * S}"/>\n`;
  }
  if (hasBack) {
    const bh = p(Math.min(bkD, 20), sc);
    s += `<rect x="${pcx}" y="${pcy - bh}" width="${pw}" height="${bh}" fill="url(#ha)" stroke="${K}" stroke-width="${0.5 * S}"/>\n`;
    s += `<text x="${pcx + pw / 2}" y="${pcy - bh / 2 + 2 * S}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${4 * S}" fill="${K}">${cfg.backUpstand.enabled ? "Upstand" : "Back Return"}</text>\n`;
  }
  if (cfg.frontReturn.enabled) {
    s += `<rect x="${pcx}" y="${pcy + ph}" width="${pw}" height="${stW}" fill="url(#ha)" stroke="${K}" stroke-width="${0.4 * S}"/>\n`;
    s += `<text x="${pcx + pw / 2}" y="${pcy + ph + stW + 7 * S}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${4 * S}" fill="${G}">Front Return ${cfg.frontReturn.depth}mm</text>\n`;
  }
  if (cfg.leftReturn.enabled)
    s += `<rect x="${pcx - stW}" y="${pcy}" width="${stW}" height="${ph}" fill="url(#ha)" stroke="${K}" stroke-width="${0.4 * S}"/>\n`;
  if (cfg.rightReturn.enabled)
    s += `<rect x="${pcx + pw}" y="${pcy}" width="${stW}" height="${ph}" fill="url(#ha)" stroke="${K}" stroke-width="${0.4 * S}"/>\n`;

  if (cfg.cutout.enabled) {
    const c = cfg.cutout;
    const cx2 = pcx + p(w / 2 + c.offsetX - c.width / 2, sc);
    const cy2 = pcy + p(d / 2 + c.offsetZ - c.depth / 2, sc);
    const cw2 = p(c.width, sc);
    const ch2 = p(c.depth, sc);
    if (c.shape === "oval")
      s += `<ellipse cx="${cx2 + cw2 / 2}" cy="${cy2 + ch2 / 2}" rx="${cw2 / 2}" ry="${ch2 / 2}" fill="#fff" stroke="${K}" stroke-width="${0.5 * S}" stroke-dasharray="${4 * S},${2 * S}"/>\n`;
    else
      s += `<rect x="${cx2}" y="${cy2}" width="${cw2}" height="${ch2}" fill="#fff" stroke="${K}" stroke-width="${0.5 * S}" stroke-dasharray="${4 * S},${2 * S}"/>\n`;
  }

  s += hD(pcx, pcy + ph + (cfg.frontReturn.enabled ? stW + 12 * S : 4 * S), pcx + pw, 10 * S, `${w}mm`, S, K, 5.5);
  s += vD(pcx, pcy, pcy + ph, -10 * S, `${d}mm`, S, K, 5.5);
  s += `<text x="${ox + aw - 4 * S}" y="${oy + 10 * S}" text-anchor="end" font-family="Arial,sans-serif" font-size="${5 * S}" fill="${LG}">Scale 1:${sc}</text>\n`;
  return s;
}

/** Rectangular cutout returns — 4 pieces (shown in sidebar) */
function drawReturns(cfg: WorktopConfig, ox: number, oy: number, aw: number, ah: number, S: number): string {
  if (!cfg.cutout.enabled || !cfg.cutout.returns.enabled || cfg.cutout.shape === "oval") return "";
  const c = cfg.cutout;
  const rD = c.returns.depth;
  let s = "";
  s += `<text x="${ox + aw / 2}" y="${oy + 4 * S}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${6 * S}" fill="${K}" letter-spacing="${S}" font-weight="bold">CUTOUT RETURNS ×4</text>\n`;
  s += `<text x="${ox + aw / 2}" y="${oy + 13 * S}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${4.5 * S}" fill="${G}">(welded to cutout edges)</text>\n`;
  const to = 22 * S;
  const gap = 12 * S;
  const sc = pickScale(aw - 16 * S, ah - to - 8 * S, Math.max(c.width, c.depth * 2 + 10), rD * 3 + 30);
  const sy = oy + to;
  const mx = ox + aw / 2;
  const wW = p(c.width, sc);
  const wH = p(rD, sc);
  const wx = mx - wW / 2;
  s += `<rect x="${wx}" y="${sy}" width="${wW}" height="${wH}" fill="${FS}" stroke="${K}" stroke-width="${0.5 * S}"/>\n`;
  s += `<text x="${mx}" y="${sy + wH / 2 + 2 * S}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${4 * S}" fill="${K}">${c.width} × ${rD}</text>\n`;
  s += hD(wx, sy + wH, wx + wW, 6 * S, `${c.width}mm`, S, G, 4.5);
  const w2y = sy + wH + gap + 6 * S;
  s += `<rect x="${wx}" y="${w2y}" width="${wW}" height="${wH}" fill="${FS}" stroke="${K}" stroke-width="${0.5 * S}"/>\n`;
  s += `<text x="${mx}" y="${w2y + wH / 2 + 2 * S}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${4 * S}" fill="${K}">${c.width} × ${rD}</text>\n`;
  const nW = p(c.depth, sc);
  const nH = p(rD, sc);
  const nY = w2y + wH + gap + 4 * S;
  const pg = 8 * S;
  s += `<rect x="${mx - nW - pg / 2}" y="${nY}" width="${nW}" height="${nH}" fill="${FS}" stroke="${K}" stroke-width="${0.5 * S}"/>\n`;
  s += `<text x="${mx - nW / 2 - pg / 2}" y="${nY + nH / 2 + 2 * S}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${4 * S}" fill="${K}">${c.depth} × ${rD}</text>\n`;
  s += `<rect x="${mx + pg / 2}" y="${nY}" width="${nW}" height="${nH}" fill="${FS}" stroke="${K}" stroke-width="${0.5 * S}"/>\n`;
  s += `<text x="${mx + pg / 2 + nW / 2}" y="${nY + nH / 2 + 2 * S}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${4 * S}" fill="${K}">${c.depth} × ${rD}</text>\n`;
  s += hD(mx - nW - pg / 2, nY + nH, mx - pg / 2, 6 * S, `${c.depth}mm`, S, G, 4.5);
  s += vD(wx + wW, sy, sy + wH, 8 * S, `${rD}mm`, S, G, 4.5);
  return s;
}

/** Pre-compute extra height needed for oval cutout strips below pattern */
function ovalStripsH(cfg: WorktopConfig, aw: number, S: number): number {
  if (!cfg.cutout.enabled || !cfg.cutout.returns.enabled || cfg.cutout.shape !== "oval") return 0;
  const c = cfg.cutout;
  const circ = ellipseCirc(c.width / 2, c.depth / 2);
  const stripCount = Math.ceil(circ / 2000);
  const stripLen = circ / stripCount;
  const sc = pickScale(aw - 20 * S, 99999, stripLen, c.returns.depth);
  return 26 * S + (p(c.returns.depth, sc) + 16 * S) * stripCount;
}

/** Oval cutout circumference strips — drawn below the flat pattern with full width */
function drawOvalStrips(cfg: WorktopConfig, ox: number, oy: number, aw: number, S: number): string {
  if (!cfg.cutout.enabled || !cfg.cutout.returns.enabled || cfg.cutout.shape !== "oval") return "";
  const c = cfg.cutout;
  const rD = c.returns.depth;
  const circ = ellipseCirc(c.width / 2, c.depth / 2);
  const maxStrip = 2000;
  const stripCount = Math.ceil(circ / maxStrip);
  const stripLen = Math.round(circ / stripCount);

  let s = "";
  // Separator
  s += `<line x1="${ox + 10 * S}" y1="${oy}" x2="${ox + aw - 10 * S}" y2="${oy}" stroke="${LG}" stroke-width="${0.3 * S}" stroke-dasharray="${3 * S},${3 * S}"/>\n`;
  // Title
  s += `<text x="${ox + aw / 2}" y="${oy + 10 * S}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${6 * S}" fill="${K}" letter-spacing="${S}" font-weight="bold">OVAL CUTOUT RETURN${stripCount > 1 ? "S" : ""}</text>\n`;
  s += `<text x="${ox + aw / 2}" y="${oy + 19 * S}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${4.5 * S}" fill="${G}">(bent to oval profile — circ. ${Math.round(circ)}mm${stripCount > 1 ? `, ${stripCount} strips` : ""})</text>\n`;

  const to = 26 * S;
  const gap = 12 * S;
  const sc = pickScale(aw - 20 * S, 99999, stripLen, rD);
  const mx = ox + aw / 2;
  let sy2 = oy + to;

  for (let i = 0; i < stripCount; i++) {
    const sW = p(stripLen, sc);
    const sH = p(rD, sc);
    const sx2 = mx - sW / 2;
    s += `<rect x="${sx2}" y="${sy2}" width="${sW}" height="${sH}" fill="${FS}" stroke="${K}" stroke-width="${0.5 * S}"/>\n`;
    s += `<text x="${mx}" y="${sy2 + sH / 2 + 2 * S}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${4.5 * S}" fill="${K}">${stripLen} × ${rD}</text>\n`;
    if (stripCount > 1) {
      s += `<text x="${sx2 - 2 * S}" y="${sy2 + sH / 2 + 2 * S}" text-anchor="end" font-family="Arial,sans-serif" font-size="${3.5 * S}" fill="${G}">Strip ${i + 1}</text>\n`;
    }
    if (i === 0) {
      s += hD(sx2, sy2 + sH, sx2 + sW, 6 * S, `${stripLen}mm`, S, G, 4.5);
      s += vD(sx2 + sW, sy2, sy2 + sH, 8 * S, `${rD}mm`, S, G, 4.5);
    }
    sy2 += sH + gap;
  }
  return s;
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════

// ── Workshop print ────────────────────────────────────────────
// Fixed A4 landscape page, content scaled to fit, S = 1
// Full chrome with header, spec block, footer, preview, returns

function generateWorkshop(opt: SvgExportOptions): string {
  const { flatSheet: fs, config: cfg, finishName: fin, width: w, depth: d, thickness: th, productName: prod = "Worktop" } = opt;

  const S = 1; // chrome scale = 1 for A4

  // Fixed A4 landscape
  const pageW = 842;
  const pageH = 595;

  // Available content area
  const sp = B_SIDE * S;
  const cY = B_BORDER * S + B_HEADER * S + B_HEADER_GAP * S;
  const cX = sp;
  const sbW = B_SIDEBAR * S;
  const sbGap = B_SIDEBAR_GAP * S;
  const footH = B_FOOTER * S + B_BORDER * S;
  const contentH = pageH - cY - footH;
  const contentW = pageW - sp * 2;

  // Pattern area = content minus sidebar
  const patAreaW = contentW - sbGap - sbW;
  const patAreaH = contentH;

  // Reserve space for oval strips below pattern if needed
  const isOval = cfg.cutout.enabled && cfg.cutout.returns.enabled && cfg.cutout.shape === "oval";
  const ovalReserve = isOval ? 80 * S : 0;

  // Pick scale to fit the flat pattern into patArea with padding
  const dp = B_DPAD * S;
  const availW = patAreaW - dp * 2;
  const availH = patAreaH - dp * 2 - 36 * S - ovalReserve;
  const scale = pickScale(availW, availH, fs.totalWidth, fs.totalHeight);
  const scaleStr = `1:${scale}`;

  const sbX = cX + patAreaW + sbGap;

  // Sidebar: rectangular returns in sidebar, oval handled below pattern
  const hasRetInSidebar = cfg.cutout.enabled && cfg.cutout.returns.enabled && cfg.cutout.shape !== "oval";
  let fpH: number, rY: number, rH: number;
  if (hasRetInSidebar) {
    fpH = Math.floor(contentH * 0.50);
    rY = cY + fpH + 14 * S;
    rH = contentH - fpH - 14 * S;
  } else {
    fpH = contentH;
    rY = cY + contentH;
    rH = 0;
  }

  // Build
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pageW} ${pageH}" width="${pageW}" height="${pageH}">\n`;
  svg += `<!-- HT Workshop Print — ${new Date().toISOString()} -->\n`;
  svg += svgDefs();
  svg += svgChrome(pageW, pageH, S);
  svg += svgHeader(pageW, S, "FABRICATION DRAWING", `FLAT PATTERN  \u2014  ${scaleStr}`);
  svg += `<rect x="${cX}" y="${cY}" width="${contentW}" height="${contentH}" fill="none" stroke="#d4cfc5" stroke-width="${0.4 * S}" stroke-dasharray="${2 * S},${4 * S}" opacity="0.4"/>\n`;
  const patCentreH = isOval ? patAreaH - ovalReserve : patAreaH;
  svg += drawPattern(fs, cfg, cX, cY, scale, S, patAreaW, patCentreH);
  // Oval strips below pattern
  if (isOval) {
    const ovalY = cY + patAreaH - ovalReserve + 8 * S;
    svg += drawOvalStrips(cfg, cX, ovalY, patAreaW, S);
  }
  svg += `<line x1="${sbX - sbGap / 2}" y1="${cY + 10 * S}" x2="${sbX - sbGap / 2}" y2="${cY + contentH - 10 * S}" stroke="${LG}" stroke-width="${0.3 * S}" stroke-dasharray="${3 * S},${3 * S}"/>\n`;
  svg += drawPreview(w, d, cfg, sbX, cY, sbW, fpH, S);
  if (hasRetInSidebar) {
    svg += `<line x1="${sbX + 10 * S}" y1="${rY - 7 * S}" x2="${sbX + sbW - 10 * S}" y2="${rY - 7 * S}" stroke="${LG}" stroke-width="${0.3 * S}" stroke-dasharray="${3 * S},${3 * S}"/>\n`;
    svg += drawReturns(cfg, sbX, rY, sbW, rH, S);
  }
  svg += svgSpec(pageW, pageH, S, fin, scaleStr, th, prod, w, d);
  svg += svgFooter(pageW, pageH, S);
  svg += `</svg>`;
  return svg;
}

// ── Production print ──────────────────────────────────────────
// True 1:1 scale (1:10 for >10m), dynamic page sizing, S-factor

function generateProduction(opt: SvgExportOptions): string {
  const { flatSheet: fs, config: cfg, finishName: fin, width: w, depth: d, thickness: th, productName: prod = "Worktop" } = opt;

  // Scale: 1:1 unless > threshold
  const maxDim = Math.max(fs.totalWidth, fs.totalHeight);
  const scale = maxDim > SCALE_THRESHOLD ? 10 : 1;
  const scaleStr = scale === 1 ? "1:1" : `1:${scale}`;

  // Pattern size in pt
  const rawPW = p(fs.totalWidth, scale);
  const rawPH = p(fs.totalHeight, scale);

  // Chrome scale factor: how much bigger than A4 reference (700pt content width)
  const S = Math.min(Math.max(1, rawPW / 700), 6);

  // Compute page layout
  const dp = B_DPAD * S;
  const patW = rawPW + dp * 2;
  const basePatH = rawPH + dp * 2 + 36 * S; // notes space
  const sbW = B_SIDEBAR * S;
  const sbGap = B_SIDEBAR_GAP * S;
  const sp = B_SIDE * S;

  // Extra height for oval strips below pattern
  const isOval = cfg.cutout.enabled && cfg.cutout.returns.enabled && cfg.cutout.shape === "oval";
  const ovalExtra = isOval ? ovalStripsH(cfg, patW, S) + 12 * S : 0;
  const patH = basePatH + ovalExtra;

  const contentW = patW + sbGap + sbW;
  const contentH = Math.max(patH, 300 * S);
  const pageW = contentW + sp * 2;
  const pageH = contentH + B_BORDER * S + B_HEADER * S + B_HEADER_GAP * S + B_FOOTER * S + B_BORDER * S;

  const cX = sp;
  const cY = B_BORDER * S + B_HEADER * S + B_HEADER_GAP * S;
  const sbX = cX + patW + sbGap;

  // Sidebar: rectangular returns in sidebar, oval handled below pattern
  const hasRetInSidebar = cfg.cutout.enabled && cfg.cutout.returns.enabled && cfg.cutout.shape !== "oval";
  let fpH: number, rY: number, rH: number;
  if (hasRetInSidebar) {
    fpH = Math.floor(contentH * 0.50);
    rY = cY + fpH + 14 * S;
    rH = contentH - fpH - 14 * S;
  } else {
    fpH = contentH;
    rY = cY + contentH;
    rH = 0;
  }

  // Build
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pageW} ${pageH}" width="${pageW}" height="${pageH}">\n`;
  svg += `<!-- HT Production Print — ${new Date().toISOString()} -->\n`;
  svg += svgDefs();
  svg += svgChrome(pageW, pageH, S);
  svg += svgHeader(pageW, S, "FABRICATION DRAWING", `FLAT PATTERN  \u2014  ${scaleStr}`);
  svg += `<rect x="${cX}" y="${cY}" width="${contentW}" height="${contentH}" fill="none" stroke="#d4cfc5" stroke-width="${0.4 * S}" stroke-dasharray="${2 * S},${4 * S}" opacity="0.4"/>\n`;
  const patCentreH = isOval ? basePatH : contentH;
  svg += drawPattern(fs, cfg, cX, cY, scale, S, patW, patCentreH);
  // Oval strips below pattern
  if (isOval) {
    const ovalY = cY + basePatH + 4 * S;
    svg += drawOvalStrips(cfg, cX, ovalY, patW, S);
  }
  svg += `<line x1="${sbX - sbGap / 2}" y1="${cY + 10 * S}" x2="${sbX - sbGap / 2}" y2="${cY + contentH - 10 * S}" stroke="${LG}" stroke-width="${0.3 * S}" stroke-dasharray="${3 * S},${3 * S}"/>\n`;
  svg += drawPreview(w, d, cfg, sbX, cY, sbW, fpH, S);
  if (hasRetInSidebar) {
    svg += `<line x1="${sbX + 10 * S}" y1="${rY - 7 * S}" x2="${sbX + sbW - 10 * S}" y2="${rY - 7 * S}" stroke="${LG}" stroke-width="${0.3 * S}" stroke-dasharray="${3 * S},${3 * S}"/>\n`;
    svg += drawReturns(cfg, sbX, rY, sbW, rH, S);
  }
  svg += svgSpec(pageW, pageH, S, fin, scaleStr, th, prod, w, d);
  svg += svgFooter(pageW, pageH, S);
  svg += `</svg>`;
  return svg;
}

export function generateSvg(opt: SvgExportOptions): string {
  const mode = opt.mode ?? "production";
  return mode === "workshop" ? generateWorkshop(opt) : generateProduction(opt);
}

export function downloadSvg(opt: SvgExportOptions) {
  const svg = generateSvg(opt);
  const mode = opt.mode ?? "production";
  const suffix = mode === "workshop" ? "workshop" : "production";
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `HT-${opt.finishName}-${opt.width}x${opt.depth}-${suffix}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}
