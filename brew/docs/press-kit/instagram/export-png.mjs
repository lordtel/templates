// Render Instagram publication HTML files to 1080×1920 PNGs.
//
//   $ cd brew/docs/press-kit && node instagram/export-png.mjs
//
// Output: brew/docs/press-kit/instagram/png/*.png

import { chromium } from "playwright";
import { mkdir, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTERS_DIR = __dirname;
const OUT_DIR = resolve(POSTERS_DIR, "png");
const VIEWPORT = { width: 1080, height: 1920 };
const FONT_WAIT_MS = 1000;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const entries = await readdir(POSTERS_DIR);
  const posters = entries.filter((f) => /^\d{2}-.+\.html$/.test(f)).sort();
  if (posters.length === 0) {
    console.error("No HTML posters found in", POSTERS_DIR);
    process.exit(1);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });

  for (const file of posters) {
    const src = join(POSTERS_DIR, file);
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
