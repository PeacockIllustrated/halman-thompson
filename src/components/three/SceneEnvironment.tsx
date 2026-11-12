"use client";

import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";

interface SceneEnvironmentProps {
  /** Worktops lie flat (shadow below); splashbacks stand upright */
  orientation?: "upright" | "flat";
}

/**
 * Studio lighting for metal.
 *
 * Metals are almost entirely reflection, so the look is driven by what they
 * reflect. Instead of a downloaded HDRI we build a small "photo studio" from
 * Lightformers: a warm overhead softbox, two strip lights for edge highlights
 * and a dim bounce card. Everything is generated locally — no network fetch.
 */
export function SceneEnvironment({ orientation = "upright" }: SceneEnvironmentProps) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[4, 6, 6]} intensity={0.9} color="#fff1dd" />
      <directionalLight position={[-6, 2, -4]} intensity={0.35} color="#cfe0ff" />

      <Environment resolution={256} frames={1}>
        <color attach="background" args={["#141110"]} />
        {/* Overhead warm softbox */}
        <Lightformer form="rect" intensity={2.2} color="#ffe6c4" position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} />
        {/* Key strip, camera left */}
        <Lightformer form="rect" intensity={3} color="#fff4e6" position={[-6, 1.5, 4]} rotation-y={Math.PI / 3} scale={[1.2, 8, 1]} />
        {/* Rim strip, camera right */}
        <Lightformer form="rect" intensity={1.6} color="#ffd9a8" position={[6, 1, 2]} rotation-y={-Math.PI / 2.5} scale={[0.8, 8, 1]} />
        {/* Front fill so faces never fall to black */}
        <Lightformer form="rect" intensity={0.9} color="#f4e7d6" position={[0, 0.5, 9]} scale={[12, 3, 1]} />
        {/* Cool back bounce for depth */}
        <Lightformer form="ring" intensity={0.6} color="#9fb7c9" position={[0, 2, -8]} scale={4} />
      </Environment>

      {/* Grounding shadow for pieces that lie flat (worktops) */}
      {orientation === "flat" && (
        <ContactShadows
          position={[0, -1.4, 0]}
          opacity={0.6}
          scale={40}
          blur={2.8}
          far={4}
          resolution={512}
          color="#000000"
        />
      )}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enableRotate
        enablePan
        enableZoom
        minDistance={2}
        maxDistance={50}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.85}
      />
    </>
  );
}
