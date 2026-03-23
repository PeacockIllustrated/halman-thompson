"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminTheme } from "./theme";
import type { QuoteRow } from "@/lib/supabase/database.types";

const STATUS_LABELS: Record<string, string> = {
  quote_requested: "Requested",
  reviewed: "Reviewed",
  quoted: "Quoted",
  accepted: "Accepted",
  rejected: "Rejected",
  in_production: "In Production",
  completed: "Completed",
};

const STATUS_COLORS: Record<string, string> = {
  quote_requested: "bg-amber-500/15 text-amber-400",
  reviewed: "bg-blue-500/15 text-blue-400",
  quoted: "bg-purple-500/15 text-purple-400",
  accepted: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
  in_production: "bg-cyan-500/15 text-cyan-400",
  completed: "bg-stone-500/15 text-stone-500",
};

const PIPELINE_STAGES = [
  { key: "quote_requested", label: "Requested", color: "bg-amber-400", textColor: "text-amber-400" },
  { key: "reviewed", label: "Reviewed", color: "bg-blue-400", textColor: "text-blue-400" },
  { key: "quoted", label: "Quoted", color: "bg-purple-400", textColor: "text-purple-400" },
  { key: "accepted", label: "Accepted", color: "bg-emerald-400", textColor: "text-emerald-400" },
  { key: "in_production", label: "In Production", color: "bg-cyan-400", textColor: "text-cyan-400" },
  { key: "completed", label: "Completed", color: "bg-stone-400", textColor: "text-stone-400" },
] as const;

