// Record the taste-profile reel to a 30s webm.
// Run from brew/docs/press-kit/ with the local dev server running on :3000.
// Then convert to mp4:
//   ffmpeg -i out/*.webm -c:v libx264 -preset slow -crf 20 \
//     -pix_fmt yuv420p -movflags +faststart taste-profile-reel.mp4
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const URL_TARGET = "http://localhost:3000/docs/press-kit/reels/taste-profile/taste-profile-reel.html";
const DURATION_MS = 30500;
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "out");

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT_DIR, size: { width: 1080, height: 1920 } },
});
const page = await context.newPage();

await page.goto(URL_TARGET, { waitUntil: "networkidle" });
await page.evaluate(() => location.reload());
await page.waitForLoadState("networkidle");
await page.waitForTimeout(DURATION_MS);

await page.close();
await context.close();
await browser.close();

console.log(`Recording saved in ${OUT_DIR}`);
