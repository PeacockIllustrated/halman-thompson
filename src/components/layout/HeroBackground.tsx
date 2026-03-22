"use client";

import dynamic from "next/dynamic";

const FlowingNoiseBackground = dynamic(
  () =>
    import("@/components/three/FlowingNoiseBackground").then(
      (m) => m.FlowingNoiseBackground
    ),
  { ssr: false }
);

export function HeroBackground() {
  return <FlowingNoiseBackground />;
}
