import type { Metadata } from "next";
import { RenderStudio } from "@/components/render/RenderStudio";

// Internal tool: stages worktop models for marketing stills.
// Capture with `node scripts/render-worktops.mjs` while the app is running.
export const metadata: Metadata = {
  title: "Render studio | Halman Thompson",
  robots: { index: false, follow: false },
};

export default function RenderPage() {
  return <RenderStudio />;
}
