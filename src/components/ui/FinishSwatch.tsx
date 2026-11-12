import { cn } from "@/lib/utils/cn";
import type { Finish, MetalType } from "@/types";

/**
 * Metal-specific gradients used until a finish has a photographed swatch.
 * Layered: a soft specular sweep, a brushed grain, and the base tone.
 */
const METAL_GRADIENTS: Record<MetalType, { base: string; aged: string }> = {
  copper: {
    base: "linear-gradient(135deg,#7a3f1d 0%,#c87a48 38%,#e9a676 50%,#b4693e 64%,#6e3618 100%)",
    aged: "linear-gradient(135deg,#4a2717 0%,#8a4a2a 35%,#b07050 50%,#7a3f22 66%,#3d2014 100%)",
  },
  brass: {
    base: "linear-gradient(135deg,#7a5a22 0%,#c9a050 38%,#efd497 50%,#c49a4a 64%,#6f5020 100%)",
    aged: "linear-gradient(135deg,#4a3818 0%,#8a6a34 35%,#b8955a 50%,#7d5f2c 66%,#3e2f14 100%)",
  },
  zinc: {
    base: "linear-gradient(135deg,#5d6264 0%,#a3a8aa 38%,#d3d6d7 50%,#9a9fa1 64%,#55595b 100%)",
    aged: "linear-gradient(135deg,#3f4446 0%,#7b8183 35%,#a3a7a6 50%,#6f7476 66%,#363a3b 100%)",
  },
  steel: {
    base: "linear-gradient(135deg,#141414 0%,#3a3a3a 38%,#5e5e5e 50%,#353535 64%,#121212 100%)",
    aged: "linear-gradient(135deg,#0e0e0e 0%,#2a2826 38%,#4a4642 50%,#2a2826 64%,#0c0c0c 100%)",
  },
  corten: {
    base: "linear-gradient(135deg,#4a1e0c 0%,#8b3f1a 38%,#b0602f 50%,#7d3816 64%,#3d180a 100%)",
    aged: "linear-gradient(135deg,#3a170a 0%,#7a3415 38%,#a2562a 50%,#6d2f12 64%,#30130a 100%)",
  },
};

const BRUSHED =
  "repeating-linear-gradient(90deg,rgba(255,255,255,0.05) 0 1px,transparent 1px 3px)";

export function hasPhotoSwatch(finish: Finish) {
  return !finish.swatchImageUrl.includes("placeholder");
}

interface FinishSwatchProps {
  finish: Finish;
  className?: string;
  /** Show the photographed texture at a larger, cropped scale */
  rounded?: "full" | "lg" | "none";
}

export function FinishSwatch({ finish, className, rounded = "full" }: FinishSwatchProps) {
  const radius =
    rounded === "full" ? "rounded-full" : rounded === "lg" ? "rounded-xl" : "";

  if (hasPhotoSwatch(finish)) {
    return (
      <span className={cn("relative block overflow-hidden", radius, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={finish.swatchImageUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_45%,rgba(0,0,0,0.25))]" />
      </span>
    );
  }

  const g = METAL_GRADIENTS[finish.baseMetal];
  return (
    <span
      className={cn("relative block overflow-hidden", radius, className)}
      style={{ backgroundImage: `${BRUSHED}, ${finish.isAged ? g.aged : g.base}` }}
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.25),transparent_55%)]" />
    </span>
  );
}
