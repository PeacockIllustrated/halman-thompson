---
name: Halman Thompson rebuild
version: 1
colors:
  brandHue: 185            # verdigris
  neutralHue: 160          # stone, tinted 25deg off the brand hue
  paper:   "oklch(0.962 0.006 160)"
  paper2:  "oklch(0.928 0.008 160)"
  line:    "oklch(0.858 0.010 160)"
  ink3:    "oklch(0.540 0.012 160)"
  ink2:    "oklch(0.380 0.013 162)"
  ink:     "oklch(0.215 0.013 165)"
  steel:   "oklch(0.195 0.012 168)"   # blackened-steel bands
  steel2:  "oklch(0.255 0.013 168)"
  onSteel: "oklch(0.930 0.007 160)"
  verdigris:      "oklch(0.470 0.075 185)"  # links, tags, CTA on paper
  verdigrisLight: "oklch(0.780 0.085 182)"  # CTA and tags on steel; under 5% of area
  dark: { paper: "oklch(0.175 0.011 168)", paper2: "oklch(0.215 0.012 168)", line: "oklch(0.320 0.012 165)", ink: "oklch(0.930 0.007 160)", ink2: "oklch(0.800 0.009 160)", ink3: "oklch(0.640 0.010 160)", steel: "oklch(0.130 0.010 168)", verdigris: "oklch(0.780 0.085 182)" }
typography:
  display: { family: "Libre Caslon Display", source: "Google Fonts (Impallari Type)", licence: "OFL" }
  italic:  { family: "Libre Caslon Text italic", source: "Google Fonts", licence: "OFL", use: "finish descriptors only" }
  text:    { family: "Schibsted Grotesk", source: "Google Fonts (Schibsted)", licence: "OFL" }
  mono:    { family: "IBM Plex Mono", source: "Google Fonts (IBM)", licence: "OFL", use: "element tags, dimensions, prices, lead times" }
  scale: [12, 14, 17, 21, 30, 48, 84, 132]
  tracking: { "132": "-0.035em", "84": "-0.03em", "48": "-0.02em", "30": "-0.01em", "17": "0", "12 mono": "0.08em" }
  leading: { display: 0.92, heading: 1.08, body: 1.6, caption: 1.4 }
  measure: "62ch"
layout:
  columns: 7
  container: "90rem, text contained, images may bleed to the right edge only"
  spans: ["rail 2 + body 5", "swatch wall 7 (6 squares per row)", "asymmetric pair 4 + 3", "index rows, full 7"]
  aspectRatios: ["1/1 (swatches)", "4/5 (applications, products)", "3/2 (projects, heroes)"]
  spacingUnit: 8
rounded: { image: 0, tag: "2px", control: "2px" }
motion:
  settle: "cubic-bezier(0.16, 0.84, 0.24, 1)"
  swap:   "cubic-bezier(0.7, 0, 0.3, 1)"
  linear: "linear"
  durations: [140, 320, 900]
  decorativeMoments: 1   # the hero patina wipe on the home page
signature: "Element tags. Every finish and product carries a stamped mono tag with its metal's chemical symbol (Cu copper, CuZn brass, Zn zinc, Fe steel) and its number in the range, e.g. [Cu 07]."
banned: ["Playfair Display", "Plus Jakarta Sans", "Kinfolk", "bronze/beige #AB9579 as brand colour", "all-caps display headlines", "centred hero over full-bleed photo", "carousels with arrow buttons", "rounded pill filter buttons", "cookie-banner-first layout", "three-up card grid as section two"]
---

# Overview

**For** homeowners renovating a kitchen or bathroom, and the interior designers working for them, who want a hand-aged metal surface and need to see the real finish before committing to a made-to-measure piece.

**One job:** get them to order a sample. Everything else (the shop, bespoke quotes, the journal) hangs off that.

**Material world:** 0.9mm and 1.5mm sheet, 150 x 150mm sample squares, patina, verdigris, wax and lacquer, burnishing, gloss or matte, cut to the millimetre, 5 to 8 week lead times, finishes named after English counties.

The scraped 2026 site is the reference this must stay recognisably related to (aged metal photography, a serif and sans pairing, a quiet luxury register) while being perceptibly different in every structural layer: palette, type, grid, navigation and components.

# Colours

The old site is warm beige and bronze. This one is cool: stone neutrals and blackened-steel bands, with verdigris as the only brand colour, because verdigris is what Halman Thompson's signature Northumberland finish is known for. The photography carries all the copper and brass warmth, so the UI does not compete with it. Verdigris appears on links, tags and the sample CTA only.

# Typography

Libre Caslon Display is an English old-style face, a deliberate step away from the old site's didone (Kinfolk, Playfair). It is set in mixed case and large, never in capitals. Schibsted Grotesk is a sturdy newspaper grotesk for text. IBM Plex Mono is the utility voice for everything measurable: sizes, thicknesses, prices, lead times and the element tags.

# Layout

Seven columns. Columns 1 and 2 are the rail, which holds section labels and element tags; columns 3 to 7 hold the body. Images may bleed off the right edge, never the left, so the rail is always a hard axis. There are four span patterns: rail + body, the swatch wall, an asymmetric 4 + 3 pair, and full-width index rows.

# Elevation and depth

None. No shadows anywhere. Separation comes from hairlines (`line`) and from the steel bands.

# Shapes

Sheet metal is guillotine-cut, so images have square corners. Tags and controls get a 2px radius, like a stamped plate.

# Motion

One decorative moment: on the home page the hero image wipes in from bare to aged across 900ms. Everything else is feedback: 140ms colour shifts on hover, and 320ms image scale on swatches. All motion is disabled under prefers-reduced-motion.

# Components

Element tag, swatch tile, index row, spec list (mono key/value), steel band CTA, project pair, product tile, journal row.

# Do and do not

Do keep every fact sourced from the scraped site. Do not invent prices, lead times, locations or awards. Unconfirmed lines are marked in COPY-NOTES.md.

# Voice chart

| Row | Rule |
|---|---|
| Concepts | made by hand; see it before you commit; made to your size |
| Vocabulary | In: finish, sheet, patina, verdigris, cut, lacquer, sample, made to measure. Out: elevate, curated, luxurious, solution, journey, stunning |
| Verbosity | Sentences 5 to 22 words. Paragraphs of 3 sentences at most |
| Grammar | Second person, present tense, contractions on, imperative CTAs |
| Punctuation | No exclamation marks. Em dashes rare |
| Capitalisation | Sentence case everywhere, buttons included |

Dials: matter-of-fact with quiet pride. Never salesy, never jokey about the craft.
