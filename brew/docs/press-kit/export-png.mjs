// Render every press-kit HTML screenshot to a 1080×1920 PNG.
//
//   $ npm install          # first time, pulls Playwright + Chromium
//   $ npm run export-png
//
// Output: brew/docs/press-kit/screenshots/png/*.png
//
// Each HTML file is a self-contained 1080×1920 poster that pulls in the real
// app CSS via relative paths, so what you screenshot is pixel-identical to
// the app rendered in a browser.

import { chromium } from "playwright";
import { mkdir, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOTS_DIR = resolve(__dirname, "screenshots");
const OUT_DIR = resolve(SHOTS_DIR, "png");
const VIEWPORT = { width: 1080, height: 1920 };
const FONT_WAIT_MS = 800; // let Fraunces + Inter settle before capture

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const entries = await readdir(SHOTS_DIR);
  const posters = entries.filter((f) => /^\d{2}-.+\.html$/.test(f)).sort();
  if (posters.length === 0) {
    console.error("No HTML posters found in", SHOTS_DIR);
    process.exit(1);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });

  for (const file of posters) {
    const src = join(SHOTS_DIR, file);
    const dst = join(OUT_DIR, file.replace(/\.html$/, ".png"));
    const page = await context.newPage();
    await page.goto(pathToFileURL(src).href, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForTimeout(FONT_WAIT_MS);
    await page.screenshot({
      path: dst,
      clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
      type: "png",
    });
    await page.close();
    console.log("  ✓", file, "→", dst.replace(__dirname + "/", ""));
  }

  await browser.close();
  console.log(`\nWrote ${posters.length} PNGs to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
