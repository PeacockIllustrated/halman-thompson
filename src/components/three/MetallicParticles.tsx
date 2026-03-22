"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 40;

/**
 * Sparse floating metallic particles — gold/copper dots that drift
 * slowly across the hero. Subtle shimmer, not distracting.
 */
export function MetallicParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, velocities, sizes, colors } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    const sz = new Float32Array(PARTICLE_COUNT);
    const col = new Float32Array(PARTICLE_COUNT * 3);

    const palette = [
      [0.722, 0.525, 0.043], // gold
      [0.722, 0.451, 0.200], // copper
      [0.804, 0.608, 0.114], // brass
      [0.596, 0.494, 0.361], // muted gold
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spread across a wide area
      pos[i * 3] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2 - 1;

      // Very slow drift
      vel[i * 3] = (Math.random() - 0.5) * 0.003;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.002 + 0.001; // slight upward bias
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.001;

      // Small size, varied
      sz[i] = 1.5 + Math.random() * 3;

      // Random metallic colour from palette
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }

    return { positions: pos, velocities: vel, sizes: sz, colors: col };
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3] += velocities[i * 3];
      arr[i * 3 + 1] += velocities[i * 3 + 1];
      arr[i * 3 + 2] += velocities[i * 3 + 2];

      // Wrap around when particles drift too far
      if (arr[i * 3] > 2.5) arr[i * 3] = -2.5;
      if (arr[i * 3] < -2.5) arr[i * 3] = 2.5;
      if (arr[i * 3 + 1] > 2) arr[i * 3 + 1] = -2;
      if (arr[i * 3 + 1] < -2) arr[i * 3 + 1] = 2;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={3}
        sizeAttenuation
        transparent
        opacity={0.4}
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
