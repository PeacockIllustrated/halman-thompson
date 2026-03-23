"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { ProductConfigRow } from "@/lib/supabase/database.types";
import { useAdminTheme } from "../theme";

// ─── Product icons ──────────────────────────────────────────
function IconSplashback() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="12" rx="1" />
      <path d="M6 20h12" />
      <path d="M6 16v4" />
      <path d="M18 16v4" />
    </svg>
  );
}
function IconWorktop() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8h20v3H2z" />
      <path d="M4 11v9" />
      <path d="M20 11v9" />
      <path d="M8 11v6" />
      <path d="M16 11v6" />
    </svg>
  );
}
function IconBarTop() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v12" />
      <path d="M19 8v12" />
      <path d="M8 12h8" />
    </svg>
  );
}
function IconTable() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="3" rx="1" />
      <path d="M4 10v10" />
      <path d="M20 10v10" />
    </svg>
  );
}
function IconWallPanel() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
    </svg>
  );
}
function IconTile() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </svg>
  );
}
function IconSignage() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M7 9h10" />
      <path d="M7 13h6" />
    </svg>
  );
}
function IconLetters() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h3l8-8-3-3-8 8v3z" />
      <path d="M13.5 6.5l3-3 3 3-3 3" />
    </svg>
  );
}
function IconPlinth() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="16" width="20" height="4" rx="1" />
      <path d="M4 16V6" />
      <path d="M20 16V6" />
    </svg>
  );
}
function IconCookerHood() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14h16l-2-8H6l-2 8z" />
      <path d="M4 14v4h16v-4" />
      <path d="M10 3v3" />
      <path d="M14 3v3" />
    </svg>
  );
}
function IconStairs() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h4v-4h4v-4h4v-4h4" />
    </svg>
  );
}
function IconBathPanel() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h16" />
      <path d="M4 12v5a2 2 0 002 2h12a2 2 0 002-2v-5" />
      <path d="M6 12V5a2 2 0 012-2h1" />
      <circle cx="12" cy="8" r="1" />
    </svg>
  );
}
function IconDoor() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="1" />
      <circle cx="15" cy="12" r="1" />
    </svg>
  );
}
function IconLaserScreen() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="16" cy="8" r="1.5" />
      <circle cx="8" cy="16" r="1.5" />
      <circle cx="16" cy="16" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
    </svg>
  );
}
function IconPushPlate() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M12 7v4" />
      <circle cx="12" cy="15" r="1" />
    </svg>
  );
}
function IconGenericProduct() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    </svg>
  );
}

// ─── Product type metadata ──────────────────────────────────
interface ProductMeta {
  icon: ReactNode;
  color: string;
  description: string;
}

const PRODUCT_META: Record<string, ProductMeta> = {
  splashback: {
    icon: <IconSplashback />,
    color: "text-amber-500 bg-amber-500/10",
    description: "Kitchen & bathroom splashbacks — hero product",
  },
  worktop: {
    icon: <IconWorktop />,
    color: "text-orange-500 bg-orange-500/10",
    description: "Kitchen and bathroom worktop surfaces",
  },
  bar_top: {
    icon: <IconBarTop />,
    color: "text-purple-500 bg-purple-500/10",
    description: "Commercial and home bar countertops",
  },
  table_top: {
    icon: <IconTable />,
    color: "text-blue-500 bg-blue-500/10",
    description: "Dining and coffee table surfaces",
  },
  wall_panel: {
    icon: <IconWallPanel />,
    color: "text-teal-500 bg-teal-500/10",
    description: "Decorative wall cladding panels",
  },
  tile: {
    icon: <IconTile />,
    color: "text-indigo-500 bg-indigo-500/10",
    description: "Individual metal tiles for walls and floors",
  },
  signage: {
    icon: <IconSignage />,
    color: "text-rose-500 bg-rose-500/10",
    description: "Engraved or laser-cut metal signage",
  },
  metal_letters: {
    icon: <IconLetters />,
    color: "text-yellow-500 bg-yellow-500/10",
    description: "Individual 3D metal letters and numbers",
  },
  plinth: {
    icon: <IconPlinth />,
    color: "text-stone-500 bg-stone-500/10",
    description: "Kitchen unit plinths and kickboards",
  },
  cooker_hood: {
    icon: <IconCookerHood />,
    color: "text-red-500 bg-red-500/10",
    description: "Bespoke cooker hood cladding",
  },
  stair_riser: {
    icon: <IconStairs />,
    color: "text-cyan-500 bg-cyan-500/10",
    description: "Staircase riser panels",
  },
  bath_panel: {
    icon: <IconBathPanel />,
    color: "text-sky-500 bg-sky-500/10",
    description: "Bathtub side and end panels",
  },
  cupboard_door: {
    icon: <IconDoor />,
    color: "text-emerald-500 bg-emerald-500/10",
    description: "Cabinet and cupboard door fronts",
  },
  laser_cut_screen: {
    icon: <IconLaserScreen />,
    color: "text-violet-500 bg-violet-500/10",
    description: "Decorative laser-cut screening panels",
  },
  door_push_plate: {
    icon: <IconPushPlate />,
    color: "text-lime-500 bg-lime-500/10",
    description: "Push plates for commercial doors",
  },
};

