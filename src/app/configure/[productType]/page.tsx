"use client";

import { useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ProductViewer } from "@/components/configurator/ProductViewer";
import { ConfigSidebar } from "@/components/configurator/ConfigSidebar";
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
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* 3D Viewport */}
        <div className="relative h-[50vh] flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 lg:h-auto lg:flex-[3]">
          <ProductViewer />
          <div className="absolute left-4 top-4">
            <h1 className="font-serif text-xl font-semibold text-ht-dark/80">
              {productConfig.name} Configurator
            </h1>
          </div>
        </div>

        {/* Config Sidebar */}
        <div className="flex-1 overflow-y-auto border-t border-ht-dark/10 bg-white lg:w-[420px] lg:flex-shrink-0 lg:flex-grow-0 lg:border-l lg:border-t-0">
          <ConfigSidebar />
        </div>
      </div>
    </div>
  );
}
