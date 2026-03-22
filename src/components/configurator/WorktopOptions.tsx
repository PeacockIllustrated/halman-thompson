"use client";

import { useConfiguratorStore } from "@/stores/configurator";
import { Slider } from "@/components/ui/slider";
import type {
  WorktopConfig,
  WorktopEdgeConfig,
  CutoutShape,
} from "@/types";

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

function EdgeControl({
  label,
  config,
  onChange,
  min = 20,
  max = 80,
  unit = "mm",
}: {
  label: string;
  config: WorktopEdgeConfig;
  onChange: (c: WorktopEdgeConfig) => void;
  min?: number;
  max?: number;
  unit?: string;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-ht-dark/[0.06] p-3.5">
      <Toggle
        label={label}
        checked={config.enabled}
        onChange={(v) => onChange({ ...config, enabled: v })}
      />
      {config.enabled && (
        <Slider
          label={label === "Back Upstand" ? "Height" : "Depth"}
          value={config.depth}
          onValueChange={(v) => onChange({ ...config, depth: v })}
          min={min}
          max={max}
          step={5}
          unit={unit}
        />
      )}
    </div>
  );
}

const CUTOUT_SHAPES: { value: CutoutShape; label: string }[] = [
  { value: "rectangle", label: "Rectangle" },
  { value: "square", label: "Square" },
  { value: "oval", label: "Oval" },
];

