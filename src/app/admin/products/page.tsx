"use client";

import { useEffect, useState } from "react";
import type { ProductConfigRow } from "@/lib/supabase/database.types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

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
    await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    setSaving(null);
  };

  if (loading) return <p className="text-white/30">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-wide text-white">
          Product Configuration
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Dimension limits, labour multipliers, and active status per product type.
        </p>
      </div>

      <div className="space-y-4">
        {products.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-serif text-lg font-semibold capitalize text-white">
                  {p.product_type.replace(/_/g, " ")}
                </h3>
                <button
                  onClick={() => updateField(p.id, "is_active", !p.is_active)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all ${
                    p.is_active
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {p.is_active ? "Active" : "Inactive"}
                </button>
              </div>
              <button
                onClick={() => save(p)}
                disabled={saving === p.id}
                className="rounded-lg bg-ht-gold/15 px-3 py-1.5 text-xs font-medium text-ht-gold transition-all hover:bg-ht-gold/25 disabled:opacity-50"
              >
                {saving === p.id ? "Saving..." : "Save"}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {([
                ["min_width", "Min Width (mm)"],
                ["max_width", "Max Width (mm)"],
                ["min_height", "Min Height (mm)"],
                ["max_height", "Max Height (mm)"],
                ["default_width", "Default Width"],
                ["default_height", "Default Height"],
                ["labour_multiplier", "Labour Multiplier"],
                ["starting_price", "Starting Price (£)"],
              ] as const).map(([field, label]) => (
                <div key={field}>
                  <label className="text-[11px] text-white/40">{label}</label>
                  <input
                    type="number"
                    step={field === "labour_multiplier" ? 0.1 : 1}
                    value={p[field]}
                    onChange={(e) =>
                      updateField(p.id, field, Number(e.target.value))
                    }
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm tabular-nums text-white outline-none focus:border-ht-gold/40"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
