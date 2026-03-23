"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import type { FinishConfigRow } from "@/lib/supabase/database.types";
import { FINISHES } from "@/lib/products/finishes";
import type { Finish } from "@/types";
import { useAdminTheme } from "../theme";

// ─── Metal accent colours ────────────────────────────────────
const METAL_ACCENTS: Record<string, { gradient: string; label: string; text: string; border: string; bg: string }> = {
  copper: {
    gradient: "from-amber-700 via-orange-600 to-amber-800",
    label: "Copper",
    text: "text-amber-500",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
  },
  brass: {
    gradient: "from-yellow-600 via-amber-500 to-yellow-700",
    label: "Brass",
    text: "text-yellow-500",
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/10",
  },
  zinc: {
    gradient: "from-stone-400 via-stone-500 to-stone-600",
    label: "Zinc",
    text: "text-stone-400",
    border: "border-stone-400/30",
    bg: "bg-stone-400/10",
  },
  steel: {
    gradient: "from-slate-700 via-slate-800 to-slate-900",
    label: "Steel",
    text: "text-slate-400",
    border: "border-slate-400/30",
    bg: "bg-slate-400/10",
  },
  corten: {
    gradient: "from-orange-800 via-red-900 to-orange-900",
    label: "Corten Steel",
    text: "text-orange-500",
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
  },
};

