# Carousel export

Six 1080×1350 slides, Reddit's 4:5 gallery sweet spot.

## To export as PNGs

**Chrome or Edge (easiest):**
1. Open `index.html` in the browser.
2. Open DevTools (⌘⌥I / Ctrl+Shift+I).
3. In the Elements panel, right-click each `<div class="stage …">` node →
   **Capture node screenshot**. Save.

**Firefox:**
1. Open `index.html`.
2. Right-click a slide → **Take Screenshot**.
3. Choose "Save visible" or drag-select the slide frame.

**Headless (optional, if you have puppeteer / playwright installed):**
```bash
# rough sketch
npx playwright screenshot --viewport-size=1080,1350 \
  --selector=".s1" index.html slide-1.png
# repeat for .s2 .. .s6
```

## Order

1. `slide-1.png` — cover
2. `slide-2.png` — snap → auto-fill
3. `slide-3.png` — rate each brew
4. `slide-4.png` — the dial (sweet spot)
5. `slide-5.png` — journal
6. `slide-6.png` — crema.live CTA

Reddit gallery uploads: drag all six in, keep the same order.
