import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
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
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-ht-cream text-ht-dark antialiased">
        {children}
      </body>
    </html>
  );
}
