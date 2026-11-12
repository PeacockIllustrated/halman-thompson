"use client";

import { useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ProductViewer } from "@/components/configurator/ProductViewer";
import { ConfigSidebar } from "@/components/configurator/ConfigSidebar";
import { ViewModeToggle } from "@/components/configurator/ViewModeToggle";
import { EditModeToggle } from "@/components/configurator/EditModeToggle";
import { CutoutShapeSelector } from "@/components/configurator/CutoutShapeSelector";
import { ExportButton } from "@/components/configurator/ExportButton";
import { useConfiguratorStore } from "@/stores/configurator";
import { getProductType } from "@/lib/products/catalogue";
import { getFinishBySlug } from "@/lib/products/finishes";
import type { ProductType } from "@/types";

const METAL_NAMES: Record<string, string> = {
  copper: "Copper",
  brass: "Brass",
  zinc: "Zinc",
  steel: "Steel",
  corten: "Corten steel",
};

/** Live caption over the stage — names the finish like a gallery label */
function StageCaption({ productName }: { productName: string }) {
  const { selectedFinish, width, height, thickness, panelCount } =
    useConfiguratorStore();

  return (
    <div className="pointer-events-none w-max max-w-[min(30rem,62vw)] select-none">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40 sm:text-[11px]">
        {productName}
        {selectedFinish ? ` · ${METAL_NAMES[selectedFinish.baseMetal] ?? ""}` : ""}
      </p>
      <h1
        key={selectedFinish?.id ?? "none"}
        className="mt-1.5 animate-[riseIn_0.6s_var(--ease-out-expo)_both] font-serif text-[22px] leading-tight text-white sm:mt-2 sm:text-3xl lg:text-[40px]"
      >
        {selectedFinish ? (
          selectedFinish.name
        ) : (
          <em className="text-white/70">Choose a finish</em>
        )}
      </h1>
      <p className="mt-1.5 hidden text-xs tabular-nums text-white/45 sm:block">
        {width} × {height} mm · {thickness} mm gauge
        {panelCount > 1 ? ` · ${panelCount} panels` : ""}
      </p>
    </div>
  );
}

export default function ConfigurePage() {
  const params = useParams();
  const productTypeParam =
    typeof params.productType === "string"
      ? params.productType
      : params.productType?.[0] ?? "";
  const productConfig = getProductType(productTypeParam);

  const { setProductType, setWidth, setHeight, setThickness, setFinish, selectedFinish } =
    useConfiguratorStore();

  useEffect(() => {
    if (!productConfig || !productConfig.isActive) return;

    setProductType(productConfig.id as ProductType);
    setWidth(productConfig.defaultWidth);
    setHeight(productConfig.defaultHeight);
    setThickness(productConfig.defaultThickness);

    // Auto-select default finish if configured and no finish is already selected
    if (productConfig.defaultFinishSlug && !selectedFinish) {
      const defaultFinish = getFinishBySlug(productConfig.defaultFinishSlug);
      if (defaultFinish) {
        setFinish(defaultFinish);
      }
    }
  }, [productConfig, setProductType, setWidth, setHeight, setThickness, setFinish, selectedFinish]);

  if (!productConfig || !productConfig.isActive) {
    notFound();
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-ht-dark">
      <Header context={`${productConfig.name} visualiser`} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* 3D stage — compact on mobile, flexible on desktop */}
        <div className="stage-backdrop grain relative h-[36vh] flex-shrink-0 sm:h-[40vh] md:h-[44vh] lg:h-auto lg:flex-1">
          <div className="absolute inset-0 z-0">
            <ProductViewer />
          </div>
          {/* Floor glow so pieces feel placed, not floating */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1/3 bg-[radial-gradient(ellipse_50%_70%_at_50%_100%,rgba(214,178,120,0.08),transparent)]" />

          <div className="absolute left-4 top-4 z-10 sm:left-6 sm:top-6 lg:left-8 lg:top-8">
            <StageCaption productName={productConfig.name} />
          </div>
          {/* Cutout shape selector — top-right of stage */}
          <div className="absolute right-3 top-3 z-10 sm:right-6 sm:top-6">
            <CutoutShapeSelector />
          </div>
          {/* Interaction hint */}
          <p className="pointer-events-none absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 text-[10px] uppercase tracking-[0.25em] text-white/25 lg:block">
            Drag to turn · Scroll to zoom
          </p>
          {/* View mode toggle + edit toggle — bottom-right */}
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 sm:bottom-6 sm:right-6">
            <EditModeToggle />
            <ViewModeToggle />
          </div>
          {/* Export button — bottom-left */}
          <div className="absolute bottom-3 left-3 z-10 sm:bottom-6 sm:left-6">
            <ExportButton />
          </div>
        </div>

        {/* Configuration panel */}
        <aside className="relative z-10 flex min-h-0 flex-1 flex-col bg-ht-cream lg:flex-none lg:basis-[440px] lg:shadow-[-24px_0_60px_-30px_rgba(0,0,0,0.6)]">
          <ConfigSidebar />
        </aside>
      </div>
    </div>
  );
}
