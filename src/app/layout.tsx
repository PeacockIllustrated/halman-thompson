import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
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

export const metadata: Metadata = {
  title: "Halman Thompson | Bespoke Metal Configurator",
  description:
    "Configure your bespoke copper, brass, and zinc splashbacks, worktops, and signage with our interactive 3D visualiser.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable}`}>
      <body className="min-h-screen bg-ht-cream text-ht-dark antialiased">
        {children}
      </body>
    </html>
  );
}