export default function AdminDashboard() {
  const { pick } = useAdminTheme();
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/quotes")
      .then((r) => r.json())
      .then((data) => setQuotes(data.quotes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ─── Stats ────────────────────────────────────────────
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const pending = quotes.filter((q) => q.status === "quote_requested").length;
  const thisWeek = quotes.filter((q) => new Date(q.created_at) >= weekAgo).length;
  const thisMonth = quotes.filter((q) => new Date(q.created_at) >= monthAgo).length;

  const activeQuotes = quotes.filter((q) => !["rejected", "completed"].includes(q.status));
  const pipelineValue = activeQuotes.reduce((sum, q) => sum + (Number(q.calculated_price) || 0), 0);
  const acceptedValue = quotes
    .filter((q) => q.status === "accepted" || q.status === "in_production" || q.status === "completed")
    .reduce((sum, q) => sum + (Number(q.calculated_price) || 0), 0);

  const avgOrderValue = quotes.length > 0
    ? quotes.reduce((sum, q) => sum + (Number(q.calculated_price) || 0), 0) / quotes.filter(q => q.calculated_price).length
    : 0;

  // Pipeline counts
  const statusCounts = quotes.reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  // Conversion rate
  const totalProcessed = quotes.filter((q) => q.status !== "quote_requested").length;
  const wonCount = quotes.filter((q) => ["accepted", "in_production", "completed"].includes(q.status)).length;
  const conversionRate = totalProcessed > 0 ? ((wonCount / totalProcessed) * 100).toFixed(0) : "—";

  // Product popularity
  const productCounts = quotes.reduce<Record<string, number>>((acc, q) => {
    acc[q.product_type] = (acc[q.product_type] || 0) + 1;
    return acc;
  }, {});
  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Top finishes
  const finishCounts = quotes.reduce<Record<string, number>>((acc, q) => {
    acc[q.finish_name] = (acc[q.finish_name] || 0) + 1;
    return acc;
  }, {});
  const topFinishes = Object.entries(finishCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const recentQuotes = quotes.slice(0, 8);

  const stats = [
    { label: "Pending", value: loading ? "—" : String(pending), color: "text-amber-400" },
    { label: "This Week", value: loading ? "—" : String(thisWeek), color: "text-blue-400" },
    { label: "This Month", value: loading ? "—" : String(thisMonth), color: "text-purple-400" },
    { label: "Pipeline", value: loading ? "—" : `£${pipelineValue.toFixed(0)}`, color: "text-ht-gold" },
    { label: "Won Revenue", value: loading ? "—" : `£${acceptedValue.toFixed(0)}`, color: "text-emerald-400" },
    { label: "Conversion", value: loading ? "—" : `${conversionRate}%`, color: "text-cyan-400" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className={`font-serif text-xl font-bold tracking-wide sm:text-2xl ${pick("text-white", "text-stone-900")}`}>
          Dashboard
        </h1>
        <p className={`mt-1 text-xs sm:text-sm ${pick("text-white/40", "text-stone-500")}`}>
          Pipeline overview · Avg order value:{" "}
          <span className="font-semibold tabular-nums">
            {loading ? "—" : `£${avgOrderValue.toFixed(0)}`}
          </span>
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Link
            key={s.label}
            href="/admin/quotes"
            className={`rounded-xl border p-3.5 sm:p-4 transition-all ${pick(
              "border-white/[0.06] bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]",
              "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 shadow-sm"
            )}`}
          >
            <p className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider ${pick("text-white/40", "text-stone-500")}`}>
              {s.label}
            </p>
            <p className={`mt-1 font-serif text-xl font-bold sm:text-2xl ${s.color}`}>
              {s.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Pipeline funnel */}
      {quotes.length > 0 && (
        <div className={`rounded-xl border p-5 ${pick("border-white/[0.06] bg-white/[0.02]", "border-stone-200 bg-white shadow-sm")}`}>
          <h2 className={`mb-4 text-xs font-semibold uppercase tracking-wider ${pick("text-white/40", "text-stone-500")}`}>
            Pipeline
          </h2>
          <div className="space-y-2">
            {PIPELINE_STAGES.map((stage) => {
              const count = statusCounts[stage.key] || 0;
              const maxCount = Math.max(...Object.values(statusCounts), 1);
              const pct = (count / maxCount) * 100;
              const value = quotes
                .filter((q) => q.status === stage.key)
                .reduce((sum, q) => sum + (Number(q.calculated_price) || 0), 0);

              return (
                <button
                  key={stage.key}
                  onClick={() => router.push("/admin/quotes")}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${pick(
                    "hover:bg-white/[0.03]",
                    "hover:bg-stone-50"
                  )}`}
                >
                  <span className={`w-24 shrink-0 text-xs font-medium ${pick("text-white/50", "text-stone-500")}`}>
                    {stage.label}
                  </span>
                  <div className={`h-5 flex-1 overflow-hidden rounded-full ${pick("bg-white/[0.04]", "bg-stone-100")}`}>
                    <div
                      className={`h-full rounded-full ${stage.color} transition-all duration-500`}
                      style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className={`w-8 text-right text-sm font-bold tabular-nums ${stage.textColor}`}>
                    {count}
                  </span>
                  {value > 0 && (
                    <span className={`w-16 text-right text-xs tabular-nums ${pick("text-white/30", "text-stone-400")}`}>
                      £{value.toFixed(0)}
                    </span>
                  )}
                </button>
              );
            })}
            {(statusCounts["rejected"] || 0) > 0 && (
              <div className={`mt-1 flex items-center gap-3 rounded-lg px-3 py-1 ${pick("text-white/25", "text-stone-300")}`}>
                <span className="w-24 text-xs">Rejected</span>
                <span className="text-xs font-semibold tabular-nums">{statusCounts["rejected"]}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent quotes — takes 2 cols */}
        <div className="lg:col-span-2">
          {recentQuotes.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className={`font-serif text-base font-semibold sm:text-lg ${pick("text-white/70", "text-stone-700")}`}>
                  Recent Quotes
                </h2>
                {quotes.length > 8 && (
                  <Link href="/admin/quotes" className={`text-xs font-medium ${pick("text-ht-gold/60 hover:text-ht-gold", "text-ht-gold hover:text-ht-gold/80")}`}>
                    View all {quotes.length} →
                  </Link>
                )}
              </div>

              <div className={`overflow-hidden rounded-xl border ${pick("border-white/[0.06]", "border-stone-200 shadow-sm")}`}>
                {recentQuotes.map((q, i) => (
                  <div
                    key={q.id}
                    onClick={() => router.push(`/admin/quotes/${q.id}`)}
                    className={`flex cursor-pointer items-center justify-between px-4 py-3 transition-colors ${
                      i < recentQuotes.length - 1
                        ? `border-b ${pick("border-white/[0.04]", "border-stone-100")}`
                        : ""
                    } ${pick("hover:bg-white/[0.04]", "hover:bg-stone-50")}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${pick("text-white", "text-stone-900")}`}>
                        {q.customer_name}
                      </p>
                      <p className={`text-xs ${pick("text-white/40", "text-stone-400")}`}>
                        <span className="capitalize">{q.product_type.replace(/_/g, " ")}</span>
                        {" · "}
                        {q.finish_name}
                        {" · "}
                        {q.width}×{q.height}mm
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {q.svg_workshop && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Has exports" />
                      )}
                      {q.calculated_price && (
                        <span className={`text-sm font-semibold tabular-nums ${pick("text-white/70", "text-stone-700")}`}>
                          £{Number(q.calculated_price).toFixed(0)}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          STATUS_COLORS[q.status] ?? pick("bg-white/10 text-white/50", "bg-stone-100 text-stone-500")
                        }`}
                      >
                        {STATUS_LABELS[q.status] ?? q.status.replace(/_/g, " ")}
                      </span>
                      <span className={`text-xs tabular-nums ${pick("text-white/30", "text-stone-400")}`}>
                        {new Date(q.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && quotes.length === 0 && (
            <div className={`flex h-40 items-center justify-center rounded-xl border ${pick("border-white/[0.06] text-white/30", "border-stone-200 text-stone-400")}`}>
              No quotes yet — they&apos;ll appear here when customers submit from the configurator.
            </div>
          )}
        </div>

        {/* Right column — insights + quick links */}
        <div className="space-y-6">
          {/* Product popularity */}
          {topProducts.length > 0 && (
            <div className={`rounded-xl border p-4 ${pick("border-white/[0.06] bg-white/[0.02]", "border-stone-200 bg-white shadow-sm")}`}>
              <h3 className={`mb-3 text-xs font-semibold uppercase tracking-wider ${pick("text-white/40", "text-stone-500")}`}>
                Top Products
              </h3>
              <div className="space-y-2">
                {topProducts.map(([product, count]) => (
                  <div key={product} className="flex items-center justify-between">
                    <span className={`text-sm capitalize ${pick("text-white/60", "text-stone-600")}`}>
                      {product.replace(/_/g, " ")}
                    </span>
                    <span className={`text-sm font-semibold tabular-nums ${pick("text-white/70", "text-stone-700")}`}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top finishes */}
          {topFinishes.length > 0 && (
            <div className={`rounded-xl border p-4 ${pick("border-white/[0.06] bg-white/[0.02]", "border-stone-200 bg-white shadow-sm")}`}>
              <h3 className={`mb-3 text-xs font-semibold uppercase tracking-wider ${pick("text-white/40", "text-stone-500")}`}>
                Popular Finishes
              </h3>
              <div className="space-y-2">
                {topFinishes.map(([finish, count]) => (
                  <div key={finish} className="flex items-center justify-between">
                    <span className={`text-sm ${pick("text-white/60", "text-stone-600")}`}>{finish}</span>
                    <span className={`text-sm font-semibold tabular-nums ${pick("text-white/70", "text-stone-700")}`}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="space-y-2.5">
            {[
              { title: "Manage Pricing", desc: "Base costs, surcharges, delivery", href: "/admin/pricing" },
              { title: "Product Config", desc: "Limits, multipliers, active products", href: "/admin/products" },
              { title: "Finish Modifiers", desc: "Price modifiers, availability", href: "/admin/finishes" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group block rounded-xl border p-4 transition-all ${pick(
                  "border-white/[0.06] bg-white/[0.03] hover:border-ht-gold/20 hover:bg-ht-gold/[0.04]",
                  "border-stone-200 bg-white hover:border-ht-gold/30 hover:bg-ht-gold/[0.03] shadow-sm"
                )}`}
              >
                <h3 className={`text-sm font-semibold group-hover:text-ht-gold ${pick("text-white", "text-stone-900")}`}>
                  {item.title}
                </h3>
                <p className={`mt-0.5 text-xs ${pick("text-white/40", "text-stone-500")}`}>{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
