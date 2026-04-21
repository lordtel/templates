# Crema

A quiet companion for espresso lovers. Log your coffee bags (photo + OCR
pre-fills brand / origin / roast / weight), record how each bag performed as
espresso, iced americano, iced latte, and cappuccino, and watch your
analytics build up over time.

Live at [crema.live](https://crema.live).

## Run it

Because it uses native ES modules, it needs an HTTP server (not `file://`):

```bash
npx serve . -l 3000
# then open http://localhost:3000
```

OCR runs entirely in your browser (Tesseract.js) — photos never leave the
device during the scan. Signed in, your bags, ratings, dial-in logs, and
photos are stored in Supabase (Postgres with Row Level Security + private
photo bucket). Guest mode keeps everything in `localStorage` until you sign in
— at which point guest data is merged into your account.

## Structure

Feature-folder architecture — each feature owns its JS + CSS. `core/`
holds the shared store, router, OCR loader, image editor, and Supabase client.

```
brew/
├── index.html
├── app.js                 entry + auth boot
├── app.css                tokens + layout shell
├── core/
│   ├── store.js           state: bags[], subscribe/pub-sub, persistence
│   ├── storage.js         localStorage helpers
│   ├── router.js          tiny hash router
│   ├── supabase.js        client + auth
│   ├── image-editor.js    in-app 4:5 crop/rotate/enhance modal
│   ├── dial-in.js         grinder math + recommendation engine
│   ├── ocr.js             Tesseract.js loader + field heuristics
│   └── sentry.js          crash reporting
└── features/
    ├── home/              main page: bags list
    ├── nav/               bottom tab bar
    ├── bag-form/          add/edit a bag (photo upload + OCR)
    ├── bag-detail/        one bag + 4 drink rating slots
    ├── rating-form/       rate a drink (date, grind, stars, notes)
    ├── dial-in/           per-bag dial-in companion
    ├── equipment/         machine + grinder settings, top strip
    ├── analytics/         dashboards: totals, averages, timeline
    ├── about/             how it works + install instructions
    ├── privacy/           policy + data export
    ├── changelog/         shipping log
    ├── onboarding/        first-run intro
    └── sign-in/           Google OAuth + guest mode
```

