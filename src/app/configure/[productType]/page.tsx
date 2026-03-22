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
import type { ProductType } from "@/types";

export default function ConfigurePage() {
  const params = useParams();
  const productTypeParam =
    typeof params.productType === "string"
      ? params.productType
      : params.productType?.[0] ?? "";
  const productConfig = getProductType(productTypeParam);

  const { setProductType, setWidth, setHeight, setThickness } =
    useConfiguratorStore();

  useEffect(() => {
    if (!productConfig || !productConfig.isActive) return;

    setProductType(productConfig.id as ProductType);
    setWidth(productConfig.defaultWidth);
    setHeight(productConfig.defaultHeight);
    setThickness(productConfig.defaultThickness);
  }, [productConfig, setProductType, setWidth, setHeight, setThickness]);

  if (!productConfig || !productConfig.isActive) {
    notFound();
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      <Header />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* 3D Viewport — compact on mobile, flexible on desktop */}
        <div className="relative h-[32vh] flex-shrink-0 bg-gradient-to-br from-ht-cream to-ht-dark/[0.06] sm:h-[38vh] md:h-[42vh] lg:h-auto lg:flex-[3]">
          <ProductViewer />
          <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
            <h1 className="font-serif text-base font-semibold tracking-wide text-ht-dark/70 sm:text-lg lg:text-xl">
              {productConfig.name} Configurator
            </h1>
          </div>
          {/* Cutout shape selector — top-right of viewport */}
          <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
            <CutoutShapeSelector />
          </div>
          {/* View mode toggle + edit toggle — bottom-right of viewport */}
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-2">
            <EditModeToggle />
            <ViewModeToggle />
          </div>
          {/* Export button — bottom-left of viewport */}
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
            <ExportButton />
          </div>
        </div>

        {/* Config Sidebar — fills remaining height */}
        <div className="flex min-h-0 flex-1 flex-col border-t border-ht-dark/[0.06] bg-white lg:flex-none lg:basis-[420px] lg:border-l lg:border-t-0">
          <ConfigSidebar />
        </div>
      </div>
    </div>
  );
}
