"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";

interface AdminThemeCtx {
  theme: Theme;
  toggle: () => void;
  /** Shorthand: returns first arg for dark, second for light */
  pick: (dark: string, light: string) => string;
}

const Ctx = createContext<AdminThemeCtx>({
  theme: "dark",
  toggle: () => {},
  pick: (d) => d,
});

export function useAdminTheme() {
  return useContext(Ctx);
}

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ht-admin-theme") as Theme | null;
    if (stored === "light" || stored === "dark") setTheme(stored);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("ht-admin-theme", next);
  };

  const pick = (dark: string, light: string) =>
    theme === "dark" ? dark : light;

  return (
    <Ctx.Provider value={{ theme, toggle, pick }}>
      <div style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.2s" }}>
        {children}
      </div>
    </Ctx.Provider>
  );
}
