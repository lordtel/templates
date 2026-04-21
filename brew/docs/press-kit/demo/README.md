# Crema — Product Hunt demo

A 30-second auto-playing looped demo sized for Product Hunt's video slot.

- **Canvas:** 1920 × 1080 (16:9)
- **Length:** 30 s, loops infinitely
- **Scenes:** title → shelf → OCR → bag detail → dial-in → journal + CTA
- **Built from:** the same HTML screenshots as the press kit — no separate assets to keep in sync

## How to record it

Product Hunt accepts MP4 up to ~60 s. Record one full loop (30 s) and upload.

### macOS — QuickTime (zero extra tools)

1. Open `index.html` in Chrome. Zoom to 100 %. Resize the window so the viewport is exactly 1920 × 1080 (DevTools → Device toolbar → Responsive → set to `1920 × 1080`, scale to 100 %). The progress bar at the bottom is your stopwatch.
2. QuickTime → File → New Screen Recording.
3. Click once on the page to make sure animations aren't paused (spacebar / click toggles pause).
4. Press `R` to restart the loop, immediately start screen recording, stop at ~31 s.
5. Save as `.mov`, convert to `.mp4`:
   ```bash
   ffmpeg -i crema-demo.mov -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart crema-demo.mp4
   ```

### Headless — Playwright (best quality, reproducible)

```bash
npx playwright install chromium
node record.mjs
```

Put this `record.mjs` next to `index.html`:

```js
import { chromium } from "playwright";

const DURATION_MS = 31000;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: { dir: "./out", size: { width: 1920, height: 1080 } },
});
const page = await context.newPage();
await page.goto("file://" + process.cwd() + "/index.html");
// Wait an extra beat for iframes/fonts, then record one full loop.
await page.waitForTimeout(1200);
await page.evaluate(() => location.reload());
await page.waitForLoadState("networkidle");
await page.waitForTimeout(DURATION_MS);
await page.close();
await context.close();
await browser.close();
console.log("Saved .webm to ./out/");
```

Then convert:
```bash
ffmpeg -i out/*.webm -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart crema-demo.mp4
```

### Chrome headless (one-liner alternative)

```bash
# Note: needs Chrome 119+ for --enable-features=HeadlessSurfaceVideoCapture
google-chrome --headless=new --window-size=1920,1080 \
  --virtual-time-budget=32000 \
  --run-all-compositor-stages-before-draw \
  --dump-dom file://$PWD/index.html
```

Playwright is the reliable path.

## Customizing the copy

Each scene's headline and eyebrow live inline in `index.html` inside the `.scene` sections. Change text freely — animation timings are on the scene containers themselves, so your edits won't desync the 30 s loop.

## Timing reference

| Scene | Content                       | Start | Visible window |
|-------|-------------------------------|-------|----------------|
| 1     | Title card                    | 0 s   | 0 – 5 s        |
| 2     | Your shelf                    | 5 s   | 5 – 10 s       |
| 3     | Snap → auto-fill              | 10 s  | 10 – 15 s      |
| 4     | One bag, four drinks          | 15 s  | 15 – 20 s      |
| 5     | Dial-in companion             | 20 s  | 20 – 25 s      |
| 6     | Journal + CTA `crema.live`    | 25 s  | 25 – 30 s      |

Crossfades are 0.9 s between scenes; progress bar at the bottom of the canvas tracks the loop.
