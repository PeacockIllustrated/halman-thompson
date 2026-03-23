"use client";

import { Component, type ReactNode, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MetalSheet } from "@/components/three/MetalSheet";
import { WorktopModel } from "@/components/three/WorktopModel";
import { SceneEnvironment } from "@/components/three/SceneEnvironment";
import { PanelLines } from "@/components/three/PanelLines";
import { DimensionLabels } from "@/components/three/DimensionLabels";
import { DimensionHandles } from "@/components/three/DimensionHandles";
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

const FOG_COLOR = new THREE.Color("#f5f0eb");

/** Sets the scene background to match fog colour so fog blends naturally */
function SceneBackground() {
  return <color attach="background" args={["#f5f0eb"]} />;
}

/** Animated fog that smoothly fades in/out when textures are loading */
function SceneFog() {
  const isLoading = useConfiguratorStore((s) => s.isTextureLoading);
  const fogRef = useRef<THREE.Fog>(null);
  const targetNear = isLoading ? 0 : 80;
  const targetFar = isLoading ? 12 : 120;

  useFrame(() => {
    if (!fogRef.current) return;
    // Close in fast, pull back slower
    const speed = isLoading ? 0.12 : 0.05;
    fogRef.current.near += (targetNear - fogRef.current.near) * speed;
    fogRef.current.far += (targetFar - fogRef.current.far) * speed;
  });

  return <fog ref={fogRef} attach="fog" args={[FOG_COLOR, 80, 120]} />;
}

/** HTML overlay spinner shown during texture loading */
function TextureLoadingOverlay() {
  const isLoading = useConfiguratorStore((s) => s.isTextureLoading);

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-500 ${
        isLoading ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-ht-gold/80" />
          <div className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-b-ht-copper/50" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        </div>
        <span className="text-xs font-medium text-ht-dark/40">Applying finish...</span>
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
              Your browser may not support WebGL. Please try a different browser
              or device.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Scene() {
  const {
    productType,
    width,
    height,
    thickness,
    baseMetal,
    selectedFinish,
    panelLayout,
    worktopConfig,
    editMode,
  } = useConfiguratorStore();

  const isAged = selectedFinish?.isAged ?? false;
  const isWorktop = productType === "worktop";

  return (
    <>
      <SceneBackground />
      <SceneFog />
      <SceneEnvironment />
      {isWorktop ? (
        <>
          <WorktopModel
            width={width}
            depth={height}
            thickness={thickness}
            baseMetal={baseMetal}
            isAged={isAged}
            config={worktopConfig}
          />
          <PanelLines
            width={width}
            height={height}
            thickness={thickness}
            panelLayout={panelLayout}
            orientation="horizontal"
          />
          <DimensionLabels
            width={width}
            height={height}
            orientation="horizontal"
          />
          {editMode && (
            <DimensionHandles
              width={width}
              depth={height}
              thickness={thickness}
              config={worktopConfig}
            />
          )}
        </>
      ) : (
        <>
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
      )}
    </>
  );
}

export function ProductViewer() {
  const productType = useConfiguratorStore((s) => s.productType);
  const isWorktop = productType === "worktop";

  return (
    <ViewerErrorBoundary>
      <div className="relative h-full w-full">
        <TextureLoadingOverlay />
        <Canvas
          camera={{
            position: isWorktop ? [0, 7, 9] : [0, 0, 12],
            fov: 45,
          }}
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
      </div>
    </ViewerErrorBoundary>
  );
}
