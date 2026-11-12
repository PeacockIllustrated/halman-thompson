import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { PageTransition } from "@/components/layout/PageTransition";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import "./globals.css";

// Same pairing as halmanthompson.com
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#1d1a16",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Halman Thompson | Bespoke Metal Configurator",
  description:
    "Configure your bespoke copper, brass, and zinc splashbacks, worktops, and signage with our interactive 3D visualiser.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HT Configurator",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-ht-cream text-ht-dark antialiased">
        <SplashScreen />
        <PageTransition>{children}</PageTransition>
        <InstallPrompt />
      </body>
    </html>
  );
}