export function WorktopOptions() {
  const { worktopConfig, setWorktopConfig, width, height, getFlatSheet } =
    useConfiguratorStore();
  const flatSheet = getFlatSheet();
  const config = worktopConfig;

  const update = (partial: Partial<WorktopConfig>) => {
    setWorktopConfig({ ...config, ...partial });
  };

  const updateCutout = (
    partial: Partial<WorktopConfig["cutout"]>
  ) => {
    const next = { ...config.cutout, ...partial };
    // Enforce square constraint
    if (next.shape === "square") {
      next.depth = next.width;
    }
    update({ cutout: next });
  };

  // Clamp cutout position so it stays inside the worktop surface
  const maxOffsetX = Math.max(0, (width - config.cutout.width) / 2 - 20);
  const maxOffsetZ = Math.max(
    0,
    (height -
      (config.cutout.shape === "square"
        ? config.cutout.width
        : config.cutout.depth)) /
      2 -
      20
  );

  return (
    <div className="space-y-5">
      {/* ── Edge Profile ─────────────────────────── */}
      <div className="space-y-3">
        <h3 className="font-serif text-lg font-semibold tracking-wide">Edge Profile</h3>
        <Slider
          label="Corner Radius"
          value={config.cornerRadius}
          onValueChange={(v) => update({ cornerRadius: v })}
          min={0}
          max={50}
          step={1}
          unit="mm"
        />
        {/* ── Returns (linked / unlinked) ── */}
        <div className="space-y-2 rounded-xl border border-ht-dark/[0.06] p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ht-dark">Returns</span>
            <button
              type="button"
              onClick={() => update({ returnsLinked: !config.returnsLinked })}
              title={config.returnsLinked ? "Unlink returns (set individual depths)" : "Link returns (shared depth)"}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium transition-all duration-200 ${
                config.returnsLinked
                  ? "bg-ht-gold/10 text-ht-gold ring-1 ring-ht-gold/20"
                  : "bg-ht-dark/5 text-ht-dark/40 ring-1 ring-ht-dark/10"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {config.returnsLinked ? (
                  /* link icon */
                  <>
                    <path d="M7 9a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5L8 3" />
                    <path d="M9 7a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" />
                  </>
                ) : (
                  /* unlink icon */
                  <>
                    <path d="M7 9a3.5 3.5 0 0 0 4.3.5L13 8a3.5 3.5 0 0 0-4.3-5.5" />
                    <path d="M9 7a3.5 3.5 0 0 0-4.3-.5L3 8a3.5 3.5 0 0 0 4.3 5.5" />
                    <line x1="2" y1="2" x2="14" y2="14" />
                  </>
                )}
              </svg>
              {config.returnsLinked ? "Linked" : "Unlinked"}
            </button>
          </div>

          {config.returnsLinked ? (
            /* Linked — one toggle per edge, shared depth slider */
            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {(["frontReturn", "leftReturn", "rightReturn"] as const).map((key) => {
                  const labels = { frontReturn: "Front", leftReturn: "Left", rightReturn: "Right" };
                  return (
                    <Toggle
                      key={key}
                      label={labels[key]}
                      checked={config[key].enabled}
                      onChange={(v) => update({ [key]: { ...config[key], enabled: v } })}
                    />
                  );
                })}
              </div>
              {(config.frontReturn.enabled || config.leftReturn.enabled || config.rightReturn.enabled) && (
                <Slider
                  label="Return Depth"
                  value={config.frontReturn.depth}
                  onValueChange={(v) => {
                    const patch: Partial<WorktopConfig> = {};
                    if (config.frontReturn.enabled) patch.frontReturn = { enabled: true, depth: v };
                    if (config.leftReturn.enabled) patch.leftReturn = { enabled: true, depth: v };
                    if (config.rightReturn.enabled) patch.rightReturn = { enabled: true, depth: v };
                    update(patch);
                  }}
                  min={20}
                  max={80}
                  step={5}
                  unit="mm"
                />
              )}
            </div>
          ) : (
            /* Unlinked — individual controls */
            <div className="space-y-2 pt-1">
              <EdgeControl
                label="Front Return"
                config={config.frontReturn}
                onChange={(v) => update({ frontReturn: v })}
              />
              <EdgeControl
                label="Left Return"
                config={config.leftReturn}
                onChange={(v) => update({ leftReturn: v })}
              />
              <EdgeControl
                label="Right Return"
                config={config.rightReturn}
                onChange={(v) => update({ rightReturn: v })}
              />
            </div>
          )}
        </div>

        {/* ── Back edge (upstand / return) ── */}
        <EdgeControl
          label="Back Upstand"
          config={config.backUpstand}
          onChange={(v) =>
            update({
              backUpstand: v,
              ...(v.enabled ? { backReturn: { ...config.backReturn, enabled: false } } : {}),
            })
          }
          min={50}
          max={200}
        />
        <EdgeControl
          label="Back Return"
          config={config.backReturn}
          onChange={(v) =>
            update({
              backReturn: v,
              ...(v.enabled ? { backUpstand: { ...config.backUpstand, enabled: false } } : {}),
            })
          }
        />
        {config.backUpstand.enabled && config.cornerRadius > 0 && (
          <p className="text-xs text-ht-dark/40 -mt-1">
            Corner radius applies to front corners only when upstand is active
          </p>
        )}
      </div>

      {/* ── Flat Sheet Info ──────────────────────── */}
      {flatSheet && (
        <div className="rounded-xl border border-ht-dark/[0.06] p-3.5 space-y-1">
          <h3 className="font-serif text-lg font-semibold tracking-wide">Flat Sheet</h3>
          <p className="text-sm text-ht-dark/60">
            {flatSheet.totalWidth}mm &times; {flatSheet.totalHeight}mm
          </p>
          <p className="text-sm text-ht-dark/60">
            {flatSheet.bendCount} bends ({flatSheet.totalBendDeduction}mm allowance)
          </p>
          {flatSheet.requiresSplit && (
            <p className="text-sm text-amber-600 font-medium">
              Requires 2 panels (exceeds max sheet size)
            </p>
          )}
        </div>
      )}

      {/* ── Sink Cutout ──────────────────────────── */}
      <div className="space-y-3">
        <h3 className="font-serif text-lg font-semibold tracking-wide">Sink Cutout</h3>
        <div className="rounded-xl border border-ht-dark/[0.06] p-3.5">
          <Toggle
            label="Add Sink Cutout"
            checked={config.cutout.enabled}
            onChange={(v) => updateCutout({ enabled: v })}
          />
        </div>

        {config.cutout.enabled && (
          <>
            {/* Shape selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ht-dark">Shape</label>
              <div className="relative flex rounded-xl bg-ht-dark/[0.06] p-1">
                {/* Animated sliding pill */}
                <span
                  className="pointer-events-none absolute inset-y-1 rounded-[10px] bg-ht-dark shadow-sm transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
                  style={{
                    width: `calc(${100 / CUTOUT_SHAPES.length}% - 4px)`,
                    transform: `translateX(calc(${CUTOUT_SHAPES.findIndex(s => s.value === config.cutout.shape) * 100}% + ${CUTOUT_SHAPES.findIndex(s => s.value === config.cutout.shape) * 4}px + 2px))`,
                  }}
                />
                {CUTOUT_SHAPES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => updateCutout({ shape: s.value })}
                    className={`relative z-10 flex-1 rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                      config.cutout.shape === s.value
                        ? "text-white"
                        : "text-ht-dark/50 hover:text-ht-dark/70"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cutout dimensions */}
            <Slider
              label="Cutout Width"
              value={config.cutout.width}
              onValueChange={(v) => updateCutout({ width: v })}
              min={150}
              max={Math.min(800, width - 100)}
              step={10}
              unit="mm"
            />
            {config.cutout.shape !== "square" && (
              <Slider
                label="Cutout Depth"
                value={config.cutout.depth}
                onValueChange={(v) => updateCutout({ depth: v })}
                min={150}
                max={Math.min(600, height - 100)}
                step={10}
                unit="mm"
              />
            )}

            {/* Corner radius — rectangle and square only */}
            {config.cutout.shape !== "oval" && (
              <Slider
                label="Corner Radius"
                value={config.cutout.cornerRadius}
                onValueChange={(v) => updateCutout({ cornerRadius: v })}
                min={0}
                max={Math.min(
                  50,
                  Math.floor(config.cutout.width / 4),
                  Math.floor(
                    (config.cutout.shape === "square"
                      ? config.cutout.width
                      : config.cutout.depth) / 4
                  )
                )}
                step={1}
                unit="mm"
              />
            )}

            {/* Position */}
            {maxOffsetX > 0 && (
              <Slider
                label="Position X"
                value={config.cutout.offsetX}
                onValueChange={(v) => updateCutout({ offsetX: v })}
                min={-maxOffsetX}
                max={maxOffsetX}
                step={10}
                unit="mm"
              />
            )}
            {maxOffsetZ > 0 && (
              <Slider
                label="Position Y"
                value={config.cutout.offsetZ}
                onValueChange={(v) => updateCutout({ offsetZ: v })}
                min={-maxOffsetZ}
                max={maxOffsetZ}
                step={10}
                unit="mm"
              />
            )}

            {/* Cutout returns (down) */}
            <div className="rounded-xl border border-ht-dark/[0.06] p-3.5 space-y-2">
              <Toggle
                label="Cutout Returns"
                checked={config.cutout.returns.enabled}
                onChange={(v) =>
                  updateCutout({
                    returns: { ...config.cutout.returns, enabled: v },
                    // Disable lip when returns are enabled
                    ...(v ? { lip: { ...config.cutout.lip, enabled: false } } : {}),
                  })
                }
              />
              {config.cutout.returns.enabled && (
                <Slider
                  label="Return Depth"
                  value={config.cutout.returns.depth}
                  onValueChange={(v) =>
                    updateCutout({
                      returns: { ...config.cutout.returns, depth: v },
                    })
                  }
                  min={15}
                  max={60}
                  step={5}
                  unit="mm"
                />
              )}
            </div>

            {/* Cutout lip (up) */}
            <div className="rounded-xl border border-ht-dark/[0.06] p-3.5 space-y-2">
              <Toggle
                label="Cutout Lip"
                checked={config.cutout.lip.enabled}
                onChange={(v) =>
                  updateCutout({
                    lip: { ...config.cutout.lip, enabled: v },
                    // Disable returns when lip is enabled
                    ...(v ? { returns: { ...config.cutout.returns, enabled: false } } : {}),
                  })
                }
              />
              {config.cutout.lip.enabled && (
                <Slider
                  label="Lip Height"
                  value={config.cutout.lip.depth}
                  onValueChange={(v) =>
                    updateCutout({
                      lip: { ...config.cutout.lip, depth: v },
                    })
                  }
                  min={15}
                  max={60}
                  step={5}
                  unit="mm"
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
