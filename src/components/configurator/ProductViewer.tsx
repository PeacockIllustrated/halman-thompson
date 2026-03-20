"use client";

import { Component, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { MetalSheet } from "@/components/three/MetalSheet";
import { SceneEnvironment } from "@/components/three/SceneEnvironment";
import { PanelLines } from "@/components/three/PanelLines";
import { DimensionLabels } from "@/components/three/DimensionLabels";
import { useConfiguratorStore } from "@/stores/configurator";

function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-ht-dark/5 to-ht-dark/10">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-ht-gold/30 border-t-ht-gold" />
        <p className="mt-3 text-sm text-ht-dark/50">Loading 3D preview...</p>
      </div>
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ViewerErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center bg-ht-dark/5 p-8">
          <div className="text-center">
            <p className="font-serif text-lg font-semibold text-ht-dark">
              3D Preview Unavailable
            </p>
            <p className="mt-2 text-sm text-ht-dark/60">
              Your browser may not support WebGL. Please try a different browser or device.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Scene() {
  const { width, height, thickness, baseMetal, selectedFinish, panelLayout } =
    useConfiguratorStore();

  const isAged = selectedFinish?.isAged ?? false;

  return (
    <>
      <SceneEnvironment />
      <MetalSheet
        width={width}
        height={height}
        thickness={thickness}
        baseMetal={baseMetal}
        isAged={isAged}
      />
      <PanelLines
        width={width}
        height={height}
        thickness={thickness}
        panelLayout={panelLayout}
      />
      <DimensionLabels width={width} height={height} />
    </>
  );
}

export function ProductViewer() {
  return (
    <ViewerErrorBoundary>
      <Canvas
        camera={{ position: [0, 0, 12], fov: 45 }}
        gl={{
          antialias: true,
          toneMapping: 3,
          toneMappingExposure: 1.2,
        }}
        className="touch-none"
        fallback={<LoadingFallback />}
      >
        <Scene />
      </Canvas>
    </ViewerErrorBoundary>
  );
}
