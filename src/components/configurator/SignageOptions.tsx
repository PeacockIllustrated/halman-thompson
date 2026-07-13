"use client";

import { useConfiguratorStore } from "@/stores/configurator";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils/cn";
import { SIGNAGE_FONTS, SIGNAGE_METHODS } from "@/lib/products/signage";
import { DEFAULT_SIGNAGE_CONFIG } from "@/stores/configurator";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between">
      <span className="text-sm font-medium text-ht-dark">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-[22px] w-10 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${
          checked ? "bg-ht-gold" : "bg-ht-dark/15"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-transform duration-200 ${
            checked ? "translate-x-[22px]" : "translate-x-[3px]"
          }`}
        />
      </button>
    </label>
  );
}

export function SignageOptions() {
  const { signageConfig, setSignageConfig } = useConfiguratorStore();
  const cfg = signageConfig ?? DEFAULT_SIGNAGE_CONFIG;

  return (
    <div className="space-y-6">
      {/* ── Sign Text ──────────────────────────── */}
      <div className="space-y-2">
        <h3 className="font-serif text-lg font-semibold tracking-wide">Sign Text</h3>
        <textarea
          value={cfg.text}
          onChange={(e) => setSignageConfig({ text: e.target.value.slice(0, 60) })}
          rows={2}
          placeholder="Enter your sign text..."
          className="w-full rounded-xl border border-ht-dark/[0.12] bg-white px-3.5 py-2.5 text-sm text-ht-dark placeholder:text-ht-dark/35 focus:border-ht-gold/60 focus:outline-none focus:ring-2 focus:ring-ht-gold/15"
        />
        <p className="text-right text-[11px] text-ht-dark/35">{cfg.text.length}/60</p>
      </div>

      {/* ── Font ───────────────────────────────── */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-ht-dark">Font</label>
        <div className="grid grid-cols-2 gap-2">
          {SIGNAGE_FONTS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSignageConfig({ fontFamily: f.id })}
              className={cn(
                "rounded-xl border px-3 py-2.5 font-serif text-sm transition-all duration-200",
                cfg.fontFamily === f.id
                  ? "border-ht-gold/60 bg-ht-gold/[0.08] text-ht-dark ring-1 ring-ht-gold/25"
                  : "border-ht-dark/[0.08] text-ht-dark/55 hover:border-ht-dark/20"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Fabrication Method ─────────────────── */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-ht-dark">Fabrication</label>
        <div className="grid grid-cols-2 gap-2">
          {SIGNAGE_METHODS.map((m) => {
            const active = cfg.fabricationMethod === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSignageConfig({ fabricationMethod: m.id })}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-all duration-200",
                  active
                    ? "border-ht-gold/60 bg-ht-gold/[0.08] ring-1 ring-ht-gold/25"
                    : "border-ht-dark/[0.08] hover:border-ht-dark/20"
                )}
              >
                <span className="text-sm font-semibold text-ht-dark">{m.label}</span>
                <span className="text-[11px] leading-tight text-ht-dark/45">
                  {m.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Lettering size ─────────────────────── */}
      <div className="space-y-3">
        <h3 className="font-serif text-lg font-semibold tracking-wide">Lettering</h3>
        <Slider
          label="Letter Height"
          value={cfg.fontSize}
          onValueChange={(v) => setSignageConfig({ fontSize: v })}
          min={30}
          max={300}
          step={5}
          unit="mm"
        />
      </div>

      {/* ── Border ─────────────────────────────── */}
      <div className="space-y-2 rounded-xl border border-ht-dark/[0.06] p-3.5">
        <Toggle
          label="Raised Border"
          checked={cfg.hasBorder}
          onChange={(v) => setSignageConfig({ hasBorder: v })}
        />
        {cfg.hasBorder && (
          <Slider
            label="Border Width"
            value={cfg.borderWidth ?? 15}
            onValueChange={(v) => setSignageConfig({ borderWidth: v })}
            min={5}
            max={40}
            step={1}
            unit="mm"
          />
        )}
      </div>
    </div>
  );
}
