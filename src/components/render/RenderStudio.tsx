"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, RoundedBox } from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  N8AO,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import * as THREE from "three";
import { WorktopModel } from "@/components/three/WorktopModel";
import { useConfiguratorStore } from "@/stores/configurator";
import { getFinishBySlug } from "@/lib/products/finishes";
import { SHOTS, getShot, type RenderShot, type SetStyle } from "./shots";
import { oakTexture, paintedTimberTexture, plasterTexture } from "./setTextures";

const S = 0.01; // mm → scene units
const FLOOR_Y = -9.0; // 900mm worktop height
const ACES_FILMIC = 6; // postprocessing ToneMappingMode.ACES_FILMIC

const CANVAS_SIZE: Record<RenderShot["aspect"], [number, number]> = {
  landscape: [1600, 1000],
  portrait: [1000, 1250],
  square: [1200, 1200],
};

interface SetLook {
  wall: string;
  floor: "oak" | "stone" | "cyc";
  cabinet: string;
  doorStyle: "shaker" | "slab" | "block";
  hardware: "brass" | "black";
  tap: "brass" | "black" | "none";
}

const LOOKS: Record<SetStyle, SetLook> = {
  limewash: { wall: "#d8cdbd", floor: "oak", cabinet: "#33403a", doorStyle: "shaker", hardware: "brass", tap: "brass" },
  inkwell: { wall: "#38342e", floor: "stone", cabinet: "#1e1c1a", doorStyle: "slab", hardware: "brass", tap: "black" },
  studio: { wall: "#2a2520", floor: "cyc", cabinet: "#211e1b", doorStyle: "block", hardware: "black", tap: "none" },
};

// ── Materials shared by the set ─────────────────────────────────

function useSetMaterials(look: SetLook) {
  return useMemo(() => {
    const wallTex = plasterTexture(look.wall, 7, [3, 2]);
    const cabTex = paintedTimberTexture(look.cabinet, 11, [1, 1]);
    return {
      wall: new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95, metalness: 0 }),
      floor:
        look.floor === "oak"
          ? new THREE.MeshStandardMaterial({ map: oakTexture(3, [7, 7]), roughness: 0.6, metalness: 0 })
          : look.floor === "stone"
            ? new THREE.MeshStandardMaterial({ map: plasterTexture("#4a443c", 19, [5, 5]), roughness: 0.75 })
            : new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 }),
      cabinet: new THREE.MeshStandardMaterial({ map: cabTex, roughness: 0.55, metalness: 0 }),
      shadowGap: new THREE.MeshStandardMaterial({ color: "#0d0c0b", roughness: 1 }),
      brass: new THREE.MeshStandardMaterial({ color: "#c9a25a", metalness: 1, roughness: 0.28 }),
      black: new THREE.MeshStandardMaterial({ color: "#1a1a1a", metalness: 0.6, roughness: 0.45 }),
      steel: new THREE.MeshStandardMaterial({ color: "#d4d6d7", metalness: 0.55, roughness: 0.42, side: THREE.DoubleSide }),
      drain: new THREE.MeshStandardMaterial({ color: "#2a2a2a", metalness: 0.9, roughness: 0.3 }),
      ceramic: new THREE.MeshStandardMaterial({ color: "#efe9df", roughness: 0.35, metalness: 0 }),
      stoneware: new THREE.MeshStandardMaterial({ color: "#5e5a52", roughness: 0.7, metalness: 0 }),
      wood: new THREE.MeshStandardMaterial({ map: oakTexture(23, [0.6, 0.6]), roughness: 0.55 }),
      lemon: new THREE.MeshStandardMaterial({ color: "#e6b81e", roughness: 0.45 }),
      leaf: new THREE.MeshStandardMaterial({ color: "#3f5a33", roughness: 0.6, side: THREE.DoubleSide }),
    };
  }, [look]);
}

// ── Room shell ─────────────────────────────────────────────────

