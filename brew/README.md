# Brew

A quiet companion for espresso lovers. Log your coffee bags (photo + OCR
pre-fills brand / origin / roast / weight), record how each bag performed as
espresso, iced americano, iced latte, and cappuccino, and watch your
analytics build up over time.

## Run it

Because it uses native ES modules, it needs an HTTP server (not `file://`):

```bash
npx serve . -l 3000
# then open http://localhost:3000
```

OCR runs entirely in your browser (Tesseract.js). Your bags and ratings stay
on your device in `localStorage`.

## Structure

Feature-folder architecture — each feature owns its JS + CSS. `core/`
holds the shared store, router, OCR loader, and storage helpers.

```
brew/
├── index.html
├── app.js                 entry
├── app.css                tokens + layout shell
├── core/
│   ├── store.js           state: bags[], subscribe/pub-sub
│   ├── storage.js         localStorage helpers
│   ├── router.js          tiny hash router
│   └── ocr.js             Tesseract.js loader + field heuristics
└── features/
    ├── home/              main page: bags list
    ├── nav/               bottom tab bar
    ├── bag-form/          add/edit a bag (photo upload + OCR)
    ├── bag-detail/        one bag + 4 drink rating slots
    ├── rating-form/       rate a drink (date, grind, stars, notes)
    ├── equipment/         machine + grinder settings, top strip
    └── analytics/         dashboards: totals, averages, timeline
```
