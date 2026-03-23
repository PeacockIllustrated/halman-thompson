"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as standalone
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as unknown as { standalone: boolean }).standalone);

    setIsStandalone(!!standalone);

    if (standalone) return;

    // Check if dismissed recently (within 7 days)
    const dismissed = localStorage.getItem("ht-install-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Detect iOS (no beforeinstallprompt support)
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show iOS-specific prompt after a delay
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Listen for the beforeinstallprompt event (Chrome, Edge, Samsung Internet)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a brief delay so user has oriented
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem("ht-install-dismissed", Date.now().toString());
  }, []);

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-500">
      <div className="mx-auto max-w-lg p-4">
        <div className="rounded-2xl border border-[#b8860b]/20 bg-[#1a1a2e] p-5 shadow-2xl shadow-black/40">
          <div className="flex items-start gap-4">
            {/* Mini HT logo */}
            <div className="flex-shrink-0 rounded-xl bg-[#1a1a2e] ring-1 ring-[#b8860b]/30 p-2">
              <svg
                viewBox="0 0 178.85 218.83"
                className="h-10 w-8"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#b8860b"
                  d="M102.24,14.27l-.16,86.07-25.23.04-.16-86.05-42.74.74c-6.46.11-12.77,1.35-18.62,3.51-7.41,2.57-8.4,9.58-10.55,16.58l-.85,2.77c-.18.6-1.27.96-2,.54-.63-.37-1.19-1.71-1.21-2.92L0,0c10.11,1.92,19.13,3.01,29.42,3l123.76-.06c8.99,0,16.79-1.45,25.67-2.92l-.74,36.55c-.03,1.25-1.67,2.32-2.34,2.06-3.97-1.54,2.6-14.68-12.55-20.14-5.76-2.14-12.02-3.31-18.36-3.43l-42.62-.8Z"
                />
                <path
                  fill="#b8860b"
                  d="M127.68,218.83l-37.39-.44-38.96.43c-1.37.02-2.14-1.03-2.19-1.68-.07-.91.79-1.65,2.04-1.77l12.55-1.15c5.9-.54,9.72-4.73,10.78-10.57,1.86-10.23,1.99-20.37,2.04-30.99l.24-58.92,25.29-.08.2,58.98c.04,10.58.24,20.71,2.04,30.96,1.02,5.77,4.76,10.02,10.53,10.58l12.58,1.21c.97.09,1.67.29,2.04.82.52.75.1,2.65-1.8,2.63Z"
                />
                <path
                  fill="#faf7f2"
                  d="M154.92,182.91c1.72,10.01,12.46,6.49,18.73,8.87-1.52,2.59-4.63,2.05-7.36,1.97-14.2-.43-27.75-.84-41.93.17-.72.05-1.8-.36-2.33-.42-.57-.07-.9-1.42-.31-1.95,2.07-1.9,10.87,1.93,12.7-8.97,1.55-8.51,1.36-17.06,1.7-25.89l-.09-45.83-90.13-.07c-.04,23.02-.61,45.27.89,67.92.32,4.8,1.92,9.84,6.67,11.02,4.09,2.2,9.08-.94,12.99,3.29-10.23,1.75-19.47.04-29.15.14-4.3.05-21.74,1.38-22.93-.17-2.69-3.49,8.72-.23,11.16-6.01,2.27-5.37,2.81-11.18,2.81-17.38l-.08-118.53c0-13.65-17.83-8.53-18.01-12.73,9.16-1.53,17.36.14,26.06-.07l22.01-.54c.89-.02,1.56.32,1.89.73,3.5,4.28-13.17-2.2-13.86,12.35-.83,17.41-.58,34.24-.46,52.33,20.9.91,35.29-.9,55.41-.04,11.74.5,22.97.24,34.8-.05l-.46-51.28c-.14-15.03-16.91-8.8-18.14-13.4,9.41-1.65,17.86.12,26.79-.11l21.03-.56c.74-.02,1.57.3,2.11.48.49.17.53,1.07.22,1.5-1.31,1.8-7.11.03-10.6,3.28-1.85,1.72-3.45,5.01-3.46,8.45l-.23,112.18c-.01,6.82.46,12.94,1.56,19.34Z"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-[#faf7f2] font-[family-name:var(--font-serif)]">
                Add to Home Screen
              </h3>

              {isIOS ? (
                <p className="mt-1 text-xs text-[#faf7f2]/60 leading-relaxed">
                  Tap{" "}
                  <span className="inline-flex items-center">
                    <svg
                      className="mx-0.5 h-3.5 w-3.5 text-[#b8860b]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  </span>{" "}
                  then &ldquo;Add to Home Screen&rdquo; to install the
                  configurator as an app.
                </p>
              ) : (
                <p className="mt-1 text-xs text-[#faf7f2]/60 leading-relaxed">
                  Install the configurator for quick access and a full-screen
                  experience.
                </p>
              )}
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 rounded-lg p-1.5 text-[#faf7f2]/40 transition-colors hover:bg-[#faf7f2]/10 hover:text-[#faf7f2]/70"
              aria-label="Dismiss"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {!isIOS && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 rounded-lg border border-[#faf7f2]/10 px-4 py-2.5 text-xs font-medium text-[#faf7f2]/60 transition-colors hover:bg-[#faf7f2]/5 hover:text-[#faf7f2]/80"
              >
                Not now
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 rounded-lg bg-[#b8860b] px-4 py-2.5 text-xs font-semibold text-[#1a1a2e] transition-colors hover:bg-[#b8860b]/90"
              >
                Install App
              </button>
            </div>
          )}

          {isIOS && (
            <button
              onClick={handleDismiss}
              className="mt-3 w-full rounded-lg border border-[#faf7f2]/10 px-4 py-2 text-xs font-medium text-[#faf7f2]/50 transition-colors hover:bg-[#faf7f2]/5"
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
