"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { FinishConfigRow } from "@/lib/supabase/database.types";
import { FINISHES } from "@/lib/products/finishes";
import type { Finish } from "@/types";
import { useAdminTheme } from "../theme";

// ─── Metal accent colours ────────────────────────────────────
const METAL_ACCENTS: Record<string, { gradient: string; label: string; text: string; border: string }> = {
  copper: {
    gradient: "from-amber-700 via-orange-600 to-amber-800",
    label: "Copper",
    text: "text-amber-500",
    border: "border-amber-500/30",
  },
  brass: {
    gradient: "from-yellow-600 via-amber-500 to-yellow-700",
    label: "Brass",
    text: "text-yellow-500",
    border: "border-yellow-500/30",
  },
  zinc: {
    gradient: "from-stone-400 via-stone-500 to-stone-600",
    label: "Zinc",
    text: "text-stone-400",
    border: "border-stone-400/30",
  },
  steel: {
    gradient: "from-slate-700 via-slate-800 to-slate-900",
    label: "Steel",
    text: "text-slate-400",
    border: "border-slate-400/30",
  },
  corten: {
    gradient: "from-orange-800 via-red-900 to-orange-900",
    label: "Corten Steel",
    text: "text-orange-500",
    border: "border-orange-500/30",
  },
};

// ─── Swatch component ────────────────────────────────────────
function FinishSwatch({
  finish,
  config,
  onUpdate,
  onSave,
  isSaving,
  isSaved,
  pick,
}: {
  finish: Finish;
  config: FinishConfigRow | undefined;
  onUpdate: (id: string, field: string, value: number | boolean) => void;
  onSave: (config: FinishConfigRow) => void;
  isSaving: boolean;
  isSaved: boolean;
  pick: (d: string, l: string) => string;
}) {
  const [hovered, setHovered] = useState(false);
  const metal = METAL_ACCENTS[finish.baseMetal] ?? METAL_ACCENTS.steel;
  const isPlaceholder = finish.swatchImageUrl.includes("placeholder");
  const isActive = config?.is_active ?? true;

  return (
    <div
      className={`group relative transition-all ${!isActive ? "opacity-40" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Circular swatch */}
      <div className="relative mx-auto aspect-square w-full max-w-[160px]">
        <div
          className={`relative aspect-square w-full overflow-hidden rounded-full border-2 transition-all ${
            hovered
              ? `${metal.border} shadow-lg shadow-black/20 scale-105`
              : pick("border-white/[0.08]", "border-stone-200")
          }`}
        >
          {isPlaceholder ? (
            /* CSS gradient fallback for finishes without real swatch photos */
            <div className={`h-full w-full bg-gradient-to-br ${metal.gradient}`}>
              <div className="flex h-full items-center justify-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  No swatch
                </span>
              </div>
            </div>
          ) : (
            <Image
              src={finish.swatchImageUrl}
              alt={finish.name}
              fill
              className="object-cover"
              sizes="160px"
            />
          )}
        </div>

        {/* Active toggle overlay */}
        {config && (
          <button
            onClick={() => {
              onUpdate(config.id, "is_active", !config.is_active);
              onSave({ ...config, is_active: !config.is_active });
            }}
            className={`absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] transition-all ${
              isActive
                ? `bg-emerald-500 border-emerald-400 text-white ${pick("shadow-emerald-500/30", "shadow-emerald-500/20")} shadow-md`
                : `${pick("bg-white/10 border-white/20 text-white/40", "bg-stone-200 border-stone-300 text-stone-400")}`
            }`}
            title={isActive ? "Click to deactivate" : "Click to activate"}
          >
            {isActive ? "✓" : "×"}
          </button>
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

      {/* Price modifier — visible on hover or always on mobile */}
      {config && (
        <div className={`mt-2 flex items-center justify-center gap-1.5 transition-opacity ${hovered ? "opacity-100" : "opacity-0 sm:group-hover:opacity-100"}`}>
          <span className={`text-[10px] ${pick("text-white/30", "text-stone-400")}`}>×</span>
          <input
            type="number"
            step={0.05}
            value={config.price_modifier}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onUpdate(config.id, "price_modifier", Number(e.target.value))}
            className={`w-16 rounded-lg border px-2 py-1 text-center text-xs tabular-nums outline-none transition-colors ${pick(
              "border-white/[0.08] bg-white/[0.04] text-white focus:border-ht-gold/40",
              "border-stone-200 bg-white text-stone-900 focus:border-ht-gold/60"
            )}`}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave(config);
            }}
            disabled={isSaving}
            className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-all ${
              isSaved
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-ht-gold/10 text-ht-gold hover:bg-ht-gold/20"
            } disabled:opacity-50`}
          >
            {isSaving ? "..." : isSaved ? "✓" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminFinishesPage() {
  const { pick } = useAdminTheme();
  const [finishes, setFinishes] = useState<FinishConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className={`flex h-64 items-center justify-center ${pick("text-white/30", "text-stone-400")}`}>
        Loading finishes...
      </div>
    );
  }

  const metals = ["copper", "brass", "zinc", "steel", "corten"] as const;

  // Count stats
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
          Each finish is hand-aged with a unique patina — no two pieces are alike. Adjust price multipliers and toggle availability below.
        </p>
        <div className={`mt-3 flex flex-wrap items-center gap-4 text-xs ${pick("text-white/40", "text-stone-400")}`}>
          <span>
            <span className={`font-semibold ${pick("text-emerald-400", "text-emerald-600")}`}>{activeCount}</span> active
          </span>
          <span>
            <span className="font-semibold">{totalCount}</span> total
          </span>
          <span className={`text-[10px] ${pick("text-white/20", "text-stone-300")}`}>
            Hover over a swatch to adjust pricing
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
            {/* Metal section header */}
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

            {/* Swatch grid — matching HT website layout */}
            <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6">
              {metalFinishes.map((finish) => {
                const config = finishes.find((f) => f.finish_id === finish.id);
                return (
                  <FinishSwatch
                    key={finish.id}
                    finish={finish}
                    config={config}
                    onUpdate={update}
                    onSave={save}
                    isSaving={saving === config?.id}
                    isSaved={saved === config?.id}
                    pick={pick}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
