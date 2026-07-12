import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { PageTransition } from "@/components/layout/PageTransition";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const cinzel = localFont({
  src: [
    {
      path: "../assets/fonts/cinzel/Cinzel-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/cinzel/Cinzel-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-serif",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#1a1a2e",
  width: "device-width",
  initialScale: 1,
};

const siteTitle = "Halman Thompson | Bespoke Metal Configurator";
const siteDescription =
  "Configure your bespoke copper, brass, and zinc splashbacks, worktops, and signage with our interactive 3D visualiser.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: {
    default: siteTitle,
    template: "%s | Halman Thompson",
  },
  description: siteDescription,
  keywords: [
    "bespoke metal splashbacks",
    "copper splashbacks",
    "brass worktops",
    "zinc worktops",
    "aged metal finishes",
    "patina copper",
    "corten steel",
    "bespoke metal fabrication",
    "3D configurator",
    "Halman Thompson",
    "Newcastle upon Tyne",
  ],
  authors: [{ name: "Onesign & Digital" }],
  creator: "Onesign & Digital",
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HT Configurator",
  },
  openGraph: {
    type: "website",
    siteName: "Halman Thompson",
    locale: "en_GB",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
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
    <html lang="en" className={`${inter.variable} ${cinzel.variable}`}>
      <body className="min-h-screen bg-ht-cream text-ht-dark antialiased">
        <SplashScreen />
        <PageTransition>{children}</PageTransition>
        <InstallPrompt />
      </body>
    </html>
  );
}
