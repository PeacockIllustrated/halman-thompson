"use client";

import { OrbitControls } from "@react-three/drei";

export function SceneEnvironment() {
  return (
    <>
      {/* Key + fill + rim lighting for metal reflections */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.0} />
      <directionalLight position={[-5, 3, -3]} intensity={0.5} />
      <directionalLight position={[0, -2, 5]} intensity={0.3} />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minDistance={2}
        maxDistance={20}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.85}
      />
    </>
  );
}
