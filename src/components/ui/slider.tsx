"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils/cn";

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  unit?: string;
  className?: string;
}

export function Slider({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  label,
  unit = "mm",
  className,
}: SliderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-ht-dark">{label}</span>
          <span className="tabular-nums text-ht-dark/60">
            {value}
            {unit}
          </span>
        </div>
      )}
      <SliderPrimitive.Root
        className="relative flex h-5 w-full touch-none select-none items-center"
        value={[value]}
        onValueChange={([v]) => onValueChange(v)}
        min={min}
        max={max}
        step={step}
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-ht-dark/10">
          <SliderPrimitive.Range className="absolute h-full bg-ht-gold" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-4 w-4 cursor-grab rounded-full border-2 border-ht-gold bg-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ht-gold/50 active:cursor-grabbing" />
      </SliderPrimitive.Root>
    </div>
  );
}
