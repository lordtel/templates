# Crema — press kit

Browsable index: open `index.html` in your browser.

## Contents

```
press-kit/
├── index.html          # visual index of everything here
├── copy.md             # all text: taglines, pitches, features, FAQ
├── logos/
│   ├── wordmark.svg        # horizontal, full color
│   ├── wordmark-mono.svg   # single color
│   ├── stacked.svg         # bean + wordmark vertical
│   ├── icon-512.svg        # square app icon
│   └── icon-mono.svg       # mono icon for dark backgrounds
├── social/
│   ├── twitter-header.svg      1500×500
│   ├── linkedin-banner.svg     1584×396
│   ├── instagram-square.svg    1080×1080
│   └── instagram-story.svg     1080×1920
└── screenshots/
    ├── _frame.css             iPhone chrome shared by all HTML screenshots
    ├── 01-home.html           device-framed shelf view
    ├── 02-bag-detail.html     one bag, four drinks
    ├── 03-dial-in.html        dial-in companion
    ├── 04-analytics.html      your coffee year (journal)
    ├── 05-ocr.html            snap → auto-fill
    ├── 01-home.svg            older SVG mockups (kept as fallback)
    ├── 02-bag-detail.svg
    ├── 03-dial-in.svg
    ├── 04-analytics.svg
    └── 05-ocr.svg
```

Also at the site root: `og-image.svg` / `og-image.png` (1200×630 social card).

## Screenshots

The `.html` files render each screen using the **real app's CSS** (`app.css`
+ the relevant `features/*/*.css`) wrapped in an iPhone-style chrome — so
what you see is pixel-identical to the running app, not an approximation.
Each file is a 1080 × 1920 poster: tagline at top, phone mockup in the
middle, `crema.live` URL at bottom. Drop the PNG into a social post as-is.

**Browser:** open the file in Chrome at 100 % zoom and take a full-page
screenshot (DevTools → Cmd-Shift-P → "Capture full size screenshot").

**Headless (exact 1080 × 1920 PNG):**
```bash
# via Playwright (recommended — handles web fonts reliably)
npx playwright screenshot --viewport-size=1080,1920 --wait-for-timeout=800 \
  screenshots/01-home.html 01-home.png

# via Chrome
google-chrome --headless --hide-scrollbars --window-size=1080,1920 \
  --screenshot=$(pwd)/01-home.png \
  file://$(pwd)/screenshots/01-home.html
```

The older static `.svg` files remain in the folder as a fallback.

## Converting SVG → PNG (logos, social cards)

For the logo / social SVGs that still need a PNG:

```bash
# via Playwright
npx playwright screenshot --viewport-size=1080,1080 \
  social/instagram-square.svg instagram-square.png

# via rsvg / Inkscape
rsvg-convert -w 1080 -h 1080 social/instagram-square.svg > instagram-square.png
inkscape social/instagram-square.svg --export-type=png --export-width=1080
```

## Launch copy

See `copy.md` for tagline options, 30/60/100-word pitches, feature bullets, FAQ, and contact info.

For Reddit-specific drafts, see `../reddit-launch.md`.
For a standalone one-pager to attach in posts, see `../one-pager/index.html`.
For a 6-slide carousel (Reddit 4:5), see `../carousel/index.html`.

## Contact

nour@crema.live
