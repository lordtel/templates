# Crema — Claude Memory

## What this repo is

Vanilla JS coffee-logging PWA at `brew/`, deployed to **crema.live** via GitHub Pages (CNAME in `brew/`).

## Tech stack

- **Frontend:** Vanilla JS ES modules, no build step. Feature-folder architecture.
- **Backend:** Supabase — Postgres + RLS, Storage (private photo bucket), Google OAuth.
- **OCR:** Tesseract.js, runs entirely in-browser.
- **Error tracking:** Sentry.
- **Fonts:** Fraunces (serif, headings) + Inter (sans, UI) via Google Fonts.

## Brand tokens (from `app.css`)

```
--bg: #f4ede0
--ink: #2b1b12
--accent: #7a3e1d
--crema: #d9b580
--surface-solid: #fdf8ee
```

## Repo structure

```
brew/
├── index.html              PWA shell
├── app.js                  entry + auth boot
├── app.css                 design tokens + layout shell
├── core/
│   ├── store.js            state: bags[], pub-sub, persistence
│   ├── storage.js          localStorage helpers
│   ├── router.js           tiny hash router
│   ├── supabase.js         client + auth
│   ├── image-editor.js     in-app 4:5 crop/rotate/enhance modal
│   ├── dial-in.js          grinder math + recommendation engine
│   ├── ocr.js              Tesseract.js loader + field heuristics
│   └── sentry.js           crash reporting
└── features/
    ├── home/               bags list (Your shelf)
    ├── nav/                bottom tab bar
    ├── bag-form/           add/edit bag (photo upload + OCR)
    ├── bag-detail/         one bag + 4 drink rating slots
    ├── rating-form/        rate a drink (date, grind, stars, notes)
    ├── dial-in/            per-bag dial-in companion (shot logger)
    ├── equipment/          machine + grinder settings
    ├── analytics/          dashboards: totals, averages, timeline
    ├── about/              how it works + install instructions
    ├── privacy/            policy + data export
    ├── changelog/          shipping log
    ├── onboarding/         first-run intro
    └── sign-in/            Google OAuth + guest mode
```

## Press kit (`brew/docs/press-kit/`)

- **`index.html`** — press kit landing page with logo downloads, social cards, iframe-previewed screenshots, and Product Hunt demo embed.
- **`copy.md`** — brand copy: taglines, descriptions, feature bullets.
- **`logos/`** — SVG/PNG logo variants.
- **`social/`** — OG/social card images.
- **`screenshots/`** — 5 HTML screenshots using real app CSS inside a phone mockup:
  - `01-home.html` — Your shelf (bag list)
  - `02-bag-detail.html` — One bag + rating slots + dial-in stats
  - `03-dial-in.html` — Dial-in companion (shot logger form)
  - `04-analytics.html` — Journal + stats dashboard
  - `05-ocr.html` — OCR scan in progress
  - `_frame.css` — shared iPhone chrome + 1080×1920 poster wrapper
- **`demo/`** — 30s looping 1920×1080 Product Hunt demo:
  - `index.html` — 6 animated scenes (title → shelf → OCR → bag detail → dial-in → journal + CTA), crossfades, progress bar, Space to pause, R to restart.
  - `README.md` — QuickTime + Playwright recording recipes + ffmpeg mp4 conversion.

## Key CSS patterns used in press kit

### Containing fixed-position elements inside a scaled phone mockup
`transform: scale()` on `.stage-inner` creates a new containing block for `position: fixed` descendants — so `.nav { position: fixed }` anchors to the phone screen rather than the document. This is per CSS spec.

```css
.stage-inner {
  width: 400px;
  height: 828px;
  transform-origin: top left;
  transform: scale(1.54);
  position: relative;
  overflow: hidden;
}
```

### Responsive iframe scaling in press kit grid
Use CSS container queries so iframe screenshots scale to any card width:

