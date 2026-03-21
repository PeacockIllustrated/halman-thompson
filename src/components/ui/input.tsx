"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  unit?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, unit, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="text-sm font-medium text-ht-dark">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              "h-10 w-full rounded-xl border border-ht-dark/[0.08] bg-white px-3.5 text-sm tabular-nums text-ht-dark placeholder:text-ht-dark/35 transition-colors duration-200 focus:border-ht-gold/60 focus:outline-none focus:ring-2 focus:ring-ht-gold/15",
              unit && "pr-10",
              className
            )}
            {...props}
          />
          {unit && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ht-dark/40">
              {unit}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = "Input";
