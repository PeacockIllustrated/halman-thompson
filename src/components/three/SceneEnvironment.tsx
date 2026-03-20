"use client";

import { Environment, ContactShadows, OrbitControls } from "@react-three/drei";

export function SceneEnvironment() {
  return (
    <>
      <Environment preset="studio" />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.3} />
      <ContactShadows position={[0, -3, 0]} opacity={0.4} scale={20} blur={2} far={10} />
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
