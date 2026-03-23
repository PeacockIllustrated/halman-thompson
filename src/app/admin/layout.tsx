"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AdminThemeProvider, useAdminTheme } from "./theme";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { href: "/admin/quotes", label: "Quotes", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { href: "/admin/pricing", label: "Pricing", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/admin/products", label: "Products", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { href: "/admin/finishes", label: "Finishes", icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/** HT logo icon — uses currentColor so it inherits from parent text-color class */
function HtLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 178.85 218.83" fill="currentColor" aria-label="Halman Thompson">
      <path d="M154.92,182.91c1.72,10.01,12.46,6.49,18.73,8.87-1.52,2.59-4.63,2.05-7.36,1.97-14.2-.43-27.75-.84-41.93.17-.72.05-1.8-.36-2.33-.42-.57-.07-.9-1.42-.31-1.95,2.07-1.9,10.87,1.93,12.7-8.97,1.55-8.51,1.36-17.06,1.7-25.89l-.09-45.83-90.13-.07c-.04,23.02-.61,45.27.89,67.92.32,4.8,1.92,9.84,6.67,11.02,4.09,2.2,9.08-.94,12.99,3.29-10.23,1.75-19.47.04-29.15.14-4.3.05-21.74,1.38-22.93-.17-2.69-3.49,8.72-.23,11.16-6.01,2.27-5.37,2.81-11.18,2.81-17.38l-.08-118.53c0-13.65-17.83-8.53-18.01-12.73,9.16-1.53,17.36.14,26.06-.07l22.01-.54c.89-.02,1.56.32,1.89.73,3.5,4.28-13.17-2.2-13.86,12.35-.83,17.41-.58,34.24-.46,52.33,20.9.91,35.29-.9,55.41-.04,11.74.5,22.97.24,34.8-.05l-.46-51.28c-.14-15.03-16.91-8.8-18.14-13.4,9.41-1.65,17.86.12,26.79-.11l21.03-.56c.74-.02,1.57.3,2.11.48.49.17.53,1.07.22,1.5-1.31,1.8-7.11.03-10.6,3.28-1.85,1.72-3.45,5.01-3.46,8.45l-.23,112.18c-.01,6.82.46,12.94,1.56,19.34Z"/>
      <path opacity="0.7" d="M102.24,14.27l-.16,86.07-25.23.04-.16-86.05-42.74.74c-6.46.11-12.77,1.35-18.62,3.51-7.41,2.57-8.4,9.58-10.55,16.58l-.85,2.77c-.18.6-1.27.96-2,.54-.63-.37-1.19-1.71-1.21-2.92L0,0c10.11,1.92,19.13,3.01,29.42,3l123.76-.06c8.99,0,16.79-1.45,25.67-2.92l-.74,36.55c-.03,1.25-1.67,2.32-2.34,2.06-3.97-1.54,2.6-14.68-12.55-20.14-5.76-2.14-12.02-3.31-18.36-3.43l-42.62-.8Z"/>
      <path opacity="0.7" d="M127.68,218.83l-37.39-.44-38.96.43c-1.37.02-2.14-1.03-2.19-1.68-.07-.91.79-1.65,2.04-1.77l12.55-1.15c5.9-.54,9.72-4.73,10.78-10.57,1.86-10.23,1.99-20.37,2.04-30.99l.24-58.92,25.29-.08.2,58.98c.04,10.58.24,20.71,2.04,30.96,1.02,5.77,4.76,10.02,10.53,10.58l12.58,1.21c.97.09,1.67.29,2.04.82.52.75.1,2.65-1.8,2.63Z"/>
    </svg>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle, pick } = useAdminTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const sidebarClasses = `flex flex-col border-r backdrop-blur-md transition-colors duration-300 ${pick(
    "border-white/[0.06] bg-ht-dark/95",
    "border-stone-200 bg-white"
  )}`;

  const borderClass = pick("border-white/[0.06]", "border-stone-200");

  function NavLinks({ onNav }: { onNav?: () => void }) {
    return (
      <>
        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNav}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? pick("bg-ht-gold/15 text-ht-gold", "bg-ht-gold/10 text-ht-dark")
                    : pick("text-white/50 hover:bg-white/[0.04] hover:text-white/80", "text-stone-500 hover:bg-stone-100 hover:text-stone-800")
                }`}
              >
                <NavIcon d={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={`border-t p-2 ${borderClass}`}>
          <button
            onClick={() => { handleLogout(); onNav?.(); }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${pick(
              "text-white/40 hover:bg-red-500/10 hover:text-red-400",
              "text-stone-400 hover:bg-red-50 hover:text-red-500"
            )}`}
          >
            <NavIcon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            Logout
          </button>
          <Link
            href="/"
            onClick={onNav}
            className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${pick(
              "text-white/40 hover:bg-white/[0.04] hover:text-white/60",
              "text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            )}`}
          >
            <NavIcon d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            View Site
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${pick("bg-ht-dark", "bg-stone-50")}`}>

      {/* ── Mobile top bar ── */}
      <header
        className={`fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b px-4 backdrop-blur-md lg:hidden ${pick(
          "border-white/[0.06] bg-ht-dark/95",
          "border-stone-200 bg-white/95"
        )}`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${pick(
              "text-white/60 hover:bg-white/[0.08]",
              "text-stone-600 hover:bg-stone-100"
            )}`}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
          <span className={pick("text-ht-gold", "text-ht-dark")}>
            <HtLogo size={24} />
          </span>
          <span className={`text-sm ${pick("text-white/50", "text-stone-400")}`}>Admin</span>
        </div>

        <button
          onClick={toggle}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${pick(
            "bg-white/[0.06] text-white/40",
            "bg-stone-100 text-stone-500"
          )}`}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>
      </header>

      {/* ── Mobile slide-out menu + backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-out lg:hidden ${sidebarClasses} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className={`flex h-14 items-center gap-2 border-b px-4 ${borderClass}`}>
          <span className={pick("text-ht-gold", "text-ht-dark")}>
            <HtLogo size={24} />
          </span>
          <span className={`text-sm ${pick("text-white/50", "text-stone-400")}`}>Admin</span>
        </div>
        <NavLinks onNav={() => setMobileOpen(false)} />
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-30 hidden w-60 lg:flex ${sidebarClasses}`}>
        <div className={`flex h-14 items-center justify-between border-b px-4 ${borderClass}`}>
          <div className="flex items-center gap-2">
            <span className={pick("text-ht-gold", "text-ht-dark")}>
              <HtLogo size={24} />
            </span>
            <span className={`text-sm ${pick("text-white/50", "text-stone-400")}`}>Admin</span>
          </div>
          <button
            onClick={toggle}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-all duration-200 ${pick(
              "bg-white/[0.06] hover:bg-white/[0.12] text-white/40",
              "bg-stone-100 hover:bg-stone-200 text-stone-500"
            )}`}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
        </div>
        <NavLinks />
      </aside>

      {/* ── Main content ── */}
      <main className="w-full pt-14 lg:ml-60 lg:pt-0">
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <AdminShell>{children}</AdminShell>
    </AdminThemeProvider>
  );
}
