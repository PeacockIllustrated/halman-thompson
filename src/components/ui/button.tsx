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
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ht-gold/50 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-ht-gold text-ht-dark hover:bg-ht-gold/90": variant === "primary",
            "bg-ht-dark text-white hover:bg-ht-dark/90": variant === "secondary",
            "border border-ht-gold/30 text-ht-dark hover:bg-ht-gold/10": variant === "outline",
            "text-ht-dark hover:bg-ht-dark/5": variant === "ghost",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
