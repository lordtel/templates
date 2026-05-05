# Dial-in: 3 attempts reel (30s)

Simulates a barista dialing in a new bag of Drop Coffee across 3 attempts —
sour shot → getting closer → dialed in. Built with the real app's CSS so
the parameters card and bipolar sliders match what users actually see.

- **Canvas:** 1080 × 1920 (Instagram Reels / Stories)
- **Length:** 30 s, loops infinitely
- **Source:** [`dial-in-3-attempts-reel.html`](./dial-in-3-attempts-reel.html)
- **MP4:** [`dial-in-3-attempts-reel.mp4`](./dial-in-3-attempts-reel.mp4) (1.4 MB, H.264, no audio)

## Story arc

| Time      | Scene                                                         |
| --------- | ------------------------------------------------------------- |
| 0–3 s     | Intro: "Dial-in companion · New bag. Let's dial it in."       |
| 3–4 s     | Phone slides up showing the Drop Coffee bag (Ethiopia · Washed) |
| 4–9 s     | Attempt #1 — 18g → 36g, **22s (red)**, grind 4.0; sliders show **Sour** + **Thin** |
| 9–11 s    | Tip overlay: *"Tighten the grind →"*                          |
| 11–17 s   | Attempt #2 — same dose/yield, **31s**, grind 3.4; sliders edge toward balance |
| 17–19 s   | Tip overlay: *"Almost. Just a touch more →"*                  |
| 19–24 s   | Attempt #3 — 18g → 36g, **28s (green)**, grind 3.2; sliders **Balanced** + **Rich** |
| 24–27 s   | "Dialed in" badge appears with the locked recipe stats        |
| 27–30 s   | CTA: brand mark + "Crema · Your espresso, dialed in. · CREMA.LIVE" |

## Recording

From `brew/docs/press-kit/`, with the local server running:

```bash
cd brew && npx serve . -l 3000   # one terminal
cd brew/docs/press-kit
node reels/dial-in-3-attempts/record.mjs
```

The script records 32 s and trims the first 1.6 s (Playwright startup
delay) so the mp4's t=0 lines up with the animation's t=0. Output:
`reels/dial-in-3-attempts/dial-in-3-attempts-reel.mp4`.

`ffmpeg` required on PATH.

## Notes on accuracy

- The parameter card uses the same field types as the real app (dose / yield
  / time / grind in their actual styling).
- Bipolar sliders use the same gradients (`sour-bitter`, `water-syrup`) that
  ship in `features/dial-in/dial-in.css`.
- The locked-in recipe stats card mirrors what the user sees on the real
  bag-detail page after marking a recipe as dialed in.
- Time values are colour-coded: red (too fast), neutral (close), green
  (in range) — a visual cue that doesn't exist in the real app yet but
  reads well at reel pace.
