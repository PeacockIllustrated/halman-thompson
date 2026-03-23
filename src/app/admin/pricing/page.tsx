"use client";

import { useEffect, useState } from "react";
import type { PricingConfigRow } from "@/lib/supabase/database.types";
import { useAdminTheme } from "../theme";

const LABELS: Record<string, string> = {
  base_price_per_m2: "Base Metal Cost (£/m²)",
  thickness_surcharges: "Thickness Surcharges (£/m²)",
  mounting_costs: "Mounting Costs (£)",
  multi_panel_surcharge: "Multi-Panel Surcharge (£)",
  delivery_base: "Base Delivery (£)",
  delivery_pallet_surcharge: "Pallet Surcharge (£)",
  pallet_threshold_mm: "Pallet Threshold (mm)",
  vat_rate: "VAT Rate",
  labour_base_pct: "Labour Base %",
};

export default function AdminPricingPage() {
  const { pick } = useAdminTheme();
  const [configs, setConfigs] = useState<PricingConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
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
      await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
    } catch {
      alert("Invalid JSON");
    }
    setSaving(null);
  };

  if (loading) {
    return <p className={pick("text-white/30", "text-stone-400")}>Loading pricing config...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`font-serif text-2xl font-bold tracking-wide ${pick("text-white", "text-stone-900")}`}>
          Pricing Configuration
        </h1>
        <p className={`mt-1 text-sm ${pick("text-white/40", "text-stone-500")}`}>
          Adjust material costs, surcharges, and rates. Changes take effect on new quotes.
        </p>
      </div>

      <div className="space-y-4">
        {configs.map((c) => {
          const isObject = typeof c.value === "object" && c.value !== null;
          return (
            <div
              key={c.key}
              className={`rounded-xl border p-5 ${pick(
                "border-white/[0.06] bg-white/[0.03]",
                "border-stone-200 bg-white shadow-sm"
              )}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-semibold ${pick("text-white", "text-stone-900")}`}>
                    {LABELS[c.key] ?? c.key}
                  </h3>
                  {c.description && (
                    <p className={`text-xs ${pick("text-white/30", "text-stone-400")}`}>{c.description}</p>
                  )}
                </div>
                <button
                  onClick={() => save(c.key)}
                  disabled={saving === c.key}
                  className="rounded-lg bg-ht-gold/15 px-3 py-1.5 text-xs font-medium text-ht-gold transition-all hover:bg-ht-gold/25 disabled:opacity-50"
                >
                  {saving === c.key ? "Saving..." : "Save"}
                </button>
              </div>

              {isObject ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(c.value as Record<string, number>).map(
                    ([k, v]) => (
                      <div key={k} className="flex items-center gap-2">
                        <span className={`min-w-[100px] text-xs capitalize ${pick("text-white/40", "text-stone-500")}`}>
                          {k.replace(/_/g, " ")}
                        </span>
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
                          className={`w-24 rounded-lg border px-3 py-1.5 text-sm tabular-nums outline-none ${pick(
                            "border-white/10 bg-white/[0.04] text-white focus:border-ht-gold/40",
                            "border-stone-300 bg-stone-50 text-stone-900 focus:border-ht-gold/60"
                          )}`}
                        />
                      </div>
                    )
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={edits[c.key] ?? ""}
                  onChange={(e) =>
                    setEdits((p) => ({ ...p, [c.key]: e.target.value }))
                  }
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${pick(
                    "border-white/10 bg-white/[0.04] text-white focus:border-ht-gold/40",
                    "border-stone-300 bg-stone-50 text-stone-900 focus:border-ht-gold/60"
                  )}`}
                />
              )}

              <p className={`mt-2 text-[10px] ${pick("text-white/20", "text-stone-400")}`}>
                Last updated: {new Date(c.updated_at).toLocaleDateString("en-GB")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
