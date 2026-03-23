"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { PricingConfigRow } from "@/lib/supabase/database.types";
import { useAdminTheme } from "../theme";

// ─── Icon components ────────────────────────────────────────
function IconMaterial() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="4" rx="1" />
      <rect x="2" y="14" width="20" height="4" rx="1" />
    </svg>
  );
}
function IconThickness() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h18" />
      <path d="M12 3v18" />
      <path d="M8 7l4-4 4 4" />
      <path d="M8 17l4 4 4-4" />
    </svg>
  );
}
function IconMounting() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
function IconPanels() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconDelivery() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
function IconPercent() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}
function IconLabour() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function IconPallet() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16" />
      <path d="M4 21h16" />
      <path d="M12 3v18" />
      <path d="M4 12h16" />
    </svg>
  );
}

// ─── Config metadata ─────────────────────────────────────────
interface ConfigMeta {
  label: string;
  description: string;
  icon: ReactNode;
  color: string; // accent color class
  unit?: string;
}

const CONFIG_META: Record<string, ConfigMeta> = {
  base_price_per_m2: {
    label: "Base Metal Costs",
    description: "Cost per square metre for each metal type",
    icon: <IconMaterial />,
    color: "text-amber-500",
    unit: "£/m²",
  },
  thickness_surcharges: {
    label: "Thickness Surcharges",
    description: "Additional cost per m² for non-standard thicknesses",
    icon: <IconThickness />,
    color: "text-blue-500",
    unit: "£/m²",
  },
  mounting_costs: {
    label: "Mounting Costs",
    description: "Labour and materials for each mounting preparation type",
    icon: <IconMounting />,
    color: "text-purple-500",
    unit: "£",
  },
  multi_panel_surcharge: {
    label: "Multi-Panel Surcharge",
    description: "Fixed surcharge when a piece requires multiple panels",
    icon: <IconPanels />,
    color: "text-cyan-500",
    unit: "£",
  },
  delivery_base: {
    label: "Base Delivery Cost",
    description: "Standard delivery charge for single-panel orders",
    icon: <IconDelivery />,
    color: "text-emerald-500",
    unit: "£",
  },
  delivery_pallet_surcharge: {
    label: "Pallet Delivery Surcharge",
    description: "Additional charge when items exceed pallet threshold",
    icon: <IconDelivery />,
    color: "text-emerald-500",
    unit: "£",
  },
  pallet_threshold_mm: {
    label: "Pallet Threshold",
    description: "Maximum dimension before pallet delivery is required",
    icon: <IconPallet />,
    color: "text-orange-500",
    unit: "mm",
  },
  vat_rate: {
    label: "VAT Rate",
    description: "Value-added tax rate applied to all quotes",
    icon: <IconPercent />,
    color: "text-red-400",
  },
  labour_base_pct: {
    label: "Labour Base Percentage",
    description: "Base labour cost as a percentage of material cost",
    icon: <IconLabour />,
    color: "text-indigo-400",
    unit: "%",
  },
};

// ─── Grouped ordering ───────────────────────────────────────
const GROUPS: { title: string; keys: string[] }[] = [
  {
    title: "Material & Fabrication",
    keys: ["base_price_per_m2", "thickness_surcharges", "mounting_costs", "multi_panel_surcharge"],
  },
  {
    title: "Delivery",
    keys: ["delivery_base", "delivery_pallet_surcharge", "pallet_threshold_mm"],
  },
  {
    title: "Tax & Labour",
    keys: ["vat_rate", "labour_base_pct"],
  },
];

