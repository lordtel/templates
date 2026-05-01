// Render each .stage in docs/carousel/dial-in/index.html to a 1080×1350 PNG.
//
// Run from brew/docs/press-kit/ (where Playwright is installed):
//   node carousel-dial-in-export.mjs
//
// Output: brew/docs/carousel/dial-in/png/slide-1.png ... slide-6.png
//
// Requires the local dev server on :3000 (cd brew && npx serve . -l 3000).

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../carousel/dial-in/png");
const URL_TARGET = "http://localhost:3000/docs/carousel/dial-in/index.html";
const SLIDES = 6;

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 1400 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

await page.goto(URL_TARGET, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts?.ready);
await page.waitForTimeout(800); // let Fraunces + Inter settle

for (let i = 1; i <= SLIDES; i++) {
  const sel = `.s${i}`;
  const el = await page.$(sel);
  if (!el) {
    console.error("  ✗ missing", sel);
    continue;
  }
  const out = join(OUT_DIR, `slide-${i}.png`);
  await el.screenshot({ path: out, type: "png" });
  console.log("  ✓ slide", i, "→", out.replace(__dirname + "/", ""));
}

await browser.close();
console.log(`\nWrote ${SLIDES} PNGs to ${OUT_DIR}`);
