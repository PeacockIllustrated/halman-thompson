"use client";

import { useEffect, useState } from "react";
import type { FinishConfigRow } from "@/lib/supabase/database.types";
import { FINISHES } from "@/lib/products/finishes";

export default function AdminFinishesPage() {
  const [finishes, setFinishes] = useState<FinishConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

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
    await fetch("/api/admin/finishes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: finish.id,
        price_modifier: finish.price_modifier,
        is_active: finish.is_active,
      }),
    });
    setSaving(null);
  };

  if (loading) return <p className="text-white/30">Loading...</p>;

  // Group by metal type using the local FINISHES registry for metadata
  const metals = ["copper", "brass", "zinc", "steel", "corten"] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-wide text-white">
          Finish Configuration
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Adjust price multipliers and toggle availability for each finish.
        </p>
      </div>

      {metals.map((metal) => {
        const metalFinishes = finishes.filter((f) => {
          const local = FINISHES.find((lf) => lf.id === f.finish_id);
          return local?.baseMetal === metal;
        });
        if (metalFinishes.length === 0) return null;

        return (
          <div key={metal} className="space-y-2">
            <h2 className="font-serif text-lg font-semibold capitalize text-white/70">
              {metal}
            </h2>
            <div className="overflow-hidden rounded-xl border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-white/30">
                    <th className="px-4 py-2 text-left">Finish</th>
                    <th className="px-4 py-2 text-left">Price Modifier</th>
                    <th className="px-4 py-2 text-center">Active</th>
                    <th className="px-4 py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {metalFinishes.map((f) => {
                    const local = FINISHES.find((lf) => lf.id === f.finish_id);
                    return (
                      <tr
                        key={f.id}
                        className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-2.5 font-medium text-white">
                          {local?.name ?? f.finish_id}
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            step={0.05}
                            value={f.price_modifier}
                            onChange={(e) =>
                              update(f.id, "price_modifier", Number(e.target.value))
                            }
                            className="w-20 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-sm tabular-nums text-white outline-none focus:border-ht-gold/40"
                          />
                          <span className="ml-1 text-xs text-white/30">×</span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => update(f.id, "is_active", !f.is_active)}
                            className={`h-5 w-9 rounded-full transition-colors ${
                              f.is_active ? "bg-ht-gold" : "bg-white/15"
                            }`}
                          >
                            <span
                              className={`block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                                f.is_active ? "translate-x-[18px]" : "translate-x-[3px]"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => save(f)}
                            disabled={saving === f.id}
                            className="rounded-lg bg-ht-gold/15 px-2.5 py-1 text-[11px] font-medium text-ht-gold hover:bg-ht-gold/25 disabled:opacity-50"
                          >
                            {saving === f.id ? "..." : "Save"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
