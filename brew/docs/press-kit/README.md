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
    ├── 01-home.svg         device-framed shelf view
    ├── 02-bag-detail.svg   one bag, four drinks
    ├── 03-dial-in.svg      dial-in companion
    ├── 04-analytics.svg    your coffee year (journal)
    └── 05-ocr.svg          snap → auto-fill
```

Also at the site root: `og-image.svg` / `og-image.png` (1200×630 social card).

## Converting SVG → PNG

For anywhere that requires PNG (Twitter profile images, app stores, print):

**Browser (easiest):**
1. Open the SVG in Chrome/Safari.
2. Zoom to 100%, take a screenshot — or right-click → "Save Image As" with the browser's PNG export (varies).

**Headless (exact sizes):**
```bash
# via Playwright
npx playwright screenshot --viewport-size=1080,1080 \
  social/instagram-square.svg instagram-square.png

# via Chrome
google-chrome --headless --screenshot --window-size=1080,1080 \
  social/instagram-square.svg
```

**Inkscape / rsvg:**
```bash
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
