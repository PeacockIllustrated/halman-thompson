"use client";

import { useEffect, useState } from "react";
import type { QuoteRow } from "@/lib/supabase/database.types";
import { useAdminTheme } from "../theme";

const STATUS_COLORS: Record<string, string> = {
  quote_requested: "bg-amber-500/15 text-amber-400",
  reviewed: "bg-blue-500/15 text-blue-400",
  quoted: "bg-purple-500/15 text-purple-400",
  accepted: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
  in_production: "bg-cyan-500/15 text-cyan-400",
  completed: "bg-stone-500/15 text-stone-500",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
        STATUS_COLORS[status] ?? "bg-stone-500/10 text-stone-500"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function AdminQuotesPage() {
  const { pick } = useAdminTheme();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/quotes")
      .then((r) => r.json())
      .then((data) => setQuotes(data.quotes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`font-serif text-2xl font-bold tracking-wide ${pick("text-white", "text-stone-900")}`}>
          Quotes
        </h1>
        <p className={`mt-1 text-sm ${pick("text-white/40", "text-stone-500")}`}>
          {quotes.length} total quotes
        </p>
      </div>

      <div className={`overflow-x-auto rounded-xl border ${pick("border-white/[0.06]", "border-stone-200 shadow-sm")}`}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className={`border-b text-xs uppercase tracking-wider ${pick(
              "border-white/[0.06] text-white/40",
              "border-stone-200 text-stone-400 bg-stone-50"
            )}`}>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Finish</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={`px-4 py-8 text-center ${pick("text-white/30", "text-stone-400")}`}>
                  Loading...
                </td>
              </tr>
            ) : quotes.length === 0 ? (
              <tr>
                <td colSpan={7} className={`px-4 py-8 text-center ${pick("text-white/30", "text-stone-400")}`}>
                  No quotes yet. They&apos;ll appear here when customers submit from the configurator.
                </td>
              </tr>
            ) : (
              quotes.map((q) => (
                <tr
                  key={q.id}
                  className={`border-b transition-colors ${pick(
                    "border-white/[0.03] hover:bg-white/[0.03]",
                    "border-stone-100 hover:bg-stone-50"
                  )}`}
                >
                  <td className={`px-4 py-3 ${pick("text-white/50", "text-stone-500")}`}>
                    {new Date(q.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className={`font-medium ${pick("text-white", "text-stone-900")}`}>{q.customer_name}</div>
                    <div className={`text-xs ${pick("text-white/40", "text-stone-400")}`}>{q.customer_email}</div>
                  </td>
                  <td className={`px-4 py-3 capitalize ${pick("text-white/60", "text-stone-600")}`}>
                    {q.product_type}
                  </td>
                  <td className={`px-4 py-3 ${pick("text-white/60", "text-stone-600")}`}>{q.finish_name}</td>
                  <td className={`px-4 py-3 tabular-nums ${pick("text-white/50", "text-stone-500")}`}>
                    {q.width}×{q.height}mm
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums ${pick("text-white/70", "text-stone-700")}`}>
                    {q.calculated_price
                      ? `£${Number(q.calculated_price).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={q.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
