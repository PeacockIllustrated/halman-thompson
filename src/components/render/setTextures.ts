"use client";

import * as THREE from "three";

/** Deterministic PRNG so every render of a shot is identical */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toTexture(canvas: HTMLCanvasElement, repeat: [number, number], srgb = true) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 8;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft mottled limewash / plaster: layered blotches over a base tone */
export function plasterTexture(base: string, seed = 7, repeat: [number, number] = [2, 1]) {
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = 20 + rnd() * 140;
    const light = rnd() > 0.5;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const a = 0.012 + rnd() * 0.03;
    g.addColorStop(0, light ? `rgba(255,250,240,${a})` : `rgba(40,30,20,${a})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    // draw wrapped so the tile is seamless
    for (const dx of [-size, 0, size])
      for (const dy of [-size, 0, size]) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
  }
  // fine grain
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rnd() - 0.5) * 10;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(c, repeat);
}

/** Wide oak boards with grain streaks and per-board tone variation */
export function oakTexture(seed = 3, repeat: [number, number] = [3, 3]) {
  const w = 1024;
  const h = 1024;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(seed);
  const boards = 5;
  const bw = w / boards;
  for (let b = 0; b < boards; b++) {
    const tone = 0.85 + rnd() * 0.3;
    const r = Math.round(118 * tone);
    const g = Math.round(92 * tone);
    const bl = Math.round(70 * tone);
    ctx.fillStyle = `rgb(${r},${g},${bl})`;
    ctx.fillRect(b * bw, 0, bw, h);
    // grain
    for (let i = 0; i < 140; i++) {
      const x = b * bw + rnd() * bw;
      ctx.strokeStyle = `rgba(${rnd() > 0.5 ? "60,40,25" : "190,150,110"},${0.05 + rnd() * 0.12})`;
      ctx.lineWidth = 0.5 + rnd() * 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      let xx = x;
      for (let y = 0; y <= h; y += 32) {
        xx += (rnd() - 0.5) * 3;
        ctx.lineTo(Math.min(Math.max(xx, b * bw), (b + 1) * bw), y);
      }
      ctx.stroke();
    }
    // board seam
    ctx.fillStyle = "rgba(30,20,12,0.6)";
    ctx.fillRect(b * bw, 0, 2, h);
    // butt joint somewhere along the board
    const jy = rnd() * h;
    ctx.fillRect(b * bw, jy, bw, 2);
  }
  return toTexture(c, repeat);
}

/** Subtle vertical brush grain for painted timber */
export function paintedTimberTexture(base: string, seed = 11, repeat: [number, number] = [1, 1]) {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 400; i++) {
    const x = rnd() * size;
    ctx.strokeStyle = `rgba(${rnd() > 0.5 ? "255,255,255" : "0,0,0"},${0.006 + rnd() * 0.012})`;
    ctx.lineWidth = 1 + rnd() * 3;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (rnd() - 0.5) * 6, size);
    ctx.stroke();
  }
  return toTexture(c, repeat);
}