function getProductMeta(type: string): ProductMeta {
  return PRODUCT_META[type] ?? {
    icon: <IconGenericProduct />,
    color: "text-stone-400 bg-stone-400/10",
    description: "Custom product type",
  };
}

export default function AdminProductsPage() {
  const { pick } = useAdminTheme();
  const [products, setProducts] = useState<ProductConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data) => setProducts(data.products ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateField = (id: string, field: string, value: number | boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const save = async (product: ProductConfigRow) => {
    setSaving(product.id);
    const res = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    if (res.ok) {
      setSaved(product.id);
      setTimeout(() => setSaved(null), 2000);
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div className={`flex h-64 items-center justify-center ${pick("text-white/30", "text-stone-400")}`}>
        Loading product configuration...
      </div>
    );
  }

  // Separate active and inactive
  const active = products.filter((p) => p.is_active);
  const inactive = products.filter((p) => !p.is_active);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className={`font-serif text-xl font-bold tracking-wide sm:text-2xl ${pick("text-white", "text-stone-900")}`}>
          Product Configuration
        </h1>
        <p className={`mt-1 text-sm ${pick("text-white/40", "text-stone-500")}`}>
          Dimension limits, labour multipliers, and starting prices for each product type.
        </p>
      </div>

      {/* Summary bar */}
      <div className={`flex flex-wrap items-center gap-4 rounded-xl border px-5 py-3.5 ${pick("border-white/[0.06] bg-white/[0.02]", "border-stone-200 bg-white shadow-sm")}`}>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className={`text-sm ${pick("text-white/60", "text-stone-600")}`}>
            <span className="font-semibold">{active.length}</span> Active
          </span>
        </div>
        {inactive.length > 0 && (
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${pick("bg-white/20", "bg-stone-300")}`} />
            <span className={`text-sm ${pick("text-white/40", "text-stone-400")}`}>
              <span className="font-semibold">{inactive.length}</span> Inactive
            </span>
          </div>
        )}
      </div>

      {/* Active products */}
      {active.length > 0 && (
        <div className="space-y-4">
          <h2 className={`text-xs font-semibold uppercase tracking-wider ${pick("text-white/30", "text-stone-400")}`}>
            Active Products
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((p) => {
              const meta = getProductMeta(p.product_type);
              const isExpanded = expanded === p.id;
              const isSaving = saving === p.id;
              const isSaved = saved === p.id;

              return (
                <div
                  key={p.id}
                  className={`rounded-xl border transition-all ${pick(
                    "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]",
                    "border-stone-200 bg-white shadow-sm hover:border-stone-300"
                  )} ${isExpanded ? "sm:col-span-2 xl:col-span-3" : ""}`}
                >
                  {/* Card header — always visible */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : p.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${pick("hover:bg-white/[0.02]", "hover:bg-stone-50")}`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                      {meta.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-sm font-semibold capitalize ${pick("text-white", "text-stone-900")}`}>
                        {p.product_type.replace(/_/g, " ")}
                      </h3>
                      <p className={`truncate text-[11px] ${pick("text-white/35", "text-stone-400")}`}>
                        {meta.description}
                      </p>
                    </div>

                    {/* Quick stats */}
                    <div className="hidden items-center gap-3 sm:flex">
                      <div className="text-right">
                        <p className={`text-[10px] ${pick("text-white/25", "text-stone-300")}`}>From</p>
                        <p className={`text-sm font-semibold tabular-nums ${pick("text-white/70", "text-stone-700")}`}>
                          £{p.starting_price}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] ${pick("text-white/25", "text-stone-300")}`}>Labour</p>
                        <p className={`text-sm font-semibold tabular-nums ${pick("text-white/70", "text-stone-700")}`}>
                          ×{p.labour_multiplier}
                        </p>
                      </div>
                    </div>

                    {/* Expand chevron */}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className={`shrink-0 transition-transform ${pick("text-white/20", "text-stone-300")} ${isExpanded ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Expanded configuration */}
                  {isExpanded && (
                    <div className={`border-t px-4 py-4 ${pick("border-white/[0.04]", "border-stone-100")}`}>
                      {/* Dimension limits */}
                      <div className="mb-4">
                        <h4 className={`mb-2.5 text-[10px] font-semibold uppercase tracking-wider ${pick("text-white/30", "text-stone-400")}`}>
                          Dimension Limits (mm)
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {([
                            ["min_width", "Min Width"],
                            ["max_width", "Max Width"],
                            ["min_height", "Min Height"],
                            ["max_height", "Max Height"],
                          ] as const).map(([field, label]) => (
                            <div key={field} className={`rounded-lg px-3 py-2 ${pick("bg-white/[0.03]", "bg-stone-50")}`}>
                              <label className={`text-[10px] font-medium ${pick("text-white/35", "text-stone-400")}`}>{label}</label>
                              <input
                                type="number"
                                value={p[field]}
                                onChange={(e) => updateField(p.id, field, Number(e.target.value))}
                                className={`mt-0.5 w-full rounded border-0 bg-transparent px-0 py-0.5 text-sm font-semibold tabular-nums outline-none ${pick("text-white", "text-stone-900")}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Defaults */}
                      <div className="mb-4">
                        <h4 className={`mb-2.5 text-[10px] font-semibold uppercase tracking-wider ${pick("text-white/30", "text-stone-400")}`}>
                          Defaults
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {([
                            ["default_width", "Default Width (mm)"],
                            ["default_height", "Default Height (mm)"],
                            ["labour_multiplier", "Labour Multiplier"],
                            ["starting_price", "Starting Price (£)"],
                          ] as const).map(([field, label]) => (
                            <div key={field} className={`rounded-lg px-3 py-2 ${pick("bg-white/[0.03]", "bg-stone-50")}`}>
                              <label className={`text-[10px] font-medium ${pick("text-white/35", "text-stone-400")}`}>{label}</label>
                              <input
                                type="number"
                                step={field === "labour_multiplier" ? 0.1 : 1}
                                value={p[field]}
                                onChange={(e) => updateField(p.id, field, Number(e.target.value))}
                                className={`mt-0.5 w-full rounded border-0 bg-transparent px-0 py-0.5 text-sm font-semibold tabular-nums outline-none ${pick("text-white", "text-stone-900")}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            updateField(p.id, "is_active", false);
                            save({ ...p, is_active: false });
                          }}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${pick(
                            "text-red-400/60 hover:bg-red-400/10 hover:text-red-400",
                            "text-red-400 hover:bg-red-50"
                          )}`}
                        >
                          Deactivate
                        </button>
                        <button
                          onClick={() => save(p)}
                          disabled={isSaving}
                          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                            isSaved
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-ht-gold text-white hover:bg-ht-gold/90"
                          } disabled:opacity-50`}
                        >
                          {isSaving ? "Saving..." : isSaved ? "✓ Saved" : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inactive products */}
      {inactive.length > 0 && (
        <div className="space-y-4">
          <h2 className={`text-xs font-semibold uppercase tracking-wider ${pick("text-white/20", "text-stone-300")}`}>
            Inactive Products
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {inactive.map((p) => {
              const meta = getProductMeta(p.product_type);
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 opacity-60 transition-all hover:opacity-80 ${pick(
                    "border-white/[0.04] bg-white/[0.01]",
                    "border-stone-100 bg-stone-50"
                  )}`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.color} opacity-50`}>
                    {meta.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-sm font-medium capitalize ${pick("text-white/50", "text-stone-500")}`}>
                      {p.product_type.replace(/_/g, " ")}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      updateField(p.id, "is_active", true);
                      save({ ...p, is_active: true });
                    }}
                    className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500 transition-colors hover:bg-emerald-500/20"
                  >
                    Activate
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
