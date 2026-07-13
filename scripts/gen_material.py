#!/usr/bin/env python3
"""
HT Fabrication Visualiser — procedural PBR albedo generator.

Produces a SEAMLESS (tileable) albedo texture + swatch for a named finish, in
the same shape as the three hand-set-up examples (northumberland / ayrshire /
antique-brass): the app derives normal/roughness/metalness at runtime from the
albedo (see src/components/three/MetalMaterial.tsx::generatePBRMaps), so the
only artifact a finish needs is a good seamless albedo (+ a swatch crop).

This script also emits PREVIEW normal/roughness/metalness maps (a faithful port
of the runtime generatePBRMaps) so we can eyeball what the configurator will
actually render — those previews are NOT shipped; the app makes them live.

Usage:
  python3 scripts/gen_material.py <recipe> --seed N --out DIR [--size 1024]
  python3 scripts/gen_material.py --seamless SRC.png --out DIR   # tile an AI base
"""
import argparse, os
import numpy as np
from PIL import Image

# ─────────────────────────────────────────────────────────────────────────────
# Tileable value-noise fBm (period wraps → the whole texture tiles seamlessly)
# ─────────────────────────────────────────────────────────────────────────────
def _fade(t):  # quintic smootherstep
    return t * t * t * (t * (t * 6 - 15) + 10)

def _tileable_noise(n, period, rng):
    period = max(2, int(period))
    lat = rng.random((period, period)).astype(np.float32)
    u = (np.arange(n, dtype=np.float32) / n) * period
    i0 = np.floor(u).astype(int) % period
    i1 = (i0 + 1) % period
    f = _fade(u - np.floor(u))
    X0, Y0 = np.meshgrid(i0, i0); X1, Y1 = np.meshgrid(i1, i1)
    FX, FY = np.meshgrid(f, f)
    v00 = lat[Y0, X0]; v10 = lat[Y0, X1]; v01 = lat[Y1, X0]; v11 = lat[Y1, X1]
    top = v00 * (1 - FX) + v10 * FX
    bot = v01 * (1 - FX) + v11 * FX
    return top * (1 - FY) + bot * FY

def fbm(n, base_period, octaves, rng, persistence=0.5, lacunarity=2.0):
    total = np.zeros((n, n), np.float32); amp = 1.0; freq = base_period; norm = 0.0
    for _ in range(octaves):
        total += amp * _tileable_noise(n, round(freq), rng)
        norm += amp; amp *= persistence; freq *= lacunarity
    return total / norm

def ridged(n, base_period, octaves, rng):
    f = fbm(n, base_period, octaves, rng)
    return 1.0 - np.abs(2.0 * f - 1.0)

def _tileable_noise_1d(n, period, rng):
    period = max(2, int(period))
    lat = rng.random(period).astype(np.float32)
    u = (np.arange(n, dtype=np.float32) / n) * period
    i0 = np.floor(u).astype(int) % period
    i1 = (i0 + 1) % period
    f = _fade(u - np.floor(u))
    return lat[i0] * (1 - f) + lat[i1] * f

def fbm_1d(n, base_period, octaves, rng, persistence=0.5, lacunarity=2.0):
    total = np.zeros(n, np.float32); amp = 1.0; freq = base_period; norm = 0.0
    for _ in range(octaves):
        total += amp * _tileable_noise_1d(n, round(freq), rng)
        norm += amp; amp *= persistence; freq *= lacunarity
    return total / norm

def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a + 1e-9), 0, 1)
    return t * t * (3 - 2 * t)

def _lerp(c0, c1, t):
    t = t[..., None]
    return np.array(c0)[None, None, :] * (1 - t) + np.array(c1)[None, None, :] * t

