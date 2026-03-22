/**
 * Flowing noise GLSL shaders for the homepage hero background.
 * Perlin-style simplex noise creates organic molten-metal gradients
 * in copper/gold/brass tones on dark navy.
 */

export const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform float uSpeed;

varying vec2 vUv;

// ─── Simplex 3D noise (Ashima / webgl-noise) ───────────────────

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// ─── FBM (Fractal Brownian Motion) ──────────────────────────────

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 4; i++) {
    value += amplitude * snoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value;
}

// ─── Colour palette ─────────────────────────────────────────────

vec3 palette(float t) {
  // Dark navy → copper → gold → brass → dark navy
  vec3 navy   = vec3(0.102, 0.102, 0.180);  // #1a1a2e
  vec3 copper = vec3(0.722, 0.451, 0.200);  // #b87333
  vec3 gold   = vec3(0.722, 0.525, 0.043);  // #b8860b
  vec3 brass  = vec3(0.804, 0.608, 0.114);  // #cd9b1d

  t = fract(t);
  if (t < 0.2) return mix(navy, copper, smoothstep(0.0, 0.2, t));
  if (t < 0.4) return mix(copper, gold, smoothstep(0.2, 0.4, t));
  if (t < 0.6) return mix(gold, brass, smoothstep(0.4, 0.6, t));
  if (t < 0.8) return mix(brass, copper, smoothstep(0.6, 0.8, t));
  return mix(copper, navy, smoothstep(0.8, 1.0, t));
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;
  uv.x *= aspect;

  float t = uTime * uSpeed;

  // Layer 1: slow large-scale noise for base colour
  float n1 = fbm(vec3(uv * 1.5, t * 0.3));

  // Layer 2: medium detail with offset
  float n2 = fbm(vec3(uv * 3.0 + 5.0, t * 0.2 + 10.0));

  // Layer 3: fine detail for metallic shimmer
  float n3 = snoise(vec3(uv * 8.0, t * 0.15)) * 0.15;

  // Combine noise layers
  float combined = n1 * 0.6 + n2 * 0.3 + n3;

  // Map to colour palette
  vec3 color = palette(combined * 0.5 + 0.5);

  // Darken base — keep it subtle, predominantly navy
  color = mix(vec3(0.102, 0.102, 0.180), color, 0.35);

  // Vignette — darken edges
  vec2 vig = vUv * (1.0 - vUv);
  float vignette = vig.x * vig.y * 15.0;
  vignette = clamp(pow(vignette, 0.25), 0.0, 1.0);
  color *= mix(0.4, 1.0, vignette);

  gl_FragColor = vec4(color, 1.0);
}
`;
