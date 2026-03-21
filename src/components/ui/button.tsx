"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ht-gold/50 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40",
          {
            "bg-ht-gold text-white shadow-sm hover:bg-ht-gold/90 hover:shadow-md active:scale-[0.98]": variant === "primary",
            "bg-ht-dark text-white shadow-sm hover:bg-ht-dark/90 hover:shadow-md active:scale-[0.98]": variant === "secondary",
            "border border-ht-dark/[0.08] text-ht-dark hover:bg-ht-dark/[0.04] active:scale-[0.98]": variant === "outline",
            "text-ht-dark hover:bg-ht-dark/[0.04]": variant === "ghost",
          },
          {
            "h-8 px-3.5 text-sm": size === "sm",
            "h-10 px-5 text-sm": size === "md",
            "h-12 px-6 text-[15px] font-semibold tracking-wide": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
