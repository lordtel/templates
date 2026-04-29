# Crema — Taste profile reel (30s)

A 30-second auto-playing looped vertical animation that showcases the taste profile spider chart feature.

- **Canvas:** 1080 × 1920 (9:16, Instagram Reels / Stories)
- **Length:** 30 s, loops infinitely
- **Source:** [`taste-profile-reel.html`](./taste-profile-reel.html)

## Story arc

| Time      | Scene                                                                |
| --------- | -------------------------------------------------------------------- |
| 0–2 s     | Eyebrow `TASTE PROFILE` + title "Your espresso has a *shape*."       |
| 2–6 s     | Hexagon ring outlines draw in                                        |
| 6–11 s    | Six spokes radiate out from the center, one by one                   |
| 11–14 s   | Axis labels fade in clockwise: BRIGHT, DOSE, LONG PULL, BOLD, RICH, STRENGTH |
| 14–17 s   | Six data dots pop in with a bounce, one per axis                     |
| 17–22 s   | The polygon shape fills in, scaling up from the center               |
| 17–25 s   | Title swap: "Six axes, drawn from *your* data."                      |
| 22–26 s   | Caption: "Drawn from your dial-in logs. Sharper as you log more attempts." |
| 26–30 s   | CTA: brand mark + "Crema" + "Your espresso, dialed in." + CREMA.LIVE |

## Recording the reel

The recorded mp4 is committed at [`taste-profile-reel.mp4`](./taste-profile-reel.mp4) — 1080×1920, H.264, 30 s, ~1.4 MB. Drop it straight into Instagram Reels or layer audio on top first in CapCut.

To regenerate (after editing the HTML), from `brew/docs/press-kit/` with the local server running:

```bash
# Start the server
cd brew && npx serve . -l 3000

# In another terminal, record + convert in one step
cd brew/docs/press-kit
node reels/taste-profile/record.mjs
```

The script records the page with Playwright and pipes the result through ffmpeg to produce the mp4. It needs `ffmpeg` on `PATH`; without it, you'll get a webm fallback alongside a manual conversion command.

## Editing the visuals

- **Spider chart geometry**: `<polygon class="ring …">` and `<line class="spoke …">` elements. Coordinates are computed for `cx=450, cy=450, R=320` in a 900×900 SVG.
- **Data shape values**: the `<polygon>` inside `.data-shape` and the matching `<circle>` data dots — both use the same six vertices. To change the example shape, edit those points in lockstep.
- **Animation timing**: each `@keyframes` block in the `<style>` corresponds to a beat (rings, spokes, labels, dots, shape, captions, CTA). Percentages are out of 30 seconds — `1% = 0.3s`.

## Audio / final edit

- No audio in the HTML. Add a voiceover or a low-key lo-fi track in CapCut / DaVinci.
- Suggested voiceover beats:
  - 0–4 s: "Five-star ratings don't tell you much."
  - 5–14 s: "But every dial-in you log builds a real taste profile — six axes mapping how your espresso actually behaves."
  - 14–22 s: "The more you log, the sharper the shape gets."
  - 22–30 s: "Your espresso, dialed in. Crema dot live."

See the parent [`reels/README.md`](../README.md) for editor recommendations (CapCut, DaVinci) and ffmpeg recipes.
