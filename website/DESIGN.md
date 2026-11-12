# Halman Thompson rebuild: design direction (v2)

v1 used its own palette (verdigris on stone) and its own typefaces. Tom rejected it because it didn't feel like Halman Thompson. v2 keeps HT's brand exactly and makes the difference in layout and composition.

## Brand (taken from halmanthompson.com, not reinterpreted)
- **Logo:** `brand/halman-logo.svg` (monogram, wordmark and "Bespoke metal creations"). `brand/halman-logo-light.svg` is the same file with the charcoal swapped for cream, used on dark grounds. `brand/ht-icon*.svg` is the monogram on its own.
- **Colour:** bronze `#AB9579` (the top bar, buttons and labels; label text uses a deeper `#8A7356` so it passes contrast on cream), charcoal `#2C2A28` / `#232121`, cream `#F9F8F6`, warm `#F2EEE8`, sand `#ECE5DE`.
- **Type:**
  - Kinfolk, in wide caps, for the hero and page-banner titles. This is HT's own webfont file, so the licence needs confirming before launch.
  - Playfair Display for headings.
  - Plus Jakarta Sans for body text, with tracked uppercase for labels, navigation and buttons.
- **Buttons:** square corners. Primary is solid bronze; secondary is outlined.

## Where it differs from their site
- **Home hero:** a full-bleed photograph with the headline set low on the left, the actions to the right, and a strip of four facts underneath instead of a Trustpilot bar.
- **Products:** an image mosaic (one large tile and five smaller ones) instead of a carousel.
- **Finishes:** every finish appears on one swatch wall grouped by metal, instead of a filtered carousel.
- **Samples and the bespoke quote:** split image-and-text sections.
- **Hub pages:** photographic banners. These are Finishes, Samples, Products, Shop, Our work, Journal, About, Bespoke and Contact.

## Review
Every change is checked in Chromium over HTTP at 1440×900 and 390×844, screen by screen as a visitor would scroll. The script is `source/folds.js` and the server is `source/serve.py`.

## Round 3: bespoke layouts, motion and the worktop builder

- **No empty left rail.** Headings sit above their content on every page. Long text runs in a centred 720px column, and image sections alternate as split rows.
- **Templates vary by content.** Articles mix split rows, wide figures, offset image pairs and numbered chapter grids, chosen from what each section holds. Text-only runs are broken up with photos of HT's own projects.
- **Motion.** Sections fade and rise in, images wipe open, heroes have parallax, and journal posts show a reading bar. All of it switches off under `prefers-reduced-motion`.
- **Legibility.** Kinfolk caps on photos get a 0.7px stroke, a soft shadow and darker overlays.
- **Our work.** A moving reel, metal filter chips (with View Transitions where supported), an alternating 7/5/4-column editorial grid, and a second photo that wipes in on hover.
- **Samples.** Equal-height cards. The price and Add button sit on the same baseline in every card, with a gloss/matte toggle.
- **Worktop builder** (`source/worktop.js`, on /bespoke):
  - Built on three.js 0.170, self-hosted in `site/vendor/`. It loads only when the builder scrolls into view and renders on demand.
  - Shapes: straight, L-shape or island. Options: sink and hob cut-outs, an upstand, and gloss or matte lacquer.
  - Each finish's surface maps are derived from its photographed swatch.
  - Runs over 2,000mm show panel joints and a note.
  - "Send this spec" fills the quote form. It does not show a price.

## Round 4: product copy as components, splash

- The generator now turns common copy patterns on the ~60 product pages into components (`v5.py`):
  - **Finish lists** ("X finish – description") become swatch cards that link to each finish.
  - **Process copy** ("works like this:" followed by short steps) becomes numbered steps on charcoal, each with an icon.
  - **Short sub-headed paragraphs** become icon feature cards.
  - **Benefit lists** become icon lists.
- **"Ready to go"** is now a split photo card on charcoal with four feature chips and quote/sample buttons.
- **Splash.** On the first page load of a visit, the HT monogram draws itself (bronze crown, then the charcoal H stroked and filled, then the stem rising), and the wordmark fades in.
  - It lifts away after about 2.5s, and a click skips it.
  - It is skipped for reduced-motion visitors and for later pages in the same visit (sessionStorage).
