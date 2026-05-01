# Dial-in feature carousel — 6 slides

Educational Instagram carousel that walks through the dial-in companion in 6 swipes. Reddit-friendly too (4:5 fits the gallery sweet spot).

- **Canvas:** 1080 × 1350 each (Instagram 4:5 portrait)
- **Source:** [`index.html`](./index.html) — all six slides in one file
- **Output:** [`png/slide-1.png`](./png/) … `png/slide-6.png`

## Story arc

| # | Title                                       | Beat                                              |
| - | ------------------------------------------- | ------------------------------------------------- |
| 1 | "Stop re-dialing the same bag twice."       | Hook + cover + swipe affordance                   |
| 2 | "Sour shot? Pulled fast? Tasted off?"       | Surface the pain                                  |
| 3 | "Log every attempt."                        | Show the parameters card (dose / yield / time / grind) |
| 4 | "Then rate the taste."                      | Show the bipolar sliders (sour↔bitter, watery↔syrupy) |
| 5 | "When you nail it, lock it in."             | Show the dialed-in badge + locked recipe stats    |
| 6 | "Tune yourself, not just one bag."          | Suggestion cards + CTA + crema.live               |

## Export

From `brew/docs/press-kit/`, with the local server running on port 3000:

```bash
cd brew && npx serve . -l 3000   # one terminal
cd brew/docs/press-kit
node carousel-dial-in-export.mjs # captures all 6 PNGs in one shot
```

The script lives in `press-kit/` because Playwright is installed there.
