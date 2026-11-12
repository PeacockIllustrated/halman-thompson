// Halman Thompson worktop builder.
// Three.js is loaded only when the builder scrolls near the viewport. Surface maps (normal, roughness,
// metalness) are derived from each finish's photographed swatch, so every finish uses its real colour.
const root = document.querySelector('[data-wb]');
if (root) {
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { io.disconnect(); start().catch(fail); }
  }, { rootMargin: '300px' });
  io.observe(root);
}

function fail(err) {
  console.error(err);
  const load = root.querySelector('.wb-load');
  load.classList.add('err');
  load.textContent = 'The 3D preview could not start on this device. You can still choose a size and finish, then send us the spec.';
}

const mm = (v) => v / 1000;
const fmt = (n) => n.toLocaleString('en-GB');

async function start() {
  const THREE = await import('three');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');

  const canvas = root.querySelector('.wb-canvas');
  const stage = root.querySelector('.wb-stage');
  const form = root.querySelector('.wb-panel');
  const out = (k) => root.querySelector(`[data-out="${k}"]`);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { fail(e); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#EFEAE3');
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 60);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 0.8;
  controls.maxDistance = 9;
  controls.enablePan = false;
  controls.minAzimuthAngle = -1.25; controls.maxAzimuthAngle = 1.25;
  // a slow idle sway shows the light moving across the finish, until the visitor takes over
  let sway = !reduce;
  const stopSway = () => { sway = false; };
  canvas.addEventListener('pointerdown', stopSway, { once: true });
  canvas.addEventListener('wheel', stopSway, { once: true, passive: true });

  // Light: a soft key from the window side, with a broad fill from the room environment.
  const key = new THREE.DirectionalLight('#fff4e6', 2.2);
  key.position.set(-2.5, 4.5, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  key.shadow.bias = -0.0004; key.shadow.radius = 6;
  scene.add(key);
  scene.add(new THREE.HemisphereLight('#fffaf2', '#cfc4b6', 0.35));

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: '#E4DDD3', roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wallMat = new THREE.MeshStandardMaterial({ color: '#F1ECE5', roughness: 1 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 6), wallMat);
  wall.position.set(0, 3, 0); wall.receiveShadow = true; scene.add(wall);
  const wall2 = new THREE.Mesh(new THREE.PlaneGeometry(30, 6), wallMat);
  wall2.rotation.y = Math.PI / 2; wall2.position.set(0, 3, 0); wall2.receiveShadow = true; scene.add(wall2);

  const cabMat = new THREE.MeshStandardMaterial({ color: '#2F2D2B', roughness: 0.62 });
  const seamMat = new THREE.MeshBasicMaterial({ color: '#151413' });
  const steelMat = new THREE.MeshStandardMaterial({ color: '#c9c9c7', metalness: 1, roughness: 0.28 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#0d0d0e', roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03 });
  const ringMat = new THREE.MeshStandardMaterial({ color: '#4a4a4c', roughness: 0.5 });
  const jointMat = new THREE.MeshBasicMaterial({ color: '#1d1a17', transparent: true, opacity: 0.55 });

  const metal = new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0.75, roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.1 });

  const group = new THREE.Group();
  scene.add(group);

  // ---------- finish maps from swatch photographs ----------
  const cache = new Map();
  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
  async function finishMaps(src, metalName) {
    if (cache.has(src)) return cache.get(src);
    const im = await loadImg(src);
    const S = 512;
    const c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d', { willReadFrequently: true });
    const side = Math.min(im.naturalWidth, im.naturalHeight);
    // crop to the centre of the sample so the edges of the sheet and its background are left out
    const crop = side * 0.84;
    x.drawImage(im, (im.naturalWidth - crop) / 2, (im.naturalHeight - crop) / 2, crop, crop, 0, 0, S, S);
    const src4 = x.getImageData(0, 0, S, S).data;
    const h = new Float32Array(S * S);
    for (let i = 0; i < S * S; i++) h[i] = (0.299 * src4[i * 4] + 0.587 * src4[i * 4 + 1] + 0.114 * src4[i * 4 + 2]) / 255;
    const mk = () => { const cc = document.createElement('canvas'); cc.width = cc.height = S; const cx = cc.getContext('2d'); return [cc, cx, cx.createImageData(S, S)]; };
    const [nc, nx, nd] = mk(), [rc, rx, rd] = mk(), [mc, mx, md] = mk();
    const baseMetal = metalName === 'Zinc' ? 0.55 : metalName === 'Steel' ? 0.5 : 0.85;
    const baseRough = metalName === 'Zinc' ? 0.5 : metalName === 'Steel' ? 0.55 : 0.36;
    const H = (a, b) => h[((b + S) % S) * S + ((a + S) % S)];
    for (let y = 0; y < S; y++) for (let xx = 0; xx < S; xx++) {
      const i = y * S + xx, i4 = i * 4;
      const r = src4[i4] / 255, g = src4[i4 + 1] / 255, b = src4[i4 + 2] / 255;
      const verd = Math.min(1, Math.max(0, (g + b * 0.7 - r * 1.3 + 0.05) / 0.3));
      const l = h[i];
      const rough = Math.min(1, baseRough * (1 - verd) + 0.78 * verd + (1 - l) * 0.1);
      rd.data[i4] = rd.data[i4 + 1] = rd.data[i4 + 2] = rough * 255; rd.data[i4 + 3] = 255;
      const met = baseMetal * (1 - verd) + 0.2 * verd;
      md.data[i4] = md.data[i4 + 1] = md.data[i4 + 2] = met * 255; md.data[i4 + 3] = 255;
      const dX = (H(xx + 1, y - 1) + 2 * H(xx + 1, y) + H(xx + 1, y + 1)) - (H(xx - 1, y - 1) + 2 * H(xx - 1, y) + H(xx - 1, y + 1));
      const dY = (H(xx - 1, y + 1) + 2 * H(xx, y + 1) + H(xx + 1, y + 1)) - (H(xx - 1, y - 1) + 2 * H(xx, y - 1) + H(xx + 1, y - 1));
      const k = 1.6, X = -dX * k, Y = -dY * k, L = Math.hypot(X, Y, 1);
      nd.data[i4] = (X / L * 0.5 + 0.5) * 255; nd.data[i4 + 1] = (Y / L * 0.5 + 0.5) * 255; nd.data[i4 + 2] = (1 / L * 0.5 + 0.5) * 255; nd.data[i4 + 3] = 255;
    }
    nx.putImageData(nd, 0, 0); rx.putImageData(rd, 0, 0); mx.putImageData(md, 0, 0);
    const tex = (cv, srgb) => {
      const t = new THREE.CanvasTexture(cv);
      t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    };
    const maps = { map: tex(c, true), normalMap: tex(nc), roughnessMap: tex(rc), metalnessMap: tex(mc) };
    cache.set(src, maps);
    return maps;
  }

  // ---------- state ----------
  const S = { shape: 'straight', w: 2400, d: 620, r: 1600, t: 40, sink: true, hob: true, upstand: false, lq: 'Gloss', fin: null, metal: 'Copper', tex: null };
  const finBtns = [...root.querySelectorAll('.wb-fin')];
  const pick = finBtns.find((b) => b.getAttribute('aria-pressed') === 'true') || finBtns[0];
  S.fin = pick.dataset.name; S.metal = pick.dataset.metal; S.tex = pick.dataset.tex;

  const disposeGroup = () => {
    group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    group.clear();
  };
  const rr = (shape, x, y, w, h, r) => { // rounded rectangle path, used for holes
    shape.moveTo(x + r, y); shape.lineTo(x + w - r, y); shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r); shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h); shape.quadraticCurveTo(x, y + h, x, y + h - r); shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  };
  const box = (w, h, d, mat, x, y, z, cast = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; group.add(m); return m;
  };

  const TOP = 0.9; // worktop surface height in metres
  function build() {
    disposeGroup();
    const w = mm(S.w), d = mm(S.d), t = mm(S.t), r = mm(S.r);
    const island = S.shape === 'island', L = S.shape === 'l';
    // Outline in shape space: x along the run, y from the front edge (0) to the back (d). After rotation y points into the room.
    const sh = new THREE.Shape();
    if (L) { sh.moveTo(0, d - r); sh.lineTo(d, d - r); sh.lineTo(d, 0); sh.lineTo(w, 0); sh.lineTo(w, d); sh.lineTo(0, d); sh.lineTo(0, d - r); }
    else { sh.moveTo(0, 0); sh.lineTo(w, 0); sh.lineTo(w, d); sh.lineTo(0, d); sh.lineTo(0, 0); }
    const run0 = L ? d : 0, runLen = w - run0;
    const sinkW = 0.76, sinkD = Math.min(0.44, d - 0.16), hobW = 0.59, hobD = Math.min(0.52, d - 0.1);
    const fitsBoth = runLen > 1.75, fitsSink = runLen > 0.95 && d >= 0.45;
    const sinkOn = S.sink && fitsSink, hobOn = S.hob && (fitsBoth || (!sinkOn && runLen > 0.8)) && d >= 0.5;
    const sinkX = run0 + (hobOn ? runLen * 0.3 : runLen * 0.5) - sinkW / 2, sinkY = (d - sinkD) / 2 + 0.01;
    const hobX = run0 + (sinkOn ? runLen * 0.74 : runLen * 0.5) - hobW / 2, hobY = (d - hobD) / 2;
    if (sinkOn) sh.holes.push(rr(new THREE.Path(), sinkX, sinkY, sinkW, sinkD, 0.025));
    const geo = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 2, curveSegments: 8 });
    geo.rotateX(-Math.PI / 2);
    // shape y=0 (front) should face the viewer (+z): after rotateX(-90deg) y maps to -z, so the front sits at z=0 and the back at z=-d.
    const ox = -w / 2, oz = island ? d / 2 : 0;
    const top = new THREE.Mesh(geo, metal);
    top.position.set(ox, TOP - t, oz);
    top.castShadow = true; top.receiveShadow = true; group.add(top);

    // carcass under the worktop
    const cabH = TOP - t - 0.1, inset = 0.03;
    const cabs = L ? [[w, d - inset, 0, -d / 2 + inset / 2], [d - inset, r - d, ox + (d - inset) / 2, (r - d) / 2]]
                   : [[w - (island ? 0.06 : 0), d - inset * (island ? 2 : 1), 0, oz - d / 2 + (island ? 0 : inset / 2)]];
    for (const [cw, cd, cx, cz] of cabs) {
      box(cw, cabH, cd - 0.02, cabMat, cx, 0.1 + cabH / 2, cz - 0.01);
      box(cw - 0.08, 0.1, cd - 0.1, seamMat, cx, 0.05, cz - 0.04, false); // recessed plinth
    }
    // door seams on the front of the main run
    const nDoors = Math.max(1, Math.round(runLen / 0.6));
    const fz = (island ? oz : 0) - inset - 0.0005;
    for (let i = 1; i < nDoors; i++) box(0.003, cabH - 0.01, 0.002, seamMat, ox + run0 + (runLen / nDoors) * i, 0.1 + cabH / 2, fz + 0.001, false);
    box(Math.min(w, runLen) - 0.01, 0.003, 0.002, seamMat, ox + run0 + runLen / 2, 0.1 + cabH - 0.17, fz + 0.001, false);

    // sink basin
    if (sinkOn) {
      const bx = ox + sinkX + sinkW / 2, bz = oz - (sinkY + sinkD / 2), depth = 0.2;
      const y0 = TOP - t - depth;
      box(sinkW, 0.004, sinkD, steelMat, bx, y0, bz, false);
      box(sinkW, depth, 0.004, steelMat, bx, y0 + depth / 2, bz + sinkD / 2, false);
      box(sinkW, depth, 0.004, steelMat, bx, y0 + depth / 2, bz - sinkD / 2, false);
      box(0.004, depth, sinkD, steelMat, bx - sinkW / 2, y0 + depth / 2, bz, false);
      box(0.004, depth, sinkD, steelMat, bx + sinkW / 2, y0 + depth / 2, bz, false);
      const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.006, 32), steelMat);
      drain.position.set(bx, y0 + 0.004, bz); group.add(drain);
      // tap
      const tap = new THREE.Group();
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.3, 24), steelMat); pillar.position.y = 0.15; tap.add(pillar);
      const spout = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 12, 32, Math.PI), steelMat); spout.position.set(0, 0.3, 0.1); spout.rotation.y = Math.PI / 2; tap.add(spout);
      tap.position.set(bx, TOP, bz - sinkD / 2 - 0.06);
      tap.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      group.add(tap);
    }
    // hob
    if (hobOn) {
      const hx = ox + hobX + hobW / 2, hz = oz - (hobY + hobD / 2);
      box(hobW, 0.006, hobD, glassMat, hx, TOP + 0.003, hz, false);
      for (const [a, b, rad] of [[-0.14, -0.12, 0.09], [0.14, -0.12, 0.07], [-0.14, 0.12, 0.07], [0.14, 0.12, 0.09]]) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(rad - 0.004, rad, 48), ringMat);
        ring.rotation.x = -Math.PI / 2; ring.position.set(hx + a, TOP + 0.0065, hz + b); group.add(ring);
      }
    }
    // upstand along the walls
    if (S.upstand && !island) {
      const uh = 0.1, ut = 0.012;
      const ug = new THREE.BoxGeometry(w, uh, ut);
      const u = new THREE.Mesh(ug, metal); u.position.set(0, TOP + uh / 2, -d + ut / 2); u.castShadow = true; group.add(u);
      if (L) { const u2 = new THREE.Mesh(new THREE.BoxGeometry(ut, uh, r - ut), metal); u2.position.set(ox + ut / 2, TOP + uh / 2, (r - 2 * d) / 2 + ut / 2); u2.castShadow = true; group.add(u2); }
    }
    // panel joints: sheets are made up to 2000 x 1000mm, so longer runs are joined and aged together
    const joints = [];
    if (L) joints.push(['z', ox + d]);
    const nPanels = Math.ceil(runLen / 2.0);
    for (let i = 1; i < nPanels; i++) joints.push(['z', ox + run0 + (runLen / nPanels) * i]);
    for (const [, jx] of joints) {
      const j = new THREE.Mesh(new THREE.PlaneGeometry(0.0016, d), jointMat);
      j.rotation.x = -Math.PI / 2; j.position.set(jx, TOP + 0.0012, oz - d / 2); group.add(j);
    }

    // walls and the scale of the room
    wall.visible = wall2.visible = !island;
    controls.minAzimuthAngle = island ? -Infinity : -1.3; controls.maxAzimuthAngle = island ? Infinity : 1.3;
    wall.position.z = -d - 0.001;
    wall2.position.x = ox - 0.001; wall2.visible = L;
    wall2.position.z = -d + 15;

    // texture scale: one photographed sample covers about 450mm of sheet
    const rep = 1 / 0.45;
    for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) if (metal[k]) metal[k].repeat.set(rep, rep);

    const parts = L ? 2 + (nPanels - 1) : nPanels;
    out('dims').textContent = L ? `${fmt(S.w)} × ${fmt(S.r)} × ${fmt(S.d)}mm, ${S.t}mm edge` : `${fmt(S.w)} × ${fmt(S.d)}mm, ${S.t}mm edge`;
    const notes = [];
    if (parts > 1) notes.push(`Made in ${parts} panels (our sheets go up to 2,000 × 1,000mm), aged together so the finish runs on across the joins.`);
    if (S.d > 1000) notes.push('Over 1,000mm deep, we join the top along its length as well.');
    if (S.sink && !sinkOn) notes.push('The run is too short for a sink cut-out at this size.');
    if (S.hob && !hobOn) notes.push('There isn’t room for a hob cut-out alongside the sink at this length.');
    out('note').textContent = notes.join(' ');
    S.panels = parts; S.sinkOn = sinkOn; S.hobOn = hobOn;
    frame(false);
    dirty = 3;
  }

  function lacquer() {
    const gloss = S.lq === 'Gloss';
    metal.clearcoat = gloss ? 1 : 0.35;
    metal.clearcoatRoughness = gloss ? 0.06 : 0.55;
    metal.roughness = 1; // the roughness map carries the real value
    metal.needsUpdate = true; dirty = 3;
  }

  async function applyFinish() {
    stage.classList.add('busy');
    const maps = await finishMaps(S.tex, S.metal);
    Object.assign(metal, maps);
    metal.metalness = 1; metal.needsUpdate = true;
    build();
    stage.classList.remove('busy');
    out('fin').textContent = S.fin;
  }

  // ---------- camera ----------
  let view = 'persp';
  const target = new THREE.Vector3(), camGoal = new THREE.Vector3();
  let tween = null;
  function frame(animate = true) {
    const b = new THREE.Box3().setFromObject(group);
    const c = b.getCenter(new THREE.Vector3()), sz = b.getSize(new THREE.Vector3());
    const span = Math.max(sz.x, sz.z * 1.4, 1.2);
    const dist = span / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * (camera.aspect < 0.95 ? 2.1 : camera.aspect < 1.2 ? 1.7 : 1.15);
    target.set(c.x, TOP - 0.15, c.z);
    if (view === 'top') camGoal.set(c.x, TOP + dist * 1.05, c.z + dist * 0.18);
    else if (view === 'front') camGoal.set(c.x, TOP + 0.25, c.z + dist);
    else camGoal.set(c.x + dist * 0.42, TOP + dist * 0.5, c.z + dist * 0.82);
    if (!animate || reduce) { camera.position.copy(camGoal); controls.target.copy(target); controls.update(); return; }
    tween = { from: camera.position.clone(), fromT: controls.target.clone(), t0: performance.now(), dur: 700 };
  }

  // ---------- inputs ----------
  const sync = () => {
    out('w').textContent = `${fmt(S.w)}mm`; out('d').textContent = `${fmt(S.d)}mm`; out('r').textContent = `${fmt(S.r)}mm`; out('t').textContent = `${S.t}mm`;
    root.querySelectorAll('[data-only="l"]').forEach((el) => { el.hidden = S.shape !== 'l'; });
  };
  let raf = 0;
  const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { sync(); build(); }); };
  form.addEventListener('input', (e) => {
    const el = e.target;
    if (el.name === 'shape') { S.shape = el.value; view = 'persp'; setViewBtns(); schedule(); frameSoon(); return; }
    if (el.name === 'lq') { S.lq = el.value; lacquer(); return; }
    if (['w', 'd', 'r', 't'].includes(el.name)) S[el.name] = +el.value;
    if (['sink', 'hob', 'upstand'].includes(el.name)) S[el.name] = el.checked;
    if (S.shape === 'l' && S.r <= S.d + 200) { S.r = S.d + 200; form.r.value = S.r; }
    schedule();
  });
  let ft = 0; const frameSoon = () => { clearTimeout(ft); ft = setTimeout(() => frame(true), 60); };
  form.addEventListener('change', (e) => { if (['w', 'd', 'r', 'shape'].includes(e.target.name)) frameSoon(); });
  finBtns.forEach((b) => b.addEventListener('click', () => {
    finBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    S.fin = b.dataset.name; S.metal = b.dataset.metal; S.tex = b.dataset.tex;
    applyFinish().catch(fail);
  }));
  const viewBtns = [...root.querySelectorAll('[data-view]')];
  const setViewBtns = () => viewBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
  viewBtns.forEach((b) => b.addEventListener('click', () => { view = b.dataset.view; setViewBtns(); sway = false; frame(true); }));

  root.querySelector('[data-send]').addEventListener('click', () => {
    const q = (id) => document.getElementById(id);
    const shape = { straight: 'Straight run', l: 'L-shape', island: 'Island' }[S.shape];
    const size = S.shape === 'l' ? `${S.w} × ${S.r} (return) × ${S.d} deep` : `${S.w} × ${S.d}`;
    if (q('b-type')) q('b-type').value = 'Worktop or bar top';
    if (q('b-finish')) q('b-finish').value = S.fin;
    if (q('b-size')) q('b-size').value = size;
    const parts = [`${shape} worktop in ${S.fin}, ${S.lq.toLowerCase()} lacquer.`, `Size: ${size}mm with a ${S.t}mm edge.`,
      S.sinkOn ? 'Sink cut-out.' : '', S.hobOn ? 'Hob cut-out.' : '', S.upstand && S.shape !== 'island' ? '100mm upstand.' : '',
      S.panels > 1 ? `Made in ${S.panels} panels.` : ''].filter(Boolean);
    if (q('b-msg')) q('b-msg').value = parts.join(' ');
    const dest = document.getElementById('quote');
    dest.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => q('b-name') && q('b-name').focus({ preventScroll: true }), 600);
  });

  // ---------- size and loop ----------
  let dirty = 3, visible = true;
  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix(); frame(false); dirty = 3;
  };
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(stage);
  controls.addEventListener('change', () => { dirty = 2; });
  const ease = (x) => 1 - Math.pow(1 - x, 3);
  function loop(now) {
    requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    if (tween) {
      const k = Math.min(1, (now - tween.t0) / tween.dur), e = ease(k);
      camera.position.lerpVectors(tween.from, camGoal, e); controls.target.lerpVectors(tween.fromT, target, e);
      if (k === 1) tween = null; dirty = 2;
    }
    if (sway && !tween && view === 'persp') {
      const a = Math.sin(now / 5200) * 0.32, off = camGoal.clone().sub(target);
      off.applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
      camera.position.copy(target).add(off); controls.target.copy(target); dirty = Math.max(dirty, 1);
    }
    if (controls.update()) dirty = Math.max(dirty, 1);
    if (dirty > 0) { renderer.render(scene, camera); dirty--; }
  }

  sync();
  lacquer();
  await applyFinish();
  resize();
  // arrive from a little further out
  if (!reduce) { camera.position.multiplyScalar(1.35); frame(true); }
  requestAnimationFrame(loop);
  root.classList.add('ready');
}
