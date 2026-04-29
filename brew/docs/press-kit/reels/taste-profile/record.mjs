// Record the taste-profile reel and produce a 30s 1080×1920 mp4.
//
// Run from `brew/docs/press-kit/` with the local dev server up on :3000:
//   node reels/taste-profile/record.mjs
//
// Output: reels/taste-profile/taste-profile-reel.mp4
//
// Requires ffmpeg on PATH for the mp4 conversion. Without ffmpeg, the
// script still produces a webm next to the mp4 destination.

import { chromium } from "playwright";
import { mkdir, rm, readdir, rename } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const URL_TARGET = "http://localhost:3000/docs/press-kit/reels/taste-profile/taste-profile-reel.html";
const DURATION_MS = 30500;
const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP_DIR = resolve(__dirname, "out");
const OUT_MP4 = resolve(__dirname, "taste-profile-reel.mp4");
const OUT_WEBM_FALLBACK = resolve(__dirname, "taste-profile-reel.webm");

await mkdir(TMP_DIR, { recursive: true });

console.log("Recording 30 s @ 1080×1920…");
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
  recordVideo: { dir: TMP_DIR, size: { width: 1080, height: 1920 } },
});
const page = await context.newPage();
await page.goto(URL_TARGET, { waitUntil: "networkidle" });
await page.evaluate(() => location.reload());
await page.waitForLoadState("networkidle");
await page.waitForTimeout(DURATION_MS);
await page.close();
await context.close();
await browser.close();

// Find the webm Playwright produced
const files = (await readdir(TMP_DIR)).filter((f) => f.endsWith(".webm"));
if (!files.length) {
  console.error("No webm produced by Playwright.");
  process.exit(1);
}
const webm = join(TMP_DIR, files[0]);
console.log("  Recorded:", webm);

// Try ffmpeg to convert to mp4. If unavailable, keep the webm.
const haveFfmpeg = await new Promise((res) => {
  const child = spawn("ffmpeg", ["-version"]);
  child.on("error", () => res(false));
  child.on("exit", (code) => res(code === 0));
});

if (!haveFfmpeg) {
  console.warn("\nffmpeg not found — keeping webm only.");
  await rename(webm, OUT_WEBM_FALLBACK);
  await rm(TMP_DIR, { recursive: true, force: true });
  console.log("  Wrote:", OUT_WEBM_FALLBACK);
  console.log("\nInstall ffmpeg and re-run, or convert manually:");
  console.log(`  ffmpeg -i ${OUT_WEBM_FALLBACK} -c:v libx264 -preset slow -crf 20 \\`);
  console.log(`    -pix_fmt yuv420p -movflags +faststart ${OUT_MP4}`);
  process.exit(0);
}

console.log("Converting to mp4…");
await new Promise((resolveP, reject) => {
  // Trim to exactly 30s with -t 30.
  // libx264 + yuv420p for max compatibility (Instagram, iOS Safari, etc.)
  // -movflags +faststart = atom shuffle for instant playback / streaming.
  const args = [
    "-y",                  // overwrite output
    "-i", webm,
    "-t", "30",
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-an",                 // no audio track (you'll add a voiceover in CapCut)
    OUT_MP4,
  ];
  const p = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
  // ffmpeg logs to stderr; surface progress lines but suppress the verbose header
  p.stderr.on("data", (d) => {
    const s = d.toString();
    const line = s.split("\n").find((l) => /^frame=/.test(l));
    if (line) process.stdout.write(`\r  ${line.trim()}`);
  });
  p.on("error", reject);
  p.on("exit", (code) => (code === 0 ? resolveP() : reject(new Error("ffmpeg exit " + code))));
});

await rm(TMP_DIR, { recursive: true, force: true });
console.log("\n  Wrote:", OUT_MP4);
