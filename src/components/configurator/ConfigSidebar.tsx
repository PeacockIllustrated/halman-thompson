"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { FinishSelector } from "./FinishSelector";
import { DimensionControls } from "./DimensionControls";
import { WorktopOptions } from "./WorktopOptions";
import { ViewModeToggle } from "./ViewModeToggle";
import { ExportButton } from "./ExportButton";
import { PriceDisplay } from "./PriceDisplay";
import { ConfigSummary } from "./ConfigSummary";
import { Button } from "@/components/ui/button";
import { useConfiguratorStore } from "@/stores/configurator";
import Link from "next/link";

// ── Tab definitions ──────────────────────────────────────

type TabId = "material" | "size" | "options" | "review";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

function MaterialIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="10" cy="10" r="7.5" />
      <circle cx="7.5" cy="8" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="7.5" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="13" cy="12.5" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="8" cy="13" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SizeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="6" width="16" height="8" rx="1.5" />
      <line x1="5" y1="6" x2="5" y2="9.5" />
      <line x1="8" y1="6" x2="8" y2="11" />
      <line x1="11" y1="6" x2="11" y2="9.5" />
      <line x1="14" y1="6" x2="14" y2="11" />
    </svg>
  );
}

function OptionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="5" x2="17" y2="5" />
      <circle cx="7" cy="5" r="2" fill="currentColor" stroke="none" />
      <line x1="3" y1="10" x2="17" y2="10" />
      <circle cx="13" cy="10" r="2" fill="currentColor" stroke="none" />
      <line x1="3" y1="15" x2="17" y2="15" />
      <circle cx="9" cy="15" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ReviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3.5" y="2" width="13" height="16" rx="1.5" />
      <line x1="7" y1="6" x2="13" y2="6" />
      <line x1="7" y1="9.5" x2="13" y2="9.5" />
      <line x1="7" y1="13" x2="10.5" y2="13" />
    </svg>
  );
}

const WORKTOP_TABS: TabDef[] = [
  { id: "material", label: "Material", icon: <MaterialIcon /> },
  { id: "size", label: "Size", icon: <SizeIcon /> },
  { id: "options", label: "Edges", icon: <OptionsIcon /> },
  { id: "review", label: "Review", icon: <ReviewIcon /> },
];

const DEFAULT_TABS: TabDef[] = [
  { id: "material", label: "Material", icon: <MaterialIcon /> },
  { id: "size", label: "Size", icon: <SizeIcon /> },
  { id: "review", label: "Review", icon: <ReviewIcon /> },
];

// ── Tab content wrapper with fade-in animation ───────────

function TabPanel({
  active,
  children,
  className,
}: {
  active: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (active) setAnimKey((k) => k + 1);
  }, [active]);

  return (
    <div
      key={animKey}
      className={cn(
        active
          ? "animate-[fadeSlideIn_200ms_ease-out]"
          : "hidden lg:block",
        className
      )}
    >
      {children}
    </div>
  );
}

// ── Main component ───────────────────────────────────────

export function ConfigSidebar() {
  const { productType, selectedFinish, calculatedPrice, isPriceLoading } =
    useConfiguratorStore();
  const [activeTab, setActiveTab] = useState<TabId>("material");
  const scrollRef = useRef<HTMLDivElement>(null);

  const isWorktop = productType === "worktop";
  const tabs = isWorktop ? WORKTOP_TABS : DEFAULT_TABS;

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    // Scroll content to top when switching tabs
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Mobile / Tablet Tab Bar ─────────────────── */}
      <div className="flex-shrink-0 border-b border-ht-dark/10 bg-white lg:hidden">
        <div className="flex">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 pb-2.5 pt-3 text-[11px] font-medium transition-colors duration-200",
                activeTab === tab.id
                  ? "text-ht-gold"
                  : "text-ht-dark/35 active:text-ht-dark/60"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {/* Active indicator bar */}
              <span
                className={cn(
                  "absolute bottom-0 left-3 right-3 h-0.5 rounded-full transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-ht-gold opacity-100"
                    : "bg-transparent opacity-0"
                )}
              />
              {/* Step number badge */}
              <span
                className={cn(
                  "absolute right-1.5 top-1.5 flex h-[14px] w-[14px] items-center justify-center rounded-full text-[8px] font-bold transition-colors duration-200 sm:right-2 sm:h-4 sm:w-4 sm:text-[9px]",
                  activeTab === tab.id
                    ? "bg-ht-gold/15 text-ht-gold"
                    : "bg-ht-dark/5 text-ht-dark/20"
                )}
              >
                {i + 1}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable Content Area ─────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-6 p-4 sm:p-5">
          {/* Material tab */}
          <TabPanel active={activeTab === "material"}>
            <FinishSelector />
          </TabPanel>

          {/* Size tab */}
          <TabPanel active={activeTab === "size"}>
            <DimensionControls />
          </TabPanel>

          {/* Options tab — worktop only */}
          {isWorktop && (
            <TabPanel active={activeTab === "options"} className="space-y-6">
              <ViewModeToggle />
              <WorktopOptions />
              <ExportButton />
            </TabPanel>
          )}

          {/* Review tab */}
          <TabPanel active={activeTab === "review"} className="space-y-6">
            <ConfigSummary />
            <PriceDisplay />
          </TabPanel>
        </div>
      </div>

      {/* ── Sticky Bottom Bar ───────────────────────── */}
      <div className="flex-shrink-0 border-t border-ht-dark/10 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4">
        <div className="flex items-center gap-3 lg:block">
          {/* Mini price — mobile/tablet only */}
          <div className="min-w-0 flex-shrink-0 lg:hidden">
            {isPriceLoading ? (
              <div className="h-6 w-20 animate-pulse rounded bg-ht-dark/10" />
            ) : calculatedPrice !== null ? (
              <div className="leading-tight">
                <span className="font-serif text-lg font-bold text-ht-dark sm:text-xl">
                  £{calculatedPrice.toFixed(2)}
                </span>
                <p className="text-[9px] text-ht-dark/40">inc. VAT</p>
              </div>
            ) : (
              <span className="text-[11px] text-ht-dark/40">No price yet</span>
            )}
          </div>

          {/* CTA button */}
          <div className="flex-1 lg:flex-none">
            {selectedFinish && calculatedPrice ? (
              <Link href="/quote" className="block">
                <Button size="lg" className="w-full text-sm lg:text-base">
                  Request Quote
                </Button>
              </Link>
            ) : (
              <Button size="lg" className="w-full text-sm lg:text-base" disabled>
                Select a finish
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