// ─── Detail Modal ─────────────────────────────────────────────
function FinishModal({
  finish,
  config,
  onUpdate,
  onSave,
  onClose,
  isSaving,
  isSaved,
  pick,
}: {
  finish: Finish;
  config: FinishConfigRow | undefined;
  onUpdate: (id: string, field: string, value: number | boolean) => void;
  onSave: (config: FinishConfigRow) => void;
  onClose: () => void;
  isSaving: boolean;
  isSaved: boolean;
  pick: (d: string, l: string) => string;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const metal = METAL_ACCENTS[finish.baseMetal] ?? METAL_ACCENTS.steel;
  const isPlaceholder = finish.swatchImageUrl.includes("placeholder");
  const isActive = config?.is_active ?? true;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Close on backdrop click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
    >
      <div
        className={`relative w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl ${pick(
          "border-white/[0.08] bg-[#1a1a2e]",
          "border-stone-200 bg-white"
        )}`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${pick(
            "text-white/40 hover:bg-white/10 hover:text-white/70",
            "text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          )}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Hero swatch */}
        <div className={`relative flex items-center justify-center px-6 pb-4 pt-8 ${pick("bg-white/[0.02]", "bg-stone-50")}`}>
          <div className={`relative aspect-square w-36 overflow-hidden rounded-full border-2 shadow-xl ${metal.border}`}>
            {isPlaceholder ? (
              <div className={`h-full w-full bg-gradient-to-br ${metal.gradient}`}>
                <div className="flex h-full items-center justify-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">No swatch</span>
                </div>
              </div>
            ) : (
              <Image src={finish.swatchImageUrl} alt={finish.name} fill className="object-cover" sizes="144px" />
            )}
          </div>

          {/* Metal badge */}
          <div className={`absolute bottom-2 left-6 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${metal.bg} ${metal.text}`}>
            {metal.label}
          </div>

          {/* Aged badge */}
          {finish.isAged && (
            <div className={`absolute bottom-2 right-6 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${pick("bg-ht-gold/15 text-ht-gold", "bg-ht-gold/10 text-ht-gold")}`}>
              Hand-aged
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-2">
          {/* Name and description */}
          <h2 className={`font-serif text-xl font-bold tracking-wide ${pick("text-white", "text-stone-900")}`}>
            {finish.name}
          </h2>
          <p className={`mt-0.5 text-sm font-medium ${metal.text}`}>
            {finish.subtitle}
          </p>
          <p className={`mt-2 text-sm leading-relaxed ${pick("text-white/50", "text-stone-500")}`}>
            {finish.description}
          </p>

          {/* Editable fields */}
          {config && (
            <div className="mt-5 space-y-4">
              {/* Active toggle */}
              <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${pick("bg-white/[0.03]", "bg-stone-50")}`}>
                <div>
                  <p className={`text-sm font-medium ${pick("text-white/80", "text-stone-700")}`}>Active</p>
                  <p className={`text-[11px] ${pick("text-white/30", "text-stone-400")}`}>
                    {isActive ? "Visible to customers in the configurator" : "Hidden from the configurator"}
                  </p>
                </div>
                <button
                  onClick={() => onUpdate(config.id, "is_active", !config.is_active)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    isActive ? "bg-emerald-500" : pick("bg-white/15", "bg-stone-300")
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      isActive ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Price modifier */}
              <div className={`rounded-xl px-4 py-3 ${pick("bg-white/[0.03]", "bg-stone-50")}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${pick("text-white/80", "text-stone-700")}`}>Price Modifier</p>
                    <p className={`text-[11px] ${pick("text-white/30", "text-stone-400")}`}>
                      Multiplier applied to the base material cost
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm ${pick("text-white/30", "text-stone-400")}`}>×</span>
                    <input
                      type="number"
                      step={0.05}
                      value={config.price_modifier}
                      onChange={(e) => onUpdate(config.id, "price_modifier", Number(e.target.value))}
                      className={`w-20 rounded-lg border px-3 py-1.5 text-center text-sm font-semibold tabular-nums outline-none transition-colors ${pick(
                        "border-white/[0.08] bg-white/[0.04] text-white focus:border-ht-gold/40",
                        "border-stone-200 bg-white text-stone-900 focus:border-ht-gold/60"
                      )}`}
                    />
                  </div>
                </div>
              </div>

              {/* Read-only metadata */}
              <div className={`rounded-xl border px-4 py-3 ${pick("border-white/[0.04] bg-white/[0.02]", "border-stone-100 bg-stone-50/50")}`}>
                <p className={`mb-2.5 text-[10px] font-semibold uppercase tracking-wider ${pick("text-white/25", "text-stone-400")}`}>
                  Specifications
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${pick("text-white/35", "text-stone-400")}`}>Base Metal</span>
                    <span className={`text-xs font-medium capitalize ${pick("text-white/70", "text-stone-700")}`}>{finish.baseMetal}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${pick("text-white/35", "text-stone-400")}`}>Default Lacquer</span>
                    <span className={`text-xs font-medium capitalize ${pick("text-white/70", "text-stone-700")}`}>{finish.lacquerDefault}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${pick("text-white/35", "text-stone-400")}`}>Max Sheet</span>
                    <span className={`text-xs font-medium tabular-nums ${pick("text-white/70", "text-stone-700")}`}>{finish.maxSheetWidth} × {finish.maxSheetHeight} mm</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${pick("text-white/35", "text-stone-400")}`}>Process</span>
                    <span className={`text-xs font-medium ${pick("text-white/70", "text-stone-700")}`}>{finish.isAged ? "Hand-aged" : "Standard"}</span>
                  </div>
                </div>

                {/* Available thicknesses */}
                <div className="mt-3 flex items-center gap-2">
                  <span className={`text-xs ${pick("text-white/35", "text-stone-400")}`}>Thicknesses</span>
                  <div className="flex flex-wrap gap-1.5">
                    {finish.availableThicknesses.map((t) => (
                      <span
                        key={t}
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold tabular-nums ${pick(
                          "bg-white/[0.06] text-white/50",
                          "bg-stone-100 text-stone-600"
                        )}`}
                      >
                        {t}mm
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save button */}
              <button
                onClick={() => onSave(config)}
                disabled={isSaving}
                className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  isSaved
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-ht-gold text-white hover:bg-ht-gold/90"
                } disabled:opacity-50`}
              >
                {isSaving ? "Saving..." : isSaved ? "✓ Changes Saved" : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Swatch component ────────────────────────────────────────
function FinishSwatch({
  finish,
  config,
  onClick,
  pick,
}: {
  finish: Finish;
  config: FinishConfigRow | undefined;
  onClick: () => void;
  pick: (d: string, l: string) => string;
}) {
  const metal = METAL_ACCENTS[finish.baseMetal] ?? METAL_ACCENTS.steel;
  const isPlaceholder = finish.swatchImageUrl.includes("placeholder");
  const isActive = config?.is_active ?? true;

  return (
    <button
      onClick={onClick}
      className={`group relative text-left transition-all ${!isActive ? "opacity-40 hover:opacity-60" : ""}`}
    >
      {/* Circular swatch */}
      <div className="relative mx-auto aspect-square w-full max-w-[160px]">
        <div
          className={`relative aspect-square w-full overflow-hidden rounded-full border-2 transition-all group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-black/20 ${pick(
            `border-white/[0.08] group-hover:${metal.border}`,
            `border-stone-200 group-hover:${metal.border}`
          )}`}
        >
          {isPlaceholder ? (
            <div className={`h-full w-full bg-gradient-to-br ${metal.gradient}`}>
              <div className="flex h-full items-center justify-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">No swatch</span>
              </div>
            </div>
          ) : (
            <Image src={finish.swatchImageUrl} alt={finish.name} fill className="object-cover" sizes="160px" />
          )}

          {/* Hover overlay */}
          <div className={`absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 ${pick("bg-black/30", "bg-black/20")}`}>
            <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold text-stone-800 shadow-sm">
              Edit
            </span>
          </div>
        </div>

        {/* Active indicator */}
        {config && (
          <div
            className={`absolute -right-0.5 -top-0.5 h-5 w-5 rounded-full border-2 text-[9px] flex items-center justify-center ${
              isActive
                ? `bg-emerald-500 border-emerald-400 text-white shadow-md ${pick("shadow-emerald-500/30", "shadow-emerald-500/20")}`
                : `${pick("bg-white/10 border-white/20 text-white/40", "bg-stone-200 border-stone-300 text-stone-400")}`
            }`}
          >
            {isActive ? "✓" : "×"}
          </div>
        )}

        {/* Aged badge */}
        {finish.isAged && (
          <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${pick("bg-ht-dark border border-white/10 text-ht-gold", "bg-white border border-stone-200 text-ht-gold shadow-sm")}`}>
            Aged
          </div>
        )}
      </div>

      {/* Name & subtitle */}
      <div className="mt-3 text-center">
        <p className={`text-xs font-semibold uppercase tracking-wider ${pick("text-white/80", "text-stone-700")}`}>
          {finish.name}
        </p>
        <p className={`mt-0.5 text-[10px] leading-snug ${pick("text-white/35", "text-stone-400")}`}>
          {finish.subtitle}
        </p>
      </div>

      {/* Price tag */}
      {config && (
        <div className="mt-1.5 text-center">
          <span className={`text-[10px] font-semibold tabular-nums ${pick("text-white/25", "text-stone-300")}`}>
            ×{config.price_modifier}
          </span>
        </div>
      )}
    </button>
  );
}

export default function AdminFinishesPage() {
  const { pick } = useAdminTheme();
  const [finishes, setFinishes] = useState<FinishConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [selectedFinishId, setSelectedFinishId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/finishes")
      .then((r) => r.json())
      .then((data) => setFinishes(data.finishes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (id: string, field: string, value: number | boolean) => {
    setFinishes((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const save = async (finish: FinishConfigRow) => {
    setSaving(finish.id);
    const res = await fetch("/api/admin/finishes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: finish.id,
        price_modifier: finish.price_modifier,
        is_active: finish.is_active,
      }),
    });
    if (res.ok) {
      setSaved(finish.id);
      setTimeout(() => setSaved(null), 2000);
    }
    setSaving(null);
  };

  const closeModal = useCallback(() => setSelectedFinishId(null), []);

  // Get the selected finish + config for the modal
  const selectedFinish = selectedFinishId ? FINISHES.find((f) => f.id === selectedFinishId) : null;
  const selectedConfig = selectedFinishId ? finishes.find((f) => f.finish_id === selectedFinishId) : undefined;

  if (loading) {
    return (
      <div className={`flex h-64 items-center justify-center ${pick("text-white/30", "text-stone-400")}`}>
        Loading finishes...
      </div>
    );
  }

  const metals = ["copper", "brass", "zinc", "steel", "corten"] as const;
  const activeCount = finishes.filter((f) => f.is_active).length;
  const totalCount = finishes.length;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className={`font-serif text-xl font-bold tracking-wide sm:text-2xl ${pick("text-white", "text-stone-900")}`}>
          Our Finishes
        </h1>
        <p className={`mt-1 text-sm ${pick("text-white/40", "text-stone-500")}`}>
          Each finish is hand-aged with a unique patina — no two pieces are alike. Click a swatch to edit its details.
        </p>
        <div className={`mt-3 flex flex-wrap items-center gap-4 text-xs ${pick("text-white/40", "text-stone-400")}`}>
          <span>
            <span className={`font-semibold ${pick("text-emerald-400", "text-emerald-600")}`}>{activeCount}</span> active
          </span>
          <span>
            <span className="font-semibold">{totalCount}</span> total
          </span>
        </div>
      </div>

      {/* Metal sections */}
      {metals.map((metal) => {
        const accent = METAL_ACCENTS[metal];
        const metalFinishes = FINISHES.filter((f) => f.baseMetal === metal);
        const metalConfigs = finishes.filter((f) => {
          const local = FINISHES.find((lf) => lf.id === f.finish_id);
          return local?.baseMetal === metal;
        });

        if (metalFinishes.length === 0) return null;
        const activeInMetal = metalConfigs.filter((f) => f.is_active).length;

        return (
          <div key={metal}>
            <div className="mb-5 flex items-center gap-3">
              <div className={`h-8 w-1 rounded-full bg-gradient-to-b ${accent.gradient}`} />
              <div>
                <h2 className={`font-serif text-lg font-semibold ${pick("text-white", "text-stone-900")}`}>
                  {accent.label}
                </h2>
                <p className={`text-[11px] ${pick("text-white/30", "text-stone-400")}`}>
                  {metalFinishes.length} finishes · {activeInMetal} active
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6">
              {metalFinishes.map((finish) => {
                const config = finishes.find((f) => f.finish_id === finish.id);
                return (
                  <FinishSwatch
                    key={finish.id}
                    finish={finish}
                    config={config}
                    onClick={() => setSelectedFinishId(finish.id)}
                    pick={pick}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Detail modal */}
      {selectedFinish && (
        <FinishModal
          finish={selectedFinish}
          config={selectedConfig}
          onUpdate={update}
          onSave={save}
          onClose={closeModal}
          isSaving={saving === selectedConfig?.id}
          isSaved={saved === selectedConfig?.id}
          pick={pick}
        />
      )}
    </div>
  );
}
