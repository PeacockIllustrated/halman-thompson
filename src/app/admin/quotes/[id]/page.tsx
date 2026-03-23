"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminTheme } from "../../theme";
import type { QuoteRow, QuoteEventRow } from "@/lib/supabase/database.types";
import type { PriceBreakdown, WorktopConfig, FlatSheet } from "@/types";

const ALL_STATUSES = [
  "quote_requested",
  "reviewed",
  "quoted",
  "accepted",
  "rejected",
  "in_production",
  "completed",
] as const;

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
  quote_requested: "Quote Requested",
  reviewed: "Reviewed",
  quoted: "Quoted",
  accepted: "Accepted",
  rejected: "Rejected",
  in_production: "In Production",
  completed: "Completed",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[status] ?? "bg-stone-500/10 text-stone-500"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── File Download Card ─────────────────────────────────
function FileCard({
  label,
  description,
  url,
  fallbackContent,
  fileName,
  mime,
  icon,
  pick,
}: {
  label: string;
  description: string;
  url: string | null;
  fallbackContent: string | null;
  fileName: string;
  mime: string;
  icon: React.ReactNode;
  pick: (d: string, l: string) => string;
}) {
  const [previewing, setPreviewing] = useState(false);
  const [fetchedSvg, setFetchedSvg] = useState<string | null>(null);
  const [fetchingPreview, setFetchingPreview] = useState(false);

  // The SVG content to render in preview — either from DB fallback or fetched from URL
  const svgContent = fallbackContent || fetchedSvg;

  async function handlePreviewToggle() {
    if (previewing) {
      setPreviewing(false);
      return;
    }
    // If we have content already, just show it
    if (fallbackContent || fetchedSvg) {
      setPreviewing(true);
      return;
    }
    // Otherwise fetch from storage URL
    if (url && mime === "image/svg+xml") {
      setFetchingPreview(true);
      try {
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          setFetchedSvg(text);
          setPreviewing(true);
        }
      } catch {
        // Silently fail — preview just won't show
      } finally {
        setFetchingPreview(false);
      }
    }
  }

  function handleDownload() {
    if (url) {
      // Direct download from storage
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    } else if (fallbackContent) {
      // Legacy: download from raw string
      const blob = new Blob([fallbackContent], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(blobUrl);
    }
  }

  const isAvailable = url || fallbackContent;
  if (!isAvailable) return null;

  return (
    <div className={`rounded-xl border overflow-hidden ${pick("border-white/[0.06]", "border-stone-200")}`}>
      <div className={`px-3 py-3 sm:px-4 sm:py-3.5 ${pick("bg-white/[0.02]", "bg-stone-50/80")}`}>
        {/* Top row: icon + label */}
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${pick("bg-white/[0.06]", "bg-white border border-stone-200")}`}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold ${pick("text-white/80", "text-stone-700")}`}>{label}</p>
            <p className={`hidden text-[11px] sm:block ${pick("text-white/35", "text-stone-400")}`}>{description}</p>
          </div>
        </div>

        {/* Actions — stacked below on mobile, inline on desktop */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2 sm:mt-2">
          {/* Download button */}
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ht-gold/10 px-3 py-1.5 text-xs font-semibold text-ht-gold transition-colors hover:bg-ht-gold/20"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </button>

          {/* Preview toggle for SVG files */}
          {mime === "image/svg+xml" && (fallbackContent || url) && (
            <button
              onClick={handlePreviewToggle}
              disabled={fetchingPreview}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${pick(
                "text-white/50 hover:bg-white/[0.06] hover:text-white/70",
                "text-stone-500 hover:bg-stone-100 hover:text-stone-700"
              )}`}
            >
              {fetchingPreview ? "Loading..." : previewing ? "Hide Preview" : "Preview"}
            </button>
          )}

          {/* Direct link for storage files */}
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs transition-colors ${pick(
                "text-white/30 hover:bg-white/[0.04] hover:text-white/60",
                "text-stone-300 hover:bg-stone-100 hover:text-stone-600"
              )}`}
              title="Open in new tab"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span className="sm:hidden">Open</span>
            </a>
          )}
        </div>
      </div>

      {/* SVG inline preview */}
      {previewing && svgContent && mime === "image/svg+xml" && (
        <div className={`border-t p-3 sm:p-4 ${pick("border-white/[0.04] bg-white/[0.02]", "border-stone-100 bg-white")}`}>
          <div
            className="mx-auto max-w-full overflow-auto [&>svg]:max-h-[500px] [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      )}
    </div>
  );
}

// SVG icon components for file types
function SvgFileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15l2 2 4-4" />
    </svg>
  );
}

function DxfFileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}

// ─── Card wrapper ──────────────────────────────────────────
function Card({ title, children, pick }: { title: string; children: React.ReactNode; pick: (d: string, l: string) => string }) {
  return (
    <div className={`rounded-xl border ${pick("border-white/[0.06] bg-white/[0.02]", "border-stone-200 bg-white shadow-sm")}`}>
      <div className={`border-b px-5 py-3 ${pick("border-white/[0.04]", "border-stone-100")}`}>
        <h3 className={`text-sm font-semibold uppercase tracking-wider ${pick("text-white/50", "text-stone-500")}`}>{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// ─── Key-value row ─────────────────────────────────────────
function KV({ label, value, pick, mono }: { label: string; value: React.ReactNode; pick: (d: string, l: string) => string; mono?: boolean }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className={`shrink-0 text-xs ${pick("text-white/40", "text-stone-400")}`}>{label}</span>
      <span className={`text-right text-sm font-medium ${mono ? "tabular-nums" : ""} ${pick("text-white/80", "text-stone-700")}`}>{value}</span>
    </div>
  );
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { pick } = useAdminTheme();

  const [quote, setQuote] = useState<QuoteRow | null>(null);
  const [events, setEvents] = useState<QuoteEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [status, setStatus] = useState("");

  const fetchQuote = useCallback(async () => {
    const res = await fetch(`/api/admin/quotes/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setQuote(data.quote);
    setEvents(data.events ?? []);
    setInternalNotes(data.quote.internal_notes ?? "");
    setStatus(data.quote.status);
  }, [id]);

  useEffect(() => {
    fetchQuote().finally(() => setLoading(false));
  }, [fetchQuote]);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, internal_notes: internalNotes }),
    });
    await fetchQuote();
    setSaving(false);
  }

  // DXF download is now handled by FileCard component

  if (loading) {
    return (
      <div className={`flex h-64 items-center justify-center ${pick("text-white/30", "text-stone-400")}`}>
        Loading...
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="space-y-4 text-center">
        <p className={pick("text-white/50", "text-stone-500")}>Quote not found.</p>
        <button onClick={() => router.push("/admin/quotes")} className="text-sm text-ht-gold hover:underline">
          Back to quotes
        </button>
      </div>
    );
  }

  const pb = quote.price_breakdown as PriceBreakdown | null;
  const wc = quote.worktop_config as unknown as WorktopConfig | null;
  const fs = quote.flat_sheet as unknown as FlatSheet | null;
  const di = quote.device_info as Record<string, unknown> | null;

  const hasExports = quote.svg_workshop || quote.svg_production || quote.dxf_export
    || quote.svg_workshop_url || quote.svg_production_url || quote.dxf_export_url;
  const hasChanged = status !== quote.status || internalNotes !== (quote.internal_notes ?? "");

  return (
    <div className="min-w-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/quotes" className={`text-xs ${pick("text-white/30 hover:text-white/60", "text-stone-400 hover:text-stone-600")}`}>
              ← Quotes
            </Link>
            <StatusBadge status={quote.status} />
          </div>
          <h1 className={`mt-1 font-serif text-xl font-bold tracking-wide sm:text-2xl ${pick("text-white", "text-stone-900")}`}>
            {quote.customer_name}
          </h1>
          <p className={`text-xs ${pick("text-white/40", "text-stone-400")}`}>
            {new Date(quote.created_at).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {" · "}
            <span className="font-mono">{quote.id.slice(0, 8)}</span>
          </p>
        </div>
        {quote.configuration_url && (
          <Link
            href={quote.configuration_url}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg bg-ht-gold/10 px-4 py-2 text-sm font-semibold text-ht-gold transition-colors hover:bg-ht-gold/20"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open Configurator
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ─── Left column: Customer + Config + Pricing ─── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer info */}
          <Card title="Customer" pick={pick}>
            <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
              <KV label="Name" value={quote.customer_name} pick={pick} />
              <KV label="Email" value={<a href={`mailto:${quote.customer_email}`} className="text-ht-gold hover:underline">{quote.customer_email}</a>} pick={pick} />
              <KV label="Phone" value={quote.customer_phone ? <a href={`tel:${quote.customer_phone}`} className="text-ht-gold hover:underline">{quote.customer_phone}</a> : null} pick={pick} />
              <KV label="Trade" value={quote.is_trade ? "Yes" : "No"} pick={pick} />
              <KV label="Company" value={quote.company_name} pick={pick} />
            </div>
            {quote.notes && (
              <div className={`mt-3 rounded-lg border p-3 ${pick("border-white/[0.04] bg-white/[0.02]", "border-stone-100 bg-stone-50")}`}>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${pick("text-white/30", "text-stone-400")}`}>Customer Notes</span>
                <p className={`mt-1 text-sm ${pick("text-white/70", "text-stone-600")}`}>{quote.notes}</p>
              </div>
            )}
          </Card>

          {/* Product configuration */}
          <Card title="Configuration" pick={pick}>
            <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
              <KV label="Product" value={<span className="capitalize">{quote.product_type.replace(/_/g, " ")}</span>} pick={pick} />
              <KV label="Finish" value={quote.finish_name} pick={pick} />
              <KV label="Base Metal" value={quote.base_metal ? <span className="capitalize">{quote.base_metal}</span> : null} pick={pick} />
              <KV label="Dimensions" value={`${quote.width} × ${quote.height} mm`} pick={pick} mono />
              <KV label="Thickness" value={`${quote.thickness} mm`} pick={pick} mono />
              <KV label="Mounting" value={<span className="capitalize">{quote.mounting_type.replace(/_/g, " ")}</span>} pick={pick} />
              <KV label="Lacquer" value={<span className="capitalize">{quote.lacquer_type}</span>} pick={pick} />
              <KV label="Panels" value={quote.panel_count > 1 ? `${quote.panel_count} panels` : "Single sheet"} pick={pick} />
            </div>

            {/* Worktop details */}
            {wc && (
              <div className={`mt-4 rounded-lg border p-3 ${pick("border-white/[0.04] bg-white/[0.02]", "border-stone-100 bg-stone-50")}`}>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${pick("text-white/30", "text-stone-400")}`}>Worktop Details</span>
                <div className="mt-2 grid gap-x-8 gap-y-0 sm:grid-cols-2">
                  <KV label="Corner Radius" value={`${wc.cornerRadius} mm`} pick={pick} mono />
                  <KV label="Front Return" value={wc.frontReturn.enabled ? `${wc.frontReturn.depth} mm` : "None"} pick={pick} />
                  <KV label="Back Upstand" value={wc.backUpstand.enabled ? `${wc.backUpstand.depth} mm` : "None"} pick={pick} />
                  <KV label="Back Return" value={wc.backReturn.enabled ? `${wc.backReturn.depth} mm` : "None"} pick={pick} />
                  <KV label="Left Return" value={wc.leftReturn.enabled ? `${wc.leftReturn.depth} mm` : "None"} pick={pick} />
                  <KV label="Right Return" value={wc.rightReturn.enabled ? `${wc.rightReturn.depth} mm` : "None"} pick={pick} />
                  {wc.cutout.enabled && (
                    <>
                      <KV label="Cutout Shape" value={<span className="capitalize">{wc.cutout.shape}</span>} pick={pick} />
                      <KV label="Cutout Size" value={`${wc.cutout.width} × ${wc.cutout.depth} mm`} pick={pick} mono />
                      <KV label="Cutout Offset" value={`X: ${wc.cutout.offsetX}, Z: ${wc.cutout.offsetZ}`} pick={pick} mono />
                      <KV label="Cutout Edge" value={wc.cutout.returns.enabled ? `Returns ${wc.cutout.returns.depth}mm` : wc.cutout.lip.enabled ? `Lip ${wc.cutout.lip.depth}mm` : "None"} pick={pick} />
                    </>
                  )}
                  {wc.splitPosition != null && (
                    <KV label="Split" value={`${wc.splitPosition} mm (${wc.splitDirection})`} pick={pick} mono />
                  )}
                </div>
              </div>
            )}

            {/* Flat sheet summary */}
            {fs && (
              <div className={`mt-3 rounded-lg border p-3 ${pick("border-white/[0.04] bg-white/[0.02]", "border-stone-100 bg-stone-50")}`}>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${pick("text-white/30", "text-stone-400")}`}>Flat Sheet</span>
                <div className="mt-2 grid gap-x-8 gap-y-0 sm:grid-cols-2">
                  <KV label="Total Size" value={`${fs.totalWidth.toFixed(1)} × ${fs.totalHeight.toFixed(1)} mm`} pick={pick} mono />
                  <KV label="Bends" value={`${fs.bendCount} (${fs.totalBendDeduction.toFixed(1)} mm deduction)`} pick={pick} mono />
                  <KV label="Segments" value={`${fs.segments?.length ?? 0}`} pick={pick} mono />
                  <KV label="Split Required" value={fs.requiresSplit ? "Yes" : "No"} pick={pick} />
                </div>
              </div>
            )}
          </Card>

          {/* Price Breakdown */}
          {pb && (
            <Card title="Price Breakdown" pick={pick}>
              <div className="space-y-0">
                <KV label="Base Material" value={`£${pb.baseMaterial.toFixed(2)}`} pick={pick} mono />
                <KV label="Finish Surcharge" value={`£${pb.finishSurcharge.toFixed(2)}`} pick={pick} mono />
                <KV label="Thickness Surcharge" value={`£${pb.thicknessSurcharge.toFixed(2)}`} pick={pick} mono />
                <KV label="Labour" value={`£${pb.labourCost.toFixed(2)}`} pick={pick} mono />
                <KV label="Mounting Prep" value={`£${pb.mountingPrep.toFixed(2)}`} pick={pick} mono />
                {pb.multiPanelSurcharge > 0 && (
                  <KV label="Multi-Panel" value={`£${pb.multiPanelSurcharge.toFixed(2)}`} pick={pick} mono />
                )}
                <KV label="Delivery" value={`£${pb.deliveryEstimate.toFixed(2)}`} pick={pick} mono />
                <div className={`my-2 border-t ${pick("border-white/[0.06]", "border-stone-200")}`} />
                <KV label="Subtotal" value={`£${pb.subtotal.toFixed(2)}`} pick={pick} mono />
                <KV label="VAT (20%)" value={`£${pb.vat.toFixed(2)}`} pick={pick} mono />
                <div className={`my-2 border-t ${pick("border-white/[0.06]", "border-stone-200")}`} />
                <div className="flex items-baseline justify-between py-1.5">
                  <span className={`text-sm font-semibold ${pick("text-white/60", "text-stone-500")}`}>Total</span>
                  <span className={`font-serif text-xl font-bold tabular-nums ${pick("text-ht-gold", "text-ht-dark")}`}>
                    £{pb.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Fabrication Exports */}
          {hasExports && (
            <Card title="Fabrication Exports" pick={pick}>
              <div className="space-y-3">
                <FileCard
                  label="Workshop Print"
                  description="A4 scaled drawing for workshop reference"
                  url={quote.svg_workshop_url}
                  fallbackContent={quote.svg_workshop}
                  fileName={`HT-${quote.finish_name}-workshop.svg`}
                  mime="image/svg+xml"
                  icon={<SvgFileIcon />}
                  pick={pick}
                />
                <FileCard
                  label="Production Print"
                  description="1:1 scale blueprint for manufacturing"
                  url={quote.svg_production_url}
                  fallbackContent={quote.svg_production}
                  fileName={`HT-${quote.finish_name}-production.svg`}
                  mime="image/svg+xml"
                  icon={<SvgFileIcon />}
                  pick={pick}
                />
                <FileCard
                  label="DXF Cut File"
                  description="CNC-ready cutting file with layers"
                  url={quote.dxf_export_url}
                  fallbackContent={quote.dxf_export}
                  fileName={`HT-${quote.finish_name}-${quote.width}x${quote.height}.dxf`}
                  mime="application/dxf"
                  icon={<DxfFileIcon />}
                  pick={pick}
                />
              </div>
            </Card>
          )}
        </div>

        {/* ─── Right column: Status + Notes + Timeline + Device ─── */}
        <div className="space-y-6">
          {/* Status management */}
          <Card title="Status & Actions" pick={pick}>
            <div className="space-y-4">
              <div>
                <label className={`text-xs font-medium ${pick("text-white/40", "text-stone-400")}`}>Pipeline Stage</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm font-medium ${pick(
                    "border-white/[0.08] bg-white/[0.04] text-white",
                    "border-stone-200 bg-white text-stone-800"
                  )}`}
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`text-xs font-medium ${pick("text-white/40", "text-stone-400")}`}>Internal Notes</label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={4}
                  placeholder="Add notes about this quote..."
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${pick(
                    "border-white/[0.08] bg-white/[0.04] text-white/80 placeholder:text-white/20",
                    "border-stone-200 bg-white text-stone-700 placeholder:text-stone-300"
                  )}`}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !hasChanged}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  hasChanged
                    ? "bg-ht-gold text-white hover:bg-ht-gold/90"
                    : pick("bg-white/[0.04] text-white/20", "bg-stone-100 text-stone-300")
                } disabled:cursor-not-allowed`}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </Card>

          {/* Event Timeline */}
          {events.length > 0 && (
            <Card title="Activity" pick={pick}>
              <div className="space-y-3">
                {events.map((ev) => (
                  <div key={ev.id} className="flex gap-3">
                    <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      ev.event_type === "status_change" ? "bg-ht-gold" : "bg-blue-400"
                    }`} />
                    <div className="min-w-0">
                      <p className={`text-sm ${pick("text-white/70", "text-stone-600")}`}>
                        {ev.event_type === "status_change" ? (
                          <>
                            Status changed from{" "}
                            <span className="font-medium">{STATUS_LABELS[ev.old_value ?? ""] ?? ev.old_value}</span>
                            {" → "}
                            <span className="font-medium">{STATUS_LABELS[ev.new_value ?? ""] ?? ev.new_value}</span>
                          </>
                        ) : ev.event_type === "note_updated" ? (
                          "Internal notes updated"
                        ) : (
                          ev.event_type.replace(/_/g, " ")
                        )}
                      </p>
                      <p className={`text-[10px] tabular-nums ${pick("text-white/25", "text-stone-300")}`}>
                        {new Date(ev.created_at).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Device info */}
          {di && (
            <Card title="Submission Context" pick={pick}>
              <div className="space-y-0">
                <KV label="Viewport" value={`${di.viewportWidth} × ${di.viewportHeight}`} pick={pick} mono />
                <KV label="Screen" value={`${di.screenWidth} × ${di.screenHeight}`} pick={pick} mono />
                <KV label="Pixel Ratio" value={`${di.pixelRatio}x`} pick={pick} mono />
                <KV label="Language" value={String(di.language)} pick={pick} />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
