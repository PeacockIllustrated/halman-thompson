"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfiguratorStore } from "@/stores/configurator";
import { generateSvg } from "@/lib/worktop/exportSvg";
import { generateDxf } from "@/lib/worktop/exportDxf";

export function QuoteForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isTrade, setIsTrade] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const store = useConfiguratorStore();
  const {
    productType,
    selectedFinish,
    baseMetal,
    width,
    height,
    thickness,
    mountingType,
    lacquerType,
    panelCount,
    panelLayout,
    calculatedPrice,
    priceBreakdown,
    worktopConfig,
    signageConfig,
    getSnapshot,
    getFlatSheet,
  } = store;

  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Generate SVG/DXF exports for worktops
    let svgWorkshop: string | undefined;
    let svgProduction: string | undefined;
    let dxfExport: string | undefined;
    let flatSheetData: ReturnType<typeof getFlatSheet> = null;

    if (productType === "worktop") {
      flatSheetData = getFlatSheet();
      if (flatSheetData) {
        const svgOpts = {
          flatSheet: flatSheetData,
          config: worktopConfig,
          finishName: selectedFinish?.name ?? "Custom",
          width,
          depth: height,
          thickness,
          productName: "Worktop",
        };
        try {
          svgWorkshop = generateSvg({ ...svgOpts, mode: "workshop" });
          svgProduction = generateSvg({ ...svgOpts, mode: "production" });
        } catch { /* non-critical */ }
        try {
          dxfExport = generateDxf(flatSheetData, selectedFinish?.name ?? "Custom");
        } catch { /* non-critical */ }
      }
    }

    // Build configuration URL from snapshot
    const snapshot = getSnapshot();
    const configUrl = `${window.location.origin}/configure/${productType}?cfg=${encodeURIComponent(JSON.stringify(snapshot))}`;

    // Device info
    const deviceInfo = {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
      language: navigator.language,
    };

    const quoteData = {
      customerName: name,
      customerEmail: email,
      customerPhone: phone || undefined,
      isTrade,
      companyName: isTrade ? companyName || undefined : undefined,
      productType,
      finishId: selectedFinish?.id,
      finishName: selectedFinish?.name,
      baseMetal,
      width,
      height,
      thickness,
      mountingType,
      lacquerType,
      panelCount,
      calculatedPrice,
      priceBreakdown,
      notes: notes || undefined,
      worktopConfig: productType === "worktop" ? worktopConfig : undefined,
      signageConfig: signageConfig || undefined,
      configurationUrl: configUrl,
      configurationSnapshot: snapshot,
      flatSheet: flatSheetData || undefined,
      panelLayout: panelLayout || undefined,
      svgWorkshop: svgWorkshop || undefined,
      svgProduction: svgProduction || undefined,
      dxfExport: dxfExport || undefined,
      deviceInfo,
    };

    try {
      const res = await fetch("/api/quotes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit quote");
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="font-serif text-xl font-semibold text-green-800">
          Quote Request Sent
        </p>
        <p className="mt-2 text-sm text-green-700">
          Thank you, {name}! Our team will be in touch within 1-2 working days
          with your bespoke quote.
        </p>
        <p className="mt-1 text-xs text-green-600">
          A confirmation has been sent to {email}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-serif text-lg font-semibold">Your Details</h3>

      <Input
        label="Full Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Sarah Johnson"
        required
      />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="e.g. sarah@example.com"
        required
      />

      <Input
        label="Phone (optional)"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="e.g. 07700 900123"
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsTrade(!isTrade)}
          className={`relative h-5 w-9 rounded-full transition-colors ${isTrade ? "bg-ht-gold" : "bg-ht-dark/20"}`}
        >
          <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${isTrade ? "translate-x-4" : ""}`} />
        </button>
        <label className="text-sm font-medium text-ht-dark">Trade customer</label>
      </div>

      {isTrade && (
        <Input
          label="Company Name"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g. Smith Kitchens Ltd"
        />
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-ht-dark">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special requirements or questions..."
          rows={3}
          className="w-full rounded-md border border-ht-dark/20 bg-white px-3 py-2 text-sm text-ht-dark placeholder:text-ht-dark/40 focus:border-ht-gold focus:outline-none focus:ring-1 focus:ring-ht-gold/50"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Submit Quote Request"}
      </Button>

      <p className="text-center text-[10px] text-ht-dark/40">
        We&apos;ll respond within 1-2 working days. No obligation.
      </p>
    </form>
  );
}