```css
.thumb.shot {
  aspect-ratio: 9 / 16;
  container-type: inline-size;
}
.thumb.shot iframe {
  width: 1080px;
  height: 1920px;
  transform: scale(calc(1cqw / 10.8));
  transform-origin: top left;
  pointer-events: none;
}
```

## Source media (private, not deployed)

Raw photos and videos the user wants me to use as source material live in
`source-media/` **at the repo root** — outside `brew/`, so they're versioned
in git but **not** published to crema.live (the GH Pages workflow only
deploys `./brew`).

- `source-media/images/` — bag photos, gear shots, café shots
- `source-media/videos/` — raw footage, b-roll, screen recordings

When the user says "use the photo of X" for an IG post / share card / press
kit asset, look there first. Final renders (the IG story PNGs, the share
cards, the reel mp4s) belong under `brew/docs/press-kit/...` so they ship.

## Instagram videos / reels

Whenever the user asks for an Instagram video / reel / story video, always
produce a ready-to-post **mp4** end-to-end. Don't stop at webm and don't
ask the user to convert.

Recipe:

1. Build the animation as a self-contained `*.html` at 1080×1920 in
   `brew/docs/press-kit/reels/<feature>/` (CSS keyframes + SVG; reuse
   brand tokens from `app.css`).
2. Snapshot a few keyframes with Playwright (pause `document.getAnimations()`
   at fixed offsets) to verify the timing visually.
3. Record + convert in one Node script (`record.mjs`) — Playwright captures
   the page to webm, then `ffmpeg` re-encodes to H.264:
   ```bash
   ffmpeg -y -i <webm> -t 30 \
     -c:v libx264 -preset slow -crf 20 \
     -pix_fmt yuv420p -movflags +faststart -an \
     <feature>-reel.mp4
   ```
   `-an` strips audio so a voiceover can be layered on top in CapCut
   without conflicts.
4. Commit the mp4 alongside the html + record script + a README.
5. If the user asked for narration, also produce a `voiceover.md` with the
   script, scene-aligned timing, delivery notes, and AI-voice settings
   for ElevenLabs / Murf / Play.ht.

`ffmpeg` is required on PATH. If missing, install it (`apt-get install -y ffmpeg`)
before recording — fall back to webm only if installation fails.

## Git workflow

- Development branch: `claude/create-elegant-web-app-Xf25P`
- Merges to `master` via squash merge.
- After a squash merge, rebase the branch onto `origin/master` to drop the now-duplicate commit, then `git push --force-with-lease` before opening the next PR (otherwise `mergeable_state: dirty`).

```bash
git fetch origin master
git rebase origin/master   # skips already-merged commits automatically
git push -u origin <branch> --force-with-lease
```

## Merged PRs (history)

| PR | Title |
|----|-------|
| #39 | Add full press kit: logos, social cards, screenshots, copy deck |
| #40 | Press-kit screenshots: HTML renders using real app CSS |
| #41 | Add 30s Product Hunt demo (1920×1080 auto-play loop) |
| #42 | Service worker: offline support + app-shell precache |
| #43 | SEO: JSON-LD (SoftwareApplication, WebSite, FAQPage), sitemap, sr-only H1 |
| #44 | Share-a-bag: Web Share API + clipboard fallback (dialed-in recipe + 2 bag infos) |
| #45 | Gear catalog: Decent DE1 Pro + Timemore Sculptor 064S |
| #46 | Dial-in: Parameters/Results split + attempt count on bag detail |
| #47 | Bug fix: replace confirm()/prompt() with inline UI (iOS PWA silent block) |
| #48 | Analytics: financial view (spend, cost-per-shot ladder, best-value) |
| #53 | Press kit: refresh screenshots + one-command PNG export (`npm run export-png`) |
| #54 | UX polish: quick-rate stars, OCR skip link, best-value first, onboarding OCR lead, re-open toast |

## Local dev

```bash
cd brew
npx serve . -l 3000
# open http://localhost:3000
```

Needs an HTTP server — ES modules won't load over `file://`.
