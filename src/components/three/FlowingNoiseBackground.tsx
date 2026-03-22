"use client";

import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { vertexShader, fragmentShader } from "./NoiseShader";
import { MetallicParticles } from "./MetallicParticles";

function NoisePlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uSpeed: { value: 1.0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Update resolution on resize
  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height);
  }, [size, uniforms]);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      uniforms.uSpeed.value = mq.matches ? 0 : 1.0;
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [uniforms]);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export function FlowingNoiseBackground() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "low-power",
        }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        camera={{ position: [0, 0, 1] }}
        style={{ pointerEvents: "none" }}
      >
        <NoisePlane />
        <MetallicParticles />
      </Canvas>
    </div>
  );
}
