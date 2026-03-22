"use client";

import Link from "next/link";

const stats = [
  { label: "Pending Quotes", value: "—", href: "/admin/quotes", color: "text-amber-400" },
  { label: "This Week", value: "—", href: "/admin/quotes", color: "text-blue-400" },
  { label: "Total Quotes", value: "—", href: "/admin/quotes", color: "text-white/70" },
  { label: "Accepted Value", value: "—", href: "/admin/quotes", color: "text-emerald-400" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-wide text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Overview of quotes and activity
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 transition-all hover:border-white/10 hover:bg-white/[0.05]"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-white/40">
              {s.label}
            </p>
            <p className={`mt-2 font-serif text-3xl font-bold ${s.color}`}>
              {s.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Manage Pricing",
            desc: "Adjust base metal costs, surcharges, and delivery rates",
            href: "/admin/pricing",
          },
          {
            title: "Product Config",
            desc: "Set dimension limits, labour multipliers, and active products",
            href: "/admin/products",
          },
          {
            title: "Finish Modifiers",
            desc: "Update finish price multipliers and availability",
            href: "/admin/finishes",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 transition-all hover:border-ht-gold/20 hover:bg-ht-gold/[0.04]"
          >
            <h3 className="font-serif text-lg font-semibold text-white group-hover:text-ht-gold">
              {item.title}
            </h3>
            <p className="mt-1 text-sm text-white/40">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Placeholder: connect to Supabase for live data */}
      <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
        <p className="text-sm text-white/30">
          Connect Supabase credentials in .env.local to see live data
        </p>
      </div>
    </div>
  );
}
