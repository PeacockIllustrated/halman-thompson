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
