# Night Hawk

Quiet focus for the small hours. A single-page task companion with a
nocturnal palette and zero dependencies — pure HTML, CSS, and ES modules.

## Run it

Because it uses native ES modules, it needs an HTTP server (not `file://`):

```bash
npx serve . -l 3000
# then open http://localhost:3000
```

## Structure

Feature-folder architecture. Each feature owns its JS + CSS. A small
`core/` holds shared state and storage.

```
night-hawk/
├── index.html
├── app.js              entry point
├── app.css             design tokens, background
├── core/
│   ├── store.js        pub/sub state (tasks, filter)
│   └── storage.js      localStorage helpers
└── features/
    ├── home/           the main page: shell, masthead, today
    ├── composer/       add-task input
    ├── tasks/          list, items, clear-completed
    ├── filters/        all / active / done
    └── progress/       progress ring
```

Your tasks stay on your device — nothing is sent anywhere.
