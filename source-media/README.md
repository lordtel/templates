# Source media

Raw photos, footage, and reference material that I (Claude) and you can use
to build press-kit assets, Instagram posts, screenshots, and reels.

## Why it lives here, not in `brew/`

`brew/` is the only folder published to **crema.live** via GitHub Pages
(`.github/workflows/pages.yml` deploys `./brew`). Anything in this folder is
**versioned in git but not exposed on the public site** — perfect for raw
sources you don't want indexed.

## Layout

```
source-media/
├── images/      ← photos of bags, gear, café shots, etc.
└── videos/      ← raw clips, b-roll, screen recordings
```

## How to use it

1. Drop your file in `images/` or `videos/`. Use descriptive names —
   `terres-de-cafe-buenos-aires.jpg`, not `IMG_4521.jpg`.
2. Tell me "use the photo at `source-media/images/<filename>` for the next
   post". I'll reference it directly when generating Instagram visuals,
   share cards, or screenshots.
3. When I produce a derivative (a 1080×1920 IG story, a thumbnail, etc.),
   the *output* goes under `brew/docs/press-kit/...` so it ships to
   crema.live. The source stays here.

## Size rule of thumb

- Up to ~5 MB per file: commit normally.
- 5–50 MB: still fine but flag it; we may compress on the way in.
- Over 50 MB (raw 4K video, etc.): use Git LFS or push to a Supabase
  storage bucket instead. Big binaries bloat clones forever.

## Naming convention

`<roaster-or-subject>-<bag-or-detail>.<ext>` — lowercase, hyphenated.

Good: `terres-de-cafe-buenos-aires.jpg`, `arabica-ethiopia-yirgacheffe.png`,
`dial-in-screen-recording.mp4`

Bad: `IMG_4521.HEIC`, `Photo on 4-30-26 at 9.20 AM.jpg`
