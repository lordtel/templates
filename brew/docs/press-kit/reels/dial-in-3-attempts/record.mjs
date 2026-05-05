// Record the dial-in-3-attempts reel and produce a 30s 1080×1920 mp4.
//
// Run from brew/docs/press-kit/ (where Playwright is installed):
//   node reels/dial-in-3-attempts/record.mjs
//
// Output: reels/dial-in-3-attempts/dial-in-3-attempts-reel.mp4

import { chromium } from "playwright";
import { mkdir, rm, readdir, rename } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const URL_TARGET = "http://localhost:3000/docs/press-kit/reels/dial-in-3-attempts/dial-in-3-attempts-reel.html";
// Record longer than 30s so we can trim the Playwright startup delay off the front
const DURATION_MS = 32000;
const TRIM_START_S = 1.6;  // empirically: skips the ~1.5s page-load gap
const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP_DIR = resolve(__dirname, "out");
const OUT_MP4 = resolve(__dirname, "dial-in-3-attempts-reel.mp4");
const OUT_WEBM_FALLBACK = resolve(__dirname, "dial-in-3-attempts-reel.webm");

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

const files = (await readdir(TMP_DIR)).filter((f) => f.endsWith(".webm"));
if (!files.length) {
  console.error("No webm produced.");
  process.exit(1);
}
const webm = join(TMP_DIR, files[0]);
console.log("  Recorded:", webm);

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
  process.exit(0);
}

console.log("Converting to mp4…");
await new Promise((resolveP, reject) => {
  const args = [
    "-y",
    "-ss", String(TRIM_START_S),  // skip the recording-startup gap so animation starts at t=0
    "-i", webm,
    "-t", "30",
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-an",
    OUT_MP4,
  ];
  const p = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
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