function Room({ shot, look, m }: { shot: RenderShot; look: SetLook; m: ReturnType<typeof useSetMaterials> }) {
  const hd = (shot.depth * S) / 2;
  const wallZ = -hd - 0.02;
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 11, wallZ]} material={m.wall} receiveShadow>
        <planeGeometry args={[90, 40]} />
      </mesh>
      {/* Floor */}
      <mesh position={[0, FLOOR_Y, 20]} rotation={[-Math.PI / 2, 0, 0]} material={m.floor} receiveShadow>
        <planeGeometry args={[90, 60]} />
      </mesh>
      {look.floor === "cyc" && (
        // Curved cove between wall and floor for a seamless studio sweep
        <mesh position={[0, FLOOR_Y + 3, wallZ + 3]} rotation={[0, 0, Math.PI / 2]} material={m.wall} receiveShadow>
          <cylinderGeometry args={[3, 3, 90, 32, 1, true, Math.PI, Math.PI / 2]} />
        </mesh>
      )}
    </group>
  );
}

// ── Cabinetry ──────────────────────────────────────────────────

function Cabinets({ shot, look, m }: { shot: RenderShot; look: SetLook; m: ReturnType<typeof useSetMaterials> }) {
  const w = shot.width * S;
  const d = shot.depth * S;
  const hd = d / 2;
  const top = -0.45; // underside of the folded returns
  const plinthH = 1.0;
  const carcassFront = hd - 0.45;
  const carcassH = top - (FLOOR_Y + plinthH);
  const carcassCY = FLOOR_Y + plinthH + carcassH / 2;
  const innerW = w - 0.12;

  if (look.doorStyle === "block") {
    // Studio island: a single handle-less ink block with a shadow gap
    return (
      <group>
        <mesh position={[0, top - 0.2, 0]} material={m.shadowGap}>
          <boxGeometry args={[innerW - 0.3, 0.4, d - 0.5]} />
        </mesh>
        <mesh position={[0, (top - 0.4 + FLOOR_Y) / 2, 0]} material={m.cabinet} castShadow receiveShadow>
          <boxGeometry args={[innerW, top - 0.4 - FLOOR_Y, d - 0.3]} />
        </mesh>
      </group>
    );
  }

  const doorCount = Math.max(2, Math.round(shot.width / 600));
  const gap = 0.03;
  const doorW = (innerW - gap * (doorCount - 1)) / doorCount;
  const doorH = carcassH - 0.06;
  const doorT = 0.2;
  const doorZ = carcassFront + doorT / 2;
  const rail = 0.7;

  return (
    <group>
      {/* Carcass */}
      <mesh position={[0, carcassCY, (carcassFront - hd) / 2]} material={m.cabinet} castShadow receiveShadow>
        <boxGeometry args={[innerW, carcassH, carcassFront + hd]} />
      </mesh>
      {/* Recessed plinth */}
      <mesh position={[0, FLOOR_Y + plinthH / 2, (carcassFront - 0.6 - hd) / 2]} material={m.shadowGap} receiveShadow>
        <boxGeometry args={[innerW - 0.1, plinthH, carcassFront - 0.6 + hd]} />
      </mesh>
      {Array.from({ length: doorCount }).map((_, i) => {
        const x = -innerW / 2 + doorW / 2 + i * (doorW + gap);
        const handleSide = i % 2 === 0 ? 1 : -1;
        return (
          <group key={i} position={[x, carcassCY, doorZ]}>
            <mesh material={m.cabinet} castShadow receiveShadow>
              <boxGeometry args={[doorW, doorH, doorT]} />
            </mesh>
            {look.doorStyle === "shaker" && (
              <>
                {/* Frame rails proud of the panel */}
                <mesh position={[0, doorH / 2 - rail / 2, doorT / 2 + 0.03]} material={m.cabinet} castShadow receiveShadow>
                  <boxGeometry args={[doorW, rail, 0.06]} />
                </mesh>
                <mesh position={[0, -doorH / 2 + rail / 2, doorT / 2 + 0.03]} material={m.cabinet} castShadow receiveShadow>
                  <boxGeometry args={[doorW, rail, 0.06]} />
                </mesh>
                <mesh position={[-doorW / 2 + rail / 2, 0, doorT / 2 + 0.03]} material={m.cabinet} castShadow receiveShadow>
                  <boxGeometry args={[rail, doorH, 0.06]} />
                </mesh>
                <mesh position={[doorW / 2 - rail / 2, 0, doorT / 2 + 0.03]} material={m.cabinet} castShadow receiveShadow>
                  <boxGeometry args={[rail, doorH, 0.06]} />
                </mesh>
                {/* Brass knob */}
                <group position={[handleSide * (doorW / 2 - rail / 2), doorH / 2 - 1.1, doorT / 2 + 0.06]}>
                  <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.08]} material={look.hardware === "brass" ? m.brass : m.black} castShadow>
                    <cylinderGeometry args={[0.05, 0.07, 0.16, 24]} />
                  </mesh>
                  <mesh position={[0, 0, 0.2]} material={look.hardware === "brass" ? m.brass : m.black} castShadow>
                    <sphereGeometry args={[0.15, 32, 24]} />
                  </mesh>
                </group>
              </>
            )}
            {look.doorStyle === "slab" && (
              // Long brass bar pull
              <group position={[handleSide * (doorW / 2 - 0.45), doorH / 2 - 2.0, doorT / 2]}>
                <mesh position={[0, 0, 0.22]} material={m.brass} castShadow>
                  <cylinderGeometry args={[0.07, 0.07, 2.6, 24]} />
                </mesh>
                {[-1, 1].map((s) => (
                  <mesh key={s} position={[0, s * 1.05, 0.1]} rotation={[Math.PI / 2, 0, 0]} material={m.brass} castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 0.2, 16]} />
                  </mesh>
                ))}
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}

// ── Sink + tap ─────────────────────────────────────────────────

function Sink({ shot, look, m }: { shot: RenderShot; look: SetLook; m: ReturnType<typeof useSetMaterials> }) {
  const c = shot.config.cutout;
  if (!shot.sink || !c.enabled) return null;
  const cx = c.offsetX * S;
  const cz = c.offsetZ * S;
  const cw = c.width * S - 0.04;
  const cd = (c.shape === "square" ? c.width : c.depth) * S - 0.04;
  const bowlTop = -0.3;
  const bowlH = 2.0;
  const hd = (shot.depth * S) / 2;
  const tapMat = look.tap === "brass" ? m.brass : m.black;

  // Gooseneck: rises from the deck behind the bowl and arches over it
  const tapBase = new THREE.Vector3(cx, 0.02, Math.max(-hd + 0.7, cz - cd / 2 - 0.55));
  const neck = new THREE.CatmullRomCurve3([
    tapBase.clone(),
    tapBase.clone().add(new THREE.Vector3(0, 2.2, 0)),
    tapBase.clone().add(new THREE.Vector3(0, 3.2, 0.5)),
    tapBase.clone().add(new THREE.Vector3(0, 3.0, 1.4)),
    tapBase.clone().add(new THREE.Vector3(0, 2.3, 1.75)),
  ]);

  return (
    <group>
      <group position={[cx, bowlTop - bowlH / 2, cz]}>
        {c.shape === "oval" ? (
          <mesh scale={[cw / 2, 1, cd / 2]} material={m.steel} receiveShadow>
            <cylinderGeometry args={[1, 0.9, bowlH, 96, 1, true]} />
          </mesh>
        ) : (
          // Four walls, open top, so light falls into the bowl
          <group>
            {[
              { p: [0, 0, -cd / 2], r: [0, 0, 0], s: [cw, bowlH] },
              { p: [0, 0, cd / 2], r: [0, Math.PI, 0], s: [cw, bowlH] },
              { p: [-cw / 2, 0, 0], r: [0, Math.PI / 2, 0], s: [cd, bowlH] },
              { p: [cw / 2, 0, 0], r: [0, -Math.PI / 2, 0], s: [cd, bowlH] },
            ].map((wall, i) => (
              <mesh
                key={i}
                position={wall.p as [number, number, number]}
                rotation={wall.r as [number, number, number]}
                material={m.steel}
                receiveShadow
              >
                <planeGeometry args={wall.s as [number, number]} />
              </mesh>
            ))}
          </group>
        )}
        {/* Basin floor */}
        <mesh position={[0, -bowlH / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={c.shape === "oval" ? [cw / 2 * 0.9, cd / 2 * 0.9, 1] : [1, 1, 1]} material={m.steel} receiveShadow>
          {c.shape === "oval" ? <circleGeometry args={[1, 96]} /> : <planeGeometry args={[cw, cd]} />}
        </mesh>
        <mesh position={[0, -bowlH / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.drain}>
          <circleGeometry args={[0.35, 32]} />
        </mesh>
      </group>

      {look.tap !== "none" && (
        <group>
          <mesh position={[tapBase.x, 0.12, tapBase.z]} material={tapMat} castShadow>
            <cylinderGeometry args={[0.2, 0.24, 0.24, 32]} />
          </mesh>
          <mesh material={tapMat} castShadow>
            <tubeGeometry args={[neck, 64, 0.11, 20, false]} />
          </mesh>
          {/* Spout tip */}
          <mesh position={neck.getPoint(1).toArray()} material={tapMat}>
            <sphereGeometry args={[0.11, 20, 16]} />
          </mesh>
          {/* Lever */}
          <mesh position={[tapBase.x + 0.32, 1.0, tapBase.z]} rotation={[0, 0, Math.PI / 2.4]} material={tapMat} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.9, 16]} />
          </mesh>
          <mesh position={[tapBase.x + 0.12, 1.0, tapBase.z]} rotation={[0, 0, Math.PI / 2]} material={tapMat}>
            <cylinderGeometry args={[0.13, 0.13, 0.22, 24]} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ── Props ───────────────────────────────────────────────────────

function Props({ shot, m }: { shot: RenderShot; m: ReturnType<typeof useSetMaterials> }) {
  const jug = useMemo(() => {
    const pts = [
      [0, 0], [0.62, 0], [0.7, 0.08], [0.78, 0.6], [0.8, 1.2], [0.7, 1.7],
      [0.5, 2.05], [0.42, 2.35], [0.5, 2.6], [0.47, 2.62], [0.38, 2.4], [0, 2.4],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 64);
  }, []);
  const bowl = useMemo(() => {
    const pts = [[0, 0.02], [0.5, 0], [0.9, 0.12], [1.25, 0.55], [1.32, 0.62], [1.22, 0.6], [0.85, 0.2], [0, 0.12]].map(
      ([x, y]) => new THREE.Vector2(x, y)
    );
    return new THREE.LatheGeometry(pts, 64);
  }, []);

  if (!shot.props) return null;
  const w = shot.width * S;
  const hd = (shot.depth * S) / 2;
  const side = shot.config.cutout.offsetX > 0 ? -1 : 1; // keep props away from the sink
  const top = 0.012;

  return (
    <group>
      {/* Board leaning against the upstand/wall */}
      <group position={[side * (w / 2 - 2.6), top, -hd + 0.45]} rotation={[-0.16, side * 0.08, 0]}>
        <RoundedBox args={[3.0, 4.2, 0.22]} radius={0.08} position={[0, 2.1, 0]} material={m.wood} castShadow receiveShadow />
      </group>
      {/* Stoneware jug */}
      <mesh geometry={jug} position={[side * (w / 2 - 1.1), top, -hd + 1.4]} material={m.ceramic} castShadow receiveShadow />
      {/* Bowl of lemons */}
      <group position={[side * (w / 2 - 3.6), top, 0.6]}>
        <mesh geometry={bowl} material={m.stoneware} castShadow receiveShadow />
        {[
          [0, 0.55, 0], [0.5, 0.5, 0.25], [-0.45, 0.5, 0.3], [0.15, 0.62, -0.45],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]} scale={[1, 0.86, 0.86]} material={m.lemon} castShadow>
            <sphereGeometry args={[0.36, 32, 24]} />
          </mesh>
        ))}
        <mesh position={[0.2, 0.95, 0.1]} rotation={[0.6, 0.4, 0.2]} material={m.leaf}>
          <planeGeometry args={[0.25, 0.6]} />
        </mesh>
      </group>
    </group>
  );
}

// ── Lighting per set ───────────────────────────────────────────

function Lighting({ set }: { set: SetStyle }) {
  const shadow = {
    castShadow: true,
    "shadow-mapSize": [2048, 2048] as [number, number],
    "shadow-bias": -0.0004,
    "shadow-normalBias": 0.02,
    "shadow-camera-left": -26,
    "shadow-camera-right": 26,
    "shadow-camera-top": 26,
    "shadow-camera-bottom": -26,
    "shadow-camera-near": 1,
    "shadow-camera-far": 90,
    "shadow-radius": 6,
  };

  return (
    <>
      {set === "limewash" && (
        <>
          <hemisphereLight args={["#fff3e2", "#5a4636", 0.38]} />
          <directionalLight position={[-22, 26, 16]} intensity={3.1} color="#fff1dc" {...shadow} />
          <directionalLight position={[18, 10, 20]} intensity={0.35} color="#dfe8f2" />
        </>
      )}
      {set === "inkwell" && (
        <>
          <hemisphereLight args={["#ffe9cc", "#1a1714", 0.25]} />
          <directionalLight position={[14, 28, 10]} intensity={2.4} color="#ffdcae" {...shadow} />
          <directionalLight position={[-20, 6, 18]} intensity={0.3} color="#c9d6e6" />
        </>
      )}
      {set === "studio" && (
        <>
          <hemisphereLight args={["#fff0de", "#141110", 0.3]} />
          <directionalLight position={[-12, 30, 14]} intensity={2.2} color="#fff2e0" {...shadow} />
          <directionalLight position={[18, 6, -14]} intensity={1.0} color="#ffd8a6" />
        </>
      )}

      {/* Reflection studio: what the metal sees */}
      <Environment resolution={512} frames={1}>
        <color attach="background" args={[set === "limewash" ? "#6d6256" : "#161311"]} />
        <Lightformer form="rect" intensity={set === "limewash" ? 3.5 : 2.2} color="#fff0dc" position={[-10, 6, 6]} rotation-y={Math.PI / 3} scale={[8, 10, 1]} />
        <Lightformer form="rect" intensity={2.5} color="#ffe6c4" position={[0, 9, 0]} rotation-x={Math.PI / 2} scale={[14, 6, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#ffd9a8" position={[9, 2, 4]} rotation-y={-Math.PI / 2.5} scale={[1.2, 8, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#f4e7d6" position={[0, 1, 12]} scale={[16, 4, 1]} />
      </Environment>
    </>
  );
}

// ── Scene wiring ───────────────────────────────────────────────

function ShadowEverything() {
  const scene = useThree((s) => s.scene);
  const frames = useRef(0);
  useFrame(() => {
    // WorktopModel meshes mount asynchronously (textures), so keep tagging
    // for a while after mount.
    if (frames.current++ > 240) return;
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh && !mesh.userData.__shadowTagged) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.__shadowTagged = true;
      }
    });
  });
  return null;
}

/** Signals readiness to the capture script once textures settle */
function ReadySignal() {
  const loading = useConfiguratorStore((s) => s.isTextureLoading);
  const stable = useRef(0);
  useFrame(() => {
    stable.current = loading ? 0 : stable.current + 1;
    const w = window as unknown as { __renderReady?: boolean; __frames?: number };
    w.__frames = (w.__frames ?? 0) + 1;
    // A handful of settled frames is enough: lighting is static, and N8AO
    // converges in a few frames.
    w.__renderReady = stable.current > 12;
  });
  return null;
}

function Shot({ shot, orbit, post }: { shot: RenderShot; orbit: boolean; post: boolean }) {
  const look = LOOKS[shot.set];
  const m = useSetMaterials(look);
  const finish = useConfiguratorStore((s) => s.selectedFinish);
  const ready = finish && finish.slug === shot.finishSlug;
  return (
    <>
      <color attach="background" args={[look.wall]} />
      <Lighting set={shot.set} />
      <Room shot={shot} look={look} m={m} />
      <Cabinets shot={shot} look={look} m={m} />
      {ready && (
        <WorktopModel
          width={shot.width}
          depth={shot.depth}
          thickness={shot.thickness}
          baseMetal={finish.baseMetal}
          isAged={finish.isAged}
          config={shot.config}
        />
      )}
      <Sink shot={shot} look={look} m={m} />
      <Props shot={shot} m={m} />
      <ShadowEverything />
      <ReadySignal />
      <OrbitControls
        makeDefault
        enabled={orbit}
        target={shot.camera.target}
        onEnd={(e) => {
          const c = (e?.target as unknown as { object: THREE.Camera; target: THREE.Vector3 }) ?? null;
          if (c) console.log("camera", c.object.position.toArray().map((n) => +n.toFixed(2)), "target", c.target.toArray().map((n) => +n.toFixed(2)));
        }}
      />
      {post && (
      <EffectComposer multisampling={4}>
        <N8AO aoRadius={0.8} intensity={2.2} distanceFalloff={0.6} quality="high" />
        <Bloom luminanceThreshold={0.92} intensity={0.25} mipmapBlur />
        <Vignette offset={0.32} darkness={0.55} />
        <ToneMapping mode={ACES_FILMIC} />
      </EffectComposer>
      )}
    </>
  );
}

export function RenderStudio() {
  const [params, setParams] = useState<{ id: string | null; dpr: number; clean: boolean; orbit: boolean; post: boolean; shadows: boolean } | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setParams({
      id: q.get("shot"),
      dpr: Math.min(3, Math.max(1, Number(q.get("dpr")) || 1)),
      clean: q.has("clean"),
      orbit: q.has("orbit"),
      post: !q.has("nopost"),
      shadows: !q.has("noshadow"),
    });
  }, []);

  const shot = getShot(params?.id);

  // Put the configurator store into the state this shot needs
  useEffect(() => {
    if (!params) return;
    const base = getFinishBySlug(shot.finishSlug);
    if (!base) return;
    const finish = {
      ...base,
      textures: { ...base.textures, realWorldWidthMm: shot.textureSpanMm, realWorldHeightMm: shot.textureSpanMm },
    };
    useConfiguratorStore.setState({
      productType: "worktop",
      selectedFinish: finish,
      baseMetal: finish.baseMetal,
      width: shot.width,
      height: shot.depth,
      thickness: shot.thickness,
      worktopConfig: shot.config,
      viewMode: "3d",
      editMode: false,
    });
  }, [params, shot]);

  if (!params) return null;
  const [cw, ch] = CANVAS_SIZE[shot.aspect];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black p-0">
      {!params.clean && (
        <nav className="flex flex-wrap gap-2 p-3 text-xs text-white/70">
          {SHOTS.map((s) => (
            <a
              key={s.id}
              href={`?shot=${s.id}&orbit`}
              className={`rounded-full border px-3 py-1 ${s.id === shot.id ? "border-white text-white" : "border-white/20"}`}
            >
              {s.id}
            </a>
          ))}
        </nav>
      )}
      <div id="render-frame" style={{ width: cw, height: ch }}>
        <Canvas
          shadows={params.shadows}
          dpr={params.dpr}
          camera={{ position: shot.camera.position, fov: shot.camera.fov, near: 0.1, far: 200 }}
          gl={{
            antialias: !params.post,
            preserveDrawingBuffer: true,
            toneMapping: params.post ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping,
          }}
        >
          <Suspense fallback={null}>
            <Shot shot={shot} orbit={params.orbit} post={params.post} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
