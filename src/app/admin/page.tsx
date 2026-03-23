"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdminTheme } from "./theme";
import type { QuoteRow } from "@/lib/supabase/database.types";

export default function AdminDashboard() {
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

  // Compute live stats
  const pending = quotes.filter((q) => q.status === "quote_requested").length;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = quotes.filter((q) => new Date(q.created_at) >= weekAgo).length;
  const total = quotes.length;
  const acceptedValue = quotes
    .filter((q) => q.status === "accepted")
    .reduce((sum, q) => sum + (Number(q.calculated_price) || 0), 0);

  const stats = [
    { label: "Pending", value: loading ? "—" : String(pending), href: "/admin/quotes", color: "text-amber-400" },
    { label: "This Week", value: loading ? "—" : String(thisWeek), href: "/admin/quotes", color: "text-blue-400" },
    { label: "Total", value: loading ? "—" : String(total), href: "/admin/quotes", darkColor: "text-white/70", lightColor: "text-stone-700" },
    { label: "Accepted", value: loading ? "—" : acceptedValue > 0 ? `£${acceptedValue.toFixed(0)}` : "£0", href: "/admin/quotes", color: "text-emerald-400" },
  ];

  const recentQuotes = quotes.slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className={`font-serif text-xl sm:text-2xl font-bold tracking-wide ${pick("text-white", "text-stone-900")}`}>
          Dashboard
        </h1>
        <p className={`mt-1 text-xs sm:text-sm ${pick("text-white/40", "text-stone-500")}`}>
          Overview of quotes and activity
        </p>
      </div>

      {/* Stats grid — 2×2 on mobile, 4 across on desktop */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`rounded-xl border p-3.5 sm:p-5 transition-all ${pick(
              "border-white/[0.06] bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]",
              "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 shadow-sm"
            )}`}
          >
            <p className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider ${pick("text-white/40", "text-stone-500")}`}>
              {s.label}
            </p>
            <p className={`mt-1.5 sm:mt-2 font-serif text-2xl sm:text-3xl font-bold ${s.color ?? pick(s.darkColor!, s.lightColor!)}`}>
              {s.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent activity — card-based on mobile, row-based on desktop */}
      {recentQuotes.length > 0 && (
        <div>
          <h2 className={`mb-2.5 sm:mb-3 font-serif text-base sm:text-lg font-semibold ${pick("text-white/70", "text-stone-700")}`}>
            Recent Quotes
          </h2>

          {/* Desktop table view */}
          <div className={`hidden sm:block overflow-hidden rounded-xl border ${pick("border-white/[0.06]", "border-stone-200 shadow-sm")}`}>
            {recentQuotes.map((q, i) => (
              <div
                key={q.id}
                className={`flex items-center justify-between px-5 py-3 ${
                  i < recentQuotes.length - 1
                    ? `border-b ${pick("border-white/[0.04]", "border-stone-100")}`
                    : ""
                }`}
              >
                <div>
                  <p className={`text-sm font-medium ${pick("text-white", "text-stone-900")}`}>
                    {q.customer_name}
                  </p>
                  <p className={`text-xs ${pick("text-white/40", "text-stone-400")}`}>
                    {q.product_type} · {q.finish_name} · {q.width}×{q.height}mm
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {q.calculated_price && (
                    <span className={`text-sm font-semibold tabular-nums ${pick("text-white/70", "text-stone-700")}`}>
                      £{Number(q.calculated_price).toFixed(2)}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      q.status === "quote_requested"
                        ? "bg-amber-500/15 text-amber-400"
                        : q.status === "accepted"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : pick("bg-white/10 text-white/50", "bg-stone-100 text-stone-500")
                    }`}
                  >
                    {q.status.replace(/_/g, " ")}
                  </span>
                  <span className={`text-xs tabular-nums ${pick("text-white/30", "text-stone-400")}`}>
                    {new Date(q.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile card view */}
          <div className="space-y-2.5 sm:hidden">
            {recentQuotes.map((q) => (
              <div
                key={q.id}
                className={`rounded-xl border p-3.5 ${pick(
                  "border-white/[0.06] bg-white/[0.03]",
                  "border-stone-200 bg-white shadow-sm"
                )}`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${pick("text-white", "text-stone-900")}`}>
                      {q.customer_name}
                    </p>
                    <p className={`mt-0.5 text-xs truncate ${pick("text-white/40", "text-stone-400")}`}>
                      {q.product_type} · {q.finish_name}
                    </p>
                  </div>
                  <span
                    className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      q.status === "quote_requested"
                        ? "bg-amber-500/15 text-amber-400"
                        : q.status === "accepted"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : pick("bg-white/10 text-white/50", "bg-stone-100 text-stone-500")
                    }`}
                  >
                    {q.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className={`mt-2 flex items-center justify-between border-t pt-2 ${pick("border-white/[0.04]", "border-stone-100")}`}>
                  <span className={`text-xs tabular-nums ${pick("text-white/40", "text-stone-500")}`}>
                    {q.width}×{q.height}mm
                  </span>
                  <div className="flex items-center gap-2">
                    {q.calculated_price && (
                      <span className={`text-sm font-semibold tabular-nums ${pick("text-white/70", "text-stone-700")}`}>
                        £{Number(q.calculated_price).toFixed(2)}
                      </span>
                    )}
                    <span className={`text-[10px] tabular-nums ${pick("text-white/30", "text-stone-400")}`}>
                      {new Date(q.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {quotes.length > 5 && (
            <Link
              href="/admin/quotes"
              className={`mt-2 inline-block text-xs font-medium ${pick(
                "text-ht-gold/70 hover:text-ht-gold",
                "text-ht-gold hover:text-ht-gold/80"
              )}`}
            >
              View all {quotes.length} quotes →
            </Link>
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="grid gap-2.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Manage Pricing", desc: "Adjust base metal costs, surcharges, and delivery rates", href: "/admin/pricing" },
          { title: "Product Config", desc: "Set dimension limits, labour multipliers, and active products", href: "/admin/products" },
          { title: "Finish Modifiers", desc: "Update finish price multipliers and availability", href: "/admin/finishes" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group rounded-xl border p-4 sm:p-5 transition-all ${pick(
              "border-white/[0.06] bg-white/[0.03] hover:border-ht-gold/20 hover:bg-ht-gold/[0.04]",
              "border-stone-200 bg-white hover:border-ht-gold/30 hover:bg-ht-gold/[0.03] shadow-sm"
            )}`}
          >
            <h3 className={`font-serif text-base sm:text-lg font-semibold group-hover:text-ht-gold ${pick("text-white", "text-stone-900")}`}>
              {item.title}
            </h3>
            <p className={`mt-0.5 sm:mt-1 text-xs sm:text-sm ${pick("text-white/40", "text-stone-500")}`}>{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