export default function AdminPricingPage() {
  const { pick } = useAdminTheme();
  const [configs, setConfigs] = useState<PricingConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/pricing")
      .then((r) => r.json())
      .then((data) => {
        setConfigs(data.configs ?? []);
        const initial: Record<string, string> = {};
        (data.configs ?? []).forEach((c: PricingConfigRow) => {
          initial[c.key] = JSON.stringify(c.value, null, 2);
        });
        setEdits(initial);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (key: string) => {
    setSaving(key);
    try {
      const value = JSON.parse(edits[key]);
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        setSaved(key);
        setTimeout(() => setSaved(null), 2000);
      }
    } catch {
      alert("Invalid JSON");
    }
    setSaving(null);
  };

  const configMap = Object.fromEntries(configs.map((c) => [c.key, c]));

  if (loading) {
    return (
      <div className={`flex h-64 items-center justify-center ${pick("text-white/30", "text-stone-400")}`}>
        Loading pricing configuration...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className={`font-serif text-xl font-bold tracking-wide sm:text-2xl ${pick("text-white", "text-stone-900")}`}>
          Pricing Configuration
        </h1>
        <p className={`mt-1 text-sm ${pick("text-white/40", "text-stone-500")}`}>
          Adjust material costs, surcharges, and rates. Changes take effect on new quotes.
        </p>
      </div>

      {/* Grouped sections */}
      {GROUPS.map((group) => (
        <div key={group.title} className="space-y-4">
          <h2 className={`text-xs font-semibold uppercase tracking-wider ${pick("text-white/30", "text-stone-400")}`}>
            {group.title}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {group.keys.map((key) => {
              const c = configMap[key];
              if (!c) return null;
              const meta = CONFIG_META[key] ?? {
                label: key,
                description: "",
                icon: <IconMaterial />,
                color: "text-stone-400",
              };
              const isObject = typeof c.value === "object" && c.value !== null;
              const isSaved = saved === key;
              const isSaving = saving === key;

              return (
                <div
                  key={key}
                  className={`group rounded-xl border transition-all ${pick(
                    "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]",
                    "border-stone-200 bg-white shadow-sm hover:border-stone-300"
                  )} ${isObject ? "sm:col-span-2" : ""}`}
                >
                  {/* Card header */}
                  <div className={`flex items-start gap-3 border-b px-4 py-3.5 ${pick("border-white/[0.04]", "border-stone-100")}`}>
                    <div className={`mt-0.5 ${meta.color}`}>{meta.icon}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-sm font-semibold ${pick("text-white", "text-stone-900")}`}>
                        {meta.label}
                      </h3>
                      <p className={`text-[11px] leading-relaxed ${pick("text-white/35", "text-stone-400")}`}>
                        {meta.description}
                      </p>
                    </div>
                    <button
                      onClick={() => save(key)}
                      disabled={isSaving}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        isSaved
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-ht-gold/10 text-ht-gold hover:bg-ht-gold/20"
                      } disabled:opacity-50`}
                    >
                      {isSaving ? "Saving..." : isSaved ? "✓ Saved" : "Save"}
                    </button>
                  </div>

                  {/* Card body */}
                  <div className="px-4 py-3.5">
                    {isObject ? (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(c.value as Record<string, number>).map(([k, v]) => (
                          <div key={k} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${pick("bg-white/[0.02]", "bg-stone-50")}`}>
                            <span className={`min-w-0 flex-1 truncate text-xs capitalize ${pick("text-white/50", "text-stone-500")}`}>
                              {k.replace(/_/g, " ")}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                defaultValue={v}
                                onChange={(e) => {
                                  const obj = JSON.parse(edits[c.key]);
                                  obj[k] = Number(e.target.value);
                                  setEdits((p) => ({
                                    ...p,
                                    [c.key]: JSON.stringify(obj, null, 2),
                                  }));
                                }}
                                className={`w-20 rounded-lg border px-2.5 py-1 text-right text-sm tabular-nums outline-none transition-colors ${pick(
                                  "border-white/[0.08] bg-white/[0.04] text-white focus:border-ht-gold/40",
                                  "border-stone-200 bg-white text-stone-900 focus:border-ht-gold/60"
                                )}`}
                              />
                              {meta.unit && (
                                <span className={`text-[10px] ${pick("text-white/25", "text-stone-300")}`}>
                                  {meta.unit}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={edits[key] ?? ""}
                          onChange={(e) => setEdits((p) => ({ ...p, [key]: e.target.value }))}
                          className={`w-full max-w-[200px] rounded-lg border px-3 py-2 text-sm tabular-nums outline-none transition-colors ${pick(
                            "border-white/[0.08] bg-white/[0.04] text-white focus:border-ht-gold/40",
                            "border-stone-200 bg-white text-stone-900 focus:border-ht-gold/60"
                          )}`}
                        />
                        {meta.unit && (
                          <span className={`text-xs ${pick("text-white/30", "text-stone-400")}`}>{meta.unit}</span>
                        )}
                      </div>
                    )}

                    <p className={`mt-2.5 text-[10px] ${pick("text-white/15", "text-stone-300")}`}>
                      Updated {new Date(c.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
