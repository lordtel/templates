// Crema — service worker
// Offline: cache the app shell on install, serve same-origin requests
// stale-while-revalidate, fall back to cached index.html for navigations.
//
// Versioning: bump VERSION on every deploy that changes the shell so old
// caches are purged on activate. CDN assets (Supabase, Tesseract, fonts)
// are not intercepted — we let the browser handle them normally.

const VERSION = "v1";
const CACHE_NAME = `crema-${VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./app.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./og-image.svg",
  "./404.html",
  "./core/auth.js",
  "./core/config.js",
  "./core/dial-in.js",
  "./core/gear-catalog.js",
  "./core/image-editor.css",
  "./core/image-editor.js",
  "./core/ocr.js",
  "./core/router.js",
  "./core/sentry.js",
  "./core/storage.js",
  "./core/store.js",
  "./core/supabase.js",
  "./features/about/about.css",
  "./features/about/about.js",
  "./features/analytics/analytics.css",
  "./features/analytics/analytics.js",
  "./features/bag-detail/bag-detail.css",
  "./features/bag-detail/bag-detail.js",
  "./features/bag-form/bag-form.css",
  "./features/bag-form/bag-form.js",
  "./features/changelog/changelog.css",
  "./features/changelog/changelog.js",
  "./features/dial-in/dial-in.css",
  "./features/dial-in/dial-in.js",
  "./features/equipment/equipment.css",
  "./features/equipment/equipment.js",
  "./features/equipment/strip.js",
  "./features/home/home.css",
  "./features/home/home.js",
  "./features/nav/nav.css",
  "./features/nav/nav.js",
  "./features/onboarding/onboarding.css",
  "./features/onboarding/onboarding.js",
  "./features/privacy/privacy.js",
  "./features/rating-form/rating-form.css",
  "./features/rating-form/rating-form.js",
  "./features/sign-in/sign-in.css",
  "./features/sign-in/sign-in.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // cache.addAll is atomic — if one file 404s the whole install fails.
      // Precache one at a time so a single missing file doesn't kill offline.
      await Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch(() => {
            // swallow individual failures; log in console for visibility
            console.warn("[sw] precache skipped:", url);
          })
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Let cross-origin requests (Supabase, Google Fonts, Tesseract CDN) through.
  if (url.origin !== self.location.origin) return;

  // SPA navigations: try network first (fresh HTML with latest shell),
  // fall back to the cached index so hash routes still boot offline.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cached = await caches.match("./index.html");
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Same-origin static assets: stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((res) => {
          if (res && res.ok) cache.put(request, res.clone());
          return res;
        })
        .catch(() => null);
      return cached || (await network) || Response.error();
    })()
  );
});

// Allow the page to trigger an immediate update (useful after a deploy).
self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});
