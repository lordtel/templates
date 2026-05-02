# Crema — Instagram Reels

This folder holds 30 s vertical (1080 × 1920) reel sources. Each reel is a
self-contained HTML animation that records to mp4 in one step.

## Reels

| Folder | Topic | Status |
| ------ | ----- | ------ |
| [`taste-profile/`](./taste-profile/) | Taste profile spider chart feature | ✅ mp4 + voiceover script committed |

## Recipe (every reel follows this)

1. **Animation lives in a single HTML file** at 1080 × 1920 — CSS keyframes
   + SVG only, no build step.
2. **Verify timing** by snapshotting a few keyframes with Playwright
   (`document.getAnimations()` paused at fixed offsets) before recording.
3. **Record + encode in one Node script** (`record.mjs`):
   - Playwright captures the page to webm
   - `ffmpeg` re-encodes to H.264 mp4 with `-pix_fmt yuv420p`,
     `-movflags +faststart`, `-an` (no audio so a voiceover can be layered
     on top in CapCut without conflicts)
   - Output overwrites `<feature>-reel.mp4` next to the source
4. **Optional `voiceover.md`** — script aligned to scene timings, delivery
   notes, pronunciation, and AI-voice presets for ElevenLabs / Murf /
   Play.ht.

`ffmpeg` is required on PATH. Install it (`apt-get install -y ffmpeg`,
`brew install ffmpeg`) before running `record.mjs`.

## Final edit (audio, captions)

Drop the mp4 + a voiceover audio clip into **CapCut** (free, the standard
for Reels). Auto-generate captions, layer a lo-fi or jazz bed at -20 dB,
export 1080 × 1920 30 fps. Upload to Instagram → Reels.

## Adding a new reel

1. `mkdir reels/<feature>/` with a self-contained `<feature>-reel.html`.
2. Copy `record.mjs` from `taste-profile/` and update the URL + output
   filename.
3. Optional: write a `voiceover.md` next to it.
4. Add the row to the table at the top of this README.
