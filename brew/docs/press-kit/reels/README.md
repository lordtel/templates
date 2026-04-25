# Crema — Instagram Reel

A 30-second auto-playing looped vertical animation, ready to record + voiceover.

- **Canvas:** 1080 × 1920 (9:16)
- **Length:** 30 s, loops infinitely
- **Source:** [`instagram-reel.html`](./instagram-reel.html)
- **Script + voiceover:** [`instagram-reel-30s.md`](./instagram-reel-30s.md)

## Workflow

```
HTML animation  ─┐
                  ├──▶  CapCut / DaVinci  ──▶  reel.mp4  ──▶  Instagram
voiceover audio ─┘
```

Three steps: record the video, record the voiceover, combine them in an editor.

---

## 1 · Record the HTML to MP4

### Playwright (best — reproducible)

Re-using the same recipe as the Product Hunt demo. From `brew/docs/press-kit/reels/`:

```js
// record.mjs
import { chromium } from "playwright";

const DURATION_MS = 31000;
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
  recordVideo: { dir: "./out", size: { width: 1080, height: 1920 } },
});
const page = await context.newPage();
await page.goto("file://" + process.cwd() + "/instagram-reel.html");
await page.waitForTimeout(1200);
await page.evaluate(() => location.reload());
await page.waitForLoadState("networkidle");
await page.waitForTimeout(DURATION_MS);
await page.close();
await context.close();
await browser.close();
```

```bash
node record.mjs
ffmpeg -i out/*.webm -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart reel-video.mp4
```

### macOS QuickTime (zero tools)

1. Open `instagram-reel.html` in Chrome. Set DevTools device toolbar to **Responsive**, dimensions `1080 × 1920`, scale **100%**.
2. QuickTime → File → New Screen Recording → drag selection over the canvas.
3. Press `R` in the page to restart the loop, immediately hit record, stop at ~31 s.
4. Convert to MP4 with the `ffmpeg` line above.

---

## 2 · Record the voiceover

Pick your tool — pacing matters more than equipment.

| Tool | Best for | Notes |
|------|----------|-------|
| **Voice Memos / GarageBand** (macOS) | Quick, natural | Built-in. Use a phone earbud mic if no proper mic. |
| **Audacity** (free, all OS) | Cleanup + noise reduction | Open-source, lightweight. |
| **Riverside.fm** | Studio-quality remote recording | Browser-based, good auto-cleanup. |
| **ElevenLabs / Murf / Play.ht** | AI-generated voice | If you'd rather not record yourself. Pick a warm, conversational preset. |

Read at a relaxed pace — the script is timed for ~26 s, leaving 4 s of breathing room at the CTA.

---

## 3 · Combine video + voiceover

| Tool | OS | Cost | Why |
|------|----|------|-----|
| **CapCut** | macOS / Windows / iOS / Android | Free | The standard for Reels. Drag in MP4 + voice clip, auto-generate captions, add background music, export 1080×1920. |
| **DaVinci Resolve** | macOS / Windows / Linux | Free | Pro-grade, more controls, steeper learning curve. |
| **iMovie** | macOS / iOS | Free | Simple. No native 9:16 — use vertical project setting. |
| **Adobe Premiere** | macOS / Windows | Paid | If you already have it. |
| **InShot** | iOS / Android | Free / Paid | Mobile-only quick edits. |
| **ffmpeg** | All | Free | Command-line: `ffmpeg -i reel-video.mp4 -i vo.m4a -c:v copy -c:a aac -shortest reel-final.mp4` |

### Recommended (CapCut)

1. **New project** → vertical 9:16.
2. Drop in `reel-video.mp4` on the video track.
3. Drop in your voiceover audio on the audio track.
4. **Auto-captions** → review and tweak.
5. Add a soft lo-fi or jazz track at –18 dB beneath the voiceover.
6. **Export** at 1080×1920, 30 fps, high quality.
7. Upload to Instagram → Reels.

---

## Editing the script or visuals

- **Script copy** lives inline in `instagram-reel.html` inside each `.scene` section.
- **Scene timing** is on the keyframes at the top of the `<style>` block — keep the percentages aligned if you change scene lengths.
- **Screenshots** are pulled from `../screenshots/*.html` — edit those once and every video updates.
