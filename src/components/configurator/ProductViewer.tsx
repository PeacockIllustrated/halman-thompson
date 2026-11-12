"use client";

import { Component, type ReactNode, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border border-white/10 border-t-ht-gold-light" />
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/40">Preparing the studio</p>
      </div>
    </div>
  );
}

/** Matches the centre of the CSS stage backdrop so fog dissolves into it */
const FOG_COLOR = new THREE.Color("#2e2822");

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

/**
 * Pull the camera back on narrow (portrait) stages so the whole piece stays
 * in frame on phones. Runs when the stage aspect or product changes.
 */
function ResponsiveCamera({ isWorktop }: { isWorktop: boolean }) {
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const controls = useThree((s) => s.controls) as unknown as {
    target?: THREE.Vector3;
    update?: () => void;
  } | null;

  useEffect(() => {
    const aspect = width / Math.max(height, 1);
    // Short stages (phones, tablets) carry a proportionally larger caption,
    // so frame a little wider and aim slightly above centre to sit the
    // piece lower in the frame, clear of the title.
    const compact = height < 520;
    const base = isWorktop
      ? new THREE.Vector3(4.5, 9.5, 12)
      : new THREE.Vector3(3.6, 0.4, 15.5);
    const factor =
      Math.min(2.4, Math.max(1, 1.55 / aspect)) * (compact ? 1.25 : 1);
    const lift = compact ? (isWorktop ? 1.6 : 1.4) : 0;

    camera.position.copy(base.multiplyScalar(factor));
    camera.position.y += lift;
    controls?.target?.set(0, lift, 0);
    camera.lookAt(0, lift, 0);
    controls?.update?.();
  }, [width, height, isWorktop, camera, controls]);

  return null;
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
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">Applying finish</span>
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
        <div className="flex h-full items-center justify-center p-8">
          <div className="text-center">
            <p className="font-serif text-xl text-white">
              3D preview unavailable
            </p>
            <p className="mt-2 max-w-xs text-sm text-white/50">
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
      <SceneFog />
      <ResponsiveCamera isWorktop={isWorktop} />
      <SceneEnvironment orientation={isWorktop ? "flat" : "upright"} />
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
            position: isWorktop ? [4.5, 9.5, 12] : [3.6, 0.4, 15.5],
            fov: 40,
          }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
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
