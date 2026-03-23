"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

const STATUS_LABELS: Record<string, string> = {
  quote_requested: "Requested",
  reviewed: "Reviewed",
  quoted: "Quoted",
  accepted: "Accepted",
  rejected: "Rejected",
  in_production: "In Production",
  completed: "Completed",
};

const PIPELINE_ORDER = [
  "quote_requested",
  "reviewed",
  "quoted",
  "accepted",
  "in_production",
  "completed",
  "rejected",
] as const;

const PIPELINE_COLORS: Record<string, string> = {
  quote_requested: "bg-amber-400",
  reviewed: "bg-blue-400",
  quoted: "bg-purple-400",
  accepted: "bg-emerald-400",
  in_production: "bg-cyan-400",
  completed: "bg-stone-400",
  rejected: "bg-red-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        STATUS_COLORS[status] ?? "bg-stone-500/10 text-stone-500"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function AdminQuotesPage() {
  const { pick } = useAdminTheme();
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/quotes")
      .then((r) => r.json())
      .then((data) => setQuotes(data.quotes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Compute pipeline counts
  const statusCounts = quotes.reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  // Filter quotes
  const filtered = quotes.filter((q) => {
    if (filter !== "all" && q.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        q.customer_name.toLowerCase().includes(s) ||
        q.customer_email.toLowerCase().includes(s) ||
        q.finish_name.toLowerCase().includes(s) ||
        q.product_type.toLowerCase().includes(s)
      );
    }
    return true;
  });

  // Pipeline value (active quotes only)
  const pipelineValue = quotes
    .filter((q) => !["rejected", "completed"].includes(q.status))
    .reduce((sum, q) => sum + (Number(q.calculated_price) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={`font-serif text-xl font-bold tracking-wide sm:text-2xl ${pick("text-white", "text-stone-900")}`}>
            Quotes
          </h1>
          <p className={`mt-0.5 text-xs sm:text-sm ${pick("text-white/40", "text-stone-500")}`}>
            {quotes.length} total · Pipeline value: <span className="font-semibold tabular-nums">£{pipelineValue.toFixed(0)}</span>
          </p>
        </div>
        {/* Search */}
        <div className="relative">
          <svg className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${pick("text-white/25", "text-stone-300")}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search quotes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm sm:w-64 ${pick(
              "border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/20",
              "border-stone-200 bg-white text-stone-800 placeholder:text-stone-300"
            )}`}
          />
        </div>
      </div>

      {/* Pipeline bar */}
      {quotes.length > 0 && (
        <div className={`rounded-xl border p-4 ${pick("border-white/[0.06] bg-white/[0.02]", "border-stone-200 bg-white shadow-sm")}`}>
          <div className="flex h-3 overflow-hidden rounded-full">
            {PIPELINE_ORDER.map((s) => {
              const count = statusCounts[s] || 0;
              if (count === 0) return null;
              const pct = (count / quotes.length) * 100;
              return (
                <div
                  key={s}
                  className={`${PIPELINE_COLORS[s]} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${STATUS_LABELS[s]}: ${count}`}
                />
              );
            })}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
            {PIPELINE_ORDER.map((s) => {
              const count = statusCounts[s] || 0;
              if (count === 0) return null;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(filter === s ? "all" : s)}
                  className={`flex items-center gap-1.5 text-xs transition-opacity ${
                    filter !== "all" && filter !== s ? "opacity-30" : ""
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${PIPELINE_COLORS[s]}`} />
                  <span className={pick("text-white/50", "text-stone-500")}>
                    {STATUS_LABELS[s]}
                  </span>
                  <span className={`font-semibold tabular-nums ${pick("text-white/70", "text-stone-700")}`}>{count}</span>
                </button>
              );
            })}
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className={`text-xs font-medium ${pick("text-ht-gold/60 hover:text-ht-gold", "text-ht-gold hover:text-ht-gold/80")}`}
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quotes table */}
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
              <th className="px-4 py-3 text-center">Files</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className={`px-4 py-8 text-center ${pick("text-white/30", "text-stone-400")}`}>
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className={`px-4 py-8 text-center ${pick("text-white/30", "text-stone-400")}`}>
                  {search || filter !== "all" ? "No quotes match your filter." : "No quotes yet."}
                </td>
              </tr>
            ) : (
              filtered.map((q) => (
                <tr
                  key={q.id}
                  onClick={() => router.push(`/admin/quotes/${q.id}`)}
                  className={`cursor-pointer border-b transition-colors ${pick(
                    "border-white/[0.03] hover:bg-white/[0.04]",
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
                    {q.product_type.replace(/_/g, " ")}
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
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {q.svg_workshop && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="SVG available" />
                      )}
                      {q.dxf_export && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" title="DXF available" />
                      )}
                      {!q.svg_workshop && !q.dxf_export && (
                        <span className={`text-xs ${pick("text-white/20", "text-stone-300")}`}>—</span>
                      )}
                    </div>
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
