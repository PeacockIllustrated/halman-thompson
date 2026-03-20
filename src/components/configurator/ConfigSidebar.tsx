"use client";

import { FinishSelector } from "./FinishSelector";
import { DimensionControls } from "./DimensionControls";
import { PriceDisplay } from "./PriceDisplay";
import { ConfigSummary } from "./ConfigSummary";
import { Button } from "@/components/ui/button";
import { useConfiguratorStore } from "@/stores/configurator";
import Link from "next/link";

export function ConfigSidebar() {
  const { selectedFinish, calculatedPrice } = useConfiguratorStore();

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 space-y-6 p-5">
        <FinishSelector />
        <DimensionControls />
        <ConfigSummary />
        <PriceDisplay />
      </div>

      <div className="sticky bottom-0 border-t border-ht-dark/10 bg-white p-5">
        {selectedFinish && calculatedPrice ? (
          <Link href="/quote">
            <Button size="lg" className="w-full">
              Request Bespoke Quote
            </Button>
          </Link>
        ) : (
          <Button size="lg" className="w-full" disabled>
            Select a finish to continue
          </Button>
        )}
      </div>
    </div>
  );
}