# ─────────────────────────────────────────────────────────────────────────────
# Finish recipes — palette (sRGB 0..1) + patina character.
# ─────────────────────────────────────────────────────────────────────────────
RECIPES = {
    # Deep aged copper: warm amber base, burnished patches, moderate verdigris
    # speckle (its own character vs. Northumberland's heavier turquoise drift).
    "hertfordshire": {
        "dark":  (0.33, 0.18, 0.10),   # deep copper recess (kept off pure black)
        "mid":   (0.62, 0.35, 0.17),   # aged copper body
        "hi":    (0.88, 0.60, 0.36),   # burnished copper highlight
        "verd_bright": (0.17, 0.70, 0.66),
        "verd_dark":   (0.10, 0.42, 0.46),
        "verd_amount": 0.45, "burnish_amount": 0.58, "grain_amount": 0.30,
    },
    # Northumberland-style calibration target: brighter copper, heavy turquoise.
    "northumberland_like": {
        "dark":  (0.28, 0.15, 0.08),
        "mid":   (0.66, 0.38, 0.19),
        "hi":    (0.88, 0.62, 0.38),
        "verd_bright": (0.20, 0.66, 0.64),
        "verd_dark":   (0.09, 0.40, 0.44),
        "verd_amount": 0.62, "burnish_amount": 0.55, "grain_amount": 0.32,
    },
    "corten-weathered": {  # weathered corten steel — orange/brown rust, no teal
        "dark":  (0.18, 0.09, 0.05),
        "mid":   (0.50, 0.26, 0.14),
        "hi":    (0.70, 0.42, 0.23),
        "verd_bright": (0.34, 0.18, 0.11),
        "verd_dark":   (0.16, 0.08, 0.05),
        "verd_amount": 0.30, "burnish_amount": 0.22, "grain_amount": 0.42,
    },
    "lightly-aged-zinc": {  # cool mottled grey with faint patina
        "dark":  (0.30, 0.32, 0.34),
        "mid":   (0.54, 0.57, 0.59),
        "hi":    (0.78, 0.81, 0.83),
        "verd_bright": (0.42, 0.54, 0.54),
        "verd_dark":   (0.26, 0.34, 0.36),
        "verd_amount": 0.16, "burnish_amount": 0.45, "grain_amount": 0.20,
    },
    # Directional/anisotropic finishes — fine horizontal brush striations.
    "brushed-copper": {
        "brushed": True,
        "shadow": (0.42, 0.24, 0.13),
        "base":   (0.74, 0.47, 0.27),
        "hi":     (0.94, 0.69, 0.45),
    },
}

def generate_brushed(recipe_name, size, seed):
    """Fine directional (horizontal) brushed metal. Variation runs across the
    brush direction (row to row) → long thin striations; broadcasting one axis
    keeps it perfectly seamless both ways."""
    r = RECIPES[recipe_name]
    rng = np.random.default_rng(seed)
    n = size

    fine  = fbm_1d(n, n // 2, 5, rng, persistence=0.65)  # dense fine striations
    hair  = _tileable_noise_1d(n, n, rng)                 # per-row micro hairlines
    broad = fbm_1d(n, 8, 2, rng)                          # gentle long tonal drift
    lines = 0.70 * fine + 0.18 * hair + 0.12 * broad
    lines = (lines - lines.min()) / (np.ptp(lines) + 1e-9)
    linesY = lines[:, None] * np.ones(n, np.float32)[None, :]
    tone   = smoothstep(0.2, 0.85, fbm(n, 4, 3, rng))     # very gentle sheet sheen
    breakx = fbm(n, 6, 2, rng)                            # faint along-brush variation
    micro  = fbm(n, 240, 2, rng)                          # tiny sparkle

    bright = np.clip(
        0.5 + (linesY - 0.5) * 1.5 + (tone - 0.5) * 0.14
        + (breakx - 0.5) * 0.06 + (micro - 0.5) * 0.10, 0, 1)

    col = _lerp(r["shadow"], r["base"], smoothstep(0.18, 0.6, bright))
    hi_m = smoothstep(0.6, 0.96, bright)
    col = col * (1 - hi_m[..., None]) + np.array(r["hi"])[None, None, :] * hi_m[..., None]
    col = col + rng.normal(0, 0.004, col.shape).astype(np.float32)
    return np.clip(col, 0, 1)

def generate_albedo(recipe_name, size, seed):
    r = RECIPES[recipe_name]
    rng = np.random.default_rng(seed)
    n = size

    age   = smoothstep(0.22, 0.9, fbm(n, 4, 6, rng))  # large-scale aging tone
    mid   = fbm(n, 9, 5, rng)                          # medium mottle
    grain = fbm(n, 60, 5, rng)                         # fine relief
    micro = fbm(n, 160, 4, rng)                        # crystalline micro-detail
    tone  = np.clip(0.45 * age + 0.35 * mid + 0.2 * grain, 0, 1)

    # ── Copper body: dark oxide → mid copper → burnished highlight ──
    col = _lerp(r["dark"], r["mid"], smoothstep(0.15, 0.6, tone))
    burnish = smoothstep(0.70, 0.98, 0.6 * age + 0.4 * mid) * r["burnish_amount"]
    col = col * (1 - burnish[..., None]) + np.array(r["hi"])[None, None, :] * burnish[..., None]

    # ── Verdigris: fine crystalline speckle pooled along mid-freq drifts ──
    if r["verd_amount"] > 0:
        drift   = smoothstep(0.3, 0.8, fbm(n, 6, 4, rng))
        speck   = smoothstep(0.55, 0.85, micro)               # crystalline grains
        crackle = smoothstep(0.55, 0.92, ridged(n, 28, 3, rng))  # vein networks
        vmask = np.clip((0.5 + 0.5 * drift) * (0.75 * speck + 0.55 * crackle) * (1 - 0.7 * burnish), 0, 1)
        vmask = vmask * r["verd_amount"]
        vcol = _lerp(r["verd_dark"], r["verd_bright"], grain)
        col = col * (1 - vmask[..., None]) + vcol * vmask[..., None]

    # ── Micro grain brightness + dark pits (feeds the runtime Sobel normal) ──
    g = r["grain_amount"]
    col = col * (1.0 - g * 0.4 + g * 0.8 * micro[..., None])
    pits = smoothstep(0.86, 0.98, micro) * 0.3
    col = col * (1 - pits[..., None])
    col = col + rng.normal(0, 0.005, col.shape).astype(np.float32)

    return np.clip(col, 0, 1)

# ─────────────────────────────────────────────────────────────────────────────
# Faithful preview of the runtime generatePBRMaps (for QA only, not shipped)
# ─────────────────────────────────────────────────────────────────────────────
def preview_pbr(albedo, normal_strength=1.5):
    rr, gg, bb = albedo[..., 0], albedo[..., 1], albedo[..., 2]
    luma = 0.299 * rr + 0.587 * gg + 0.114 * bb
    greenness = gg + bb * 0.7 - rr * 1.3
    verd = np.clip((greenness + 0.05) / 0.3, 0, 1)
    rough = np.clip(0.4 * (1 - verd) + 0.75 * verd + (1 - luma) * 0.08, 0, 1)
    metal = 0.7 * (1 - verd) + 0.25 * verd
    h = luma
    def s(dx, dy): return np.roll(np.roll(h, -dy, axis=0), -dx, axis=1)
    dX = (s(1,-1) + 2*s(1,0) + s(1,1)) - (s(-1,-1) + 2*s(-1,0) + s(-1,1))
    dY = (s(-1,1) + 2*s(0,1) + s(1,1)) - (s(-1,-1) + 2*s(0,-1) + s(1,-1))
    nx = -dX * normal_strength; ny = -dY * normal_strength; nz = np.ones_like(nx)
    ln = np.sqrt(nx*nx + ny*ny + nz*nz)
    normal = np.stack([(nx/ln)*0.5+0.5, (ny/ln)*0.5+0.5, (nz/ln)*0.5+0.5], -1)
    return normal, rough, metal

def to_img(arr):
    if arr.ndim == 2:
        arr = np.stack([arr]*3, -1)
    return Image.fromarray((np.clip(arr,0,1)*255).astype(np.uint8))

def make_swatch(albedo, size=512):
    img = to_img(albedo)
    w, _ = img.size
    c = int(w*0.55)
    x0 = (w-c)//2
    return img.crop((x0, x0, x0+c, x0+c)).resize((size, size), Image.LANCZOS)

def make_seamless(src_path, size):
    """Offset-by-half + feather the seam — the 'clean up the edges' step for an
    arbitrary (AI-generated) base image."""
    img = Image.open(src_path).convert("RGB").resize((size, size), Image.LANCZOS)
    a = np.asarray(img, np.float32) / 255.0
    off = np.roll(np.roll(a, size//2, 0), size//2, 1)   # bring seams to the centre
    feather = size // 8
    ramp = np.ones(size, np.float32)
    x = np.linspace(0, 1, feather)
    ramp[:feather] = x; ramp[-feather:] = x[::-1]
    mask = np.minimum(ramp[None, :], ramp[:, None])[..., None]  # low at centre cross
    blended = off * mask + np.roll(np.roll(off, size//2, 0), size//2, 1) * (1 - mask)
    return np.clip(blended, 0, 1)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("recipe", nargs="?")
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--size", type=int, default=1024)
    ap.add_argument("--out", required=True)
    ap.add_argument("--seamless")
    ap.add_argument("--previews", action="store_true")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    if args.seamless:
        albedo = make_seamless(args.seamless, args.size)
    elif RECIPES.get(args.recipe, {}).get("brushed"):
        albedo = generate_brushed(args.recipe, args.size, args.seed)
    else:
        albedo = generate_albedo(args.recipe, args.size, args.seed)

    to_img(albedo).save(os.path.join(args.out, "albedo.png"))
    make_swatch(albedo).save(os.path.join(args.out, "swatch.png"))
    if args.previews:
        normal, rough, metal = preview_pbr(albedo)
        to_img(normal).save(os.path.join(args.out, "_preview_normal.png"))
        to_img(rough).save(os.path.join(args.out, "_preview_roughness.png"))
        to_img(metal).save(os.path.join(args.out, "_preview_metalness.png"))
    print("wrote", args.out)

if __name__ == "__main__":
    main()
