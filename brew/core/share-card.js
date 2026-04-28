// Generate a 1080×1350 PNG share card for a bag.
//
// Pure Canvas API — no external libs. Uses the same Fraunces + Inter loaded
// by the app, so typography matches the brand. Output is a Blob the caller
// can drop into Web Share or trigger a download with.

const W = 1080;
const H = 1350;
const PAD = 90;

const TOKENS = {
  bg1: "#f0e6d2",
  bg2: "#e2d2ad",
  surface: "#fdf8ee",
  ink: "#2b1b12",
  inkSoft: "#5a4530",
  inkFaint: "#8a7a65",
  accent: "#7a3e1d",
  accentSoft: "#f5e8d8",
  crema: "#d9b580",
  line: "rgba(43, 27, 18, 0.12)",
};

// Layout (px). Each section starts at the previous y + gap.
const LAYOUT = {
  photo: { y: 80, h: 660 },
  titleGap: 80,           // gap before brand name baseline
  recipeGap: 45,          // gap before recipe card
  recipeH: 210,
  ratingGap: 55,          // gap before rating (more breathing room)
  ratingH: 110,
  footerY: H - 50,        // crema.live baseline
};

export async function generateShareCard(bag) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  await ensureFonts();

  drawBackground(ctx);
  await drawPhoto(ctx, bag);

  let y = LAYOUT.photo.y + LAYOUT.photo.h + LAYOUT.titleGap;
  y = drawTitleBlock(ctx, bag, y);
  y = drawRecipeBlock(ctx, bag, y + LAYOUT.recipeGap);
  drawRatingBlock(ctx, bag, y + LAYOUT.ratingGap);
  drawFooter(ctx);

  return await canvasToBlob(canvas);
}

// Wait for the actual font weights/sizes we'll use to be ready.
async function ensureFonts() {
  if (!document.fonts) return;
  const probes = [
    '500 72px "Fraunces"',
    '500 60px "Fraunces"',
    '600 22px "Inter"',
    '500 26px "Inter"',
    '500 18px "Inter"',
    '400 22px "Inter"',
  ];
  try {
    await document.fonts.ready;
    await Promise.all(probes.map((p) => document.fonts.load(p)));
  } catch {}
}

function drawBackground(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, TOKENS.bg1);
  grad.addColorStop(1, TOKENS.bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, -100, 0, W / 2, -100, W * 0.85);
  glow.addColorStop(0, "rgba(217, 181, 128, 0.55)");
  glow.addColorStop(1, "rgba(217, 181, 128, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}

async function drawPhoto(ctx, bag) {
  const cardX = PAD;
  const cardY = LAYOUT.photo.y;
  const cardW = W - PAD * 2;
  const cardH = LAYOUT.photo.h;
  const radius = 36;

  ctx.save();
  ctx.shadowColor = "rgba(43, 27, 18, 0.22)";
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 14;
  roundRect(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.fillStyle = TOKENS.surface;
  ctx.fill();
  ctx.restore();

  const inset = 22;
  const px = cardX + inset;
  const py = cardY + inset;
  const pw = cardW - inset * 2;
  const ph = cardH - inset * 2;

  ctx.save();
  roundRect(ctx, px, py, pw, ph, radius - inset);
  ctx.clip();

  if (bag.photo) {
    try {
      const img = await loadImage(bag.photo);
      drawImageCover(ctx, img, px, py, pw, ph);
      ctx.restore();
      return;
    } catch {
      // fall through to placeholder
    }
  }

  // Placeholder hero
  const phGrad = ctx.createLinearGradient(px, py, px + pw, py + ph);
  phGrad.addColorStop(0, "#3a1e0e");
  phGrad.addColorStop(0.55, TOKENS.accent);
  phGrad.addColorStop(1, "#b98555");
  ctx.fillStyle = phGrad;
  ctx.fillRect(px, py, pw, ph);

  const letter = (bag.brand || "☕").trim()[0]?.toUpperCase() || "☕";
  ctx.fillStyle = "rgba(240, 212, 138, 0.92)";
  ctx.font = '500 260px "Fraunces", Georgia, serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, px + pw / 2, py + ph / 2);
  ctx.restore();
}

function drawTitleBlock(ctx, bag, y) {
  const brand = (bag.brand || "Untitled").trim();
  const maxBrandWidth = W - PAD * 2;
  let size = 72;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = TOKENS.ink;
  while (size > 40) {
    ctx.font = `500 ${size}px "Fraunces", Georgia, serif`;
    if (ctx.measureText(brand).width <= maxBrandWidth) break;
    size -= 4;
  }
  ctx.fillText(brand, W / 2, y);

  const subParts = [bag.origin, bag.process].filter(Boolean);
  if (subParts.length) {
    const text = subParts.join(" · ").toUpperCase();
    ctx.fillStyle = TOKENS.accent;
    ctx.font = '600 20px "Inter", system-ui, sans-serif';
    drawTextWithLetterSpacing(ctx, text, W / 2, y + 38, 4);
  }
  return y + 40; // bottom of the title block
}

function drawRecipeBlock(ctx, bag, y) {
  const r = bag.dialedInRecipe;
  if (!bag.dialedInAt || !r) return y;

  const cardX = PAD;
  const cardW = W - PAD * 2;
  const cardH = LAYOUT.recipeH;
  const radius = 28;

  ctx.save();
  ctx.shadowColor = "rgba(43, 27, 18, 0.08)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 6;
  roundRect(ctx, cardX, y, cardW, cardH, radius);
  ctx.fillStyle = TOKENS.surface;
  ctx.fill();
  ctx.restore();

  // "DIALED IN" eyebrow
  ctx.fillStyle = TOKENS.accent;
  ctx.font = '600 15px "Inter", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  drawTextWithLetterSpacing(ctx, "DIALED IN", W / 2, y + 38, 4);

  // Hero recipe — ratio · time
  const dose = Number(r.dose);
  const yld = Number(r.yield);
  const ratio = dose > 0 && yld > 0 ? `1:${(yld / dose).toFixed(2)}` : null;
  const heroParts = [];
  if (ratio) heroParts.push(ratio);
  if (r.time != null) heroParts.push(`${r.time}s`);

  if (heroParts.length) {
    ctx.fillStyle = TOKENS.ink;
    ctx.font = '500 60px "Fraunces", Georgia, serif';
    ctx.textAlign = "center";
    ctx.fillText(heroParts.join("   ·   "), W / 2, y + 118);
  }

  // Supporting stats — dose → yield · grind
  const supports = [];
  if (r.dose != null && r.yield != null) supports.push(`${r.dose}g → ${r.yield}g`);
  if (r.grind != null) supports.push(`grind ${r.grind}`);

  if (supports.length) {
    ctx.fillStyle = TOKENS.inkSoft;
    ctx.font = '500 24px "Inter", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(supports.join("   ·   "), W / 2, y + 168);
  }
  return y + cardH;
}

function drawRatingBlock(ctx, bag, y) {
  const ratings = bag.ratings ?? [];
  if (!ratings.length) return y;
  const avg = ratings.reduce((s, r) => s + (Number(r.rating) || 0), 0) / ratings.length;
  if (!avg) return y;

  // Eyebrow
  ctx.fillStyle = TOKENS.inkFaint;
  ctx.font = '500 14px "Inter", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const lbl = `${ratings.length} ${ratings.length === 1 ? "RATING" : "RATINGS"} · AVERAGE`;
  drawTextWithLetterSpacing(ctx, lbl, W / 2, y + 22, 3);

  // Stars
  const filled = Math.round(avg);
  const starSize = 38;
  const gap = 14;
  const totalW = starSize * 5 + gap * 4;
  const startX = (W - totalW) / 2;
  const starY = y + 60;
  for (let i = 0; i < 5; i++) {
    const cx = startX + i * (starSize + gap) + starSize / 2;
    drawStar(
      ctx,
      cx,
      starY,
      starSize / 2,
      i < filled ? TOKENS.accent : "rgba(122, 62, 29, 0.18)"
    );
  }
  return y + LAYOUT.ratingH;
}

function drawFooter(ctx) {
  const cy = LAYOUT.footerY;
  ctx.fillStyle = TOKENS.inkSoft;
  ctx.font = '500 20px "Inter", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  drawTextWithLetterSpacing(ctx, "CREMA.LIVE", W / 2, cy, 5);
}

// Manually space text — ctx.letterSpacing is Chrome-only.
function drawTextWithLetterSpacing(ctx, text, x, y, spacing) {
  if (spacing <= 0) {
    ctx.fillText(text, x, y);
    return;
  }
  const chars = [...text];
  let totalWidth = 0;
  const widths = chars.map((c) => {
    const w = ctx.measureText(c).width;
    totalWidth += w;
    return w;
  });
  totalWidth += spacing * (chars.length - 1);

  let cursor;
  if (ctx.textAlign === "center") cursor = x - totalWidth / 2;
  else if (ctx.textAlign === "right") cursor = x - totalWidth;
  else cursor = x;

  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cursor, y);
    cursor += widths[i] + spacing;
  }
  ctx.textAlign = prevAlign;
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    const a2 = a + Math.PI / 5;
    const x2 = cx + r * 0.45 * Math.cos(a2);
    const y2 = cy + r * 0.45 * Math.sin(a2);
    ctx.lineTo(x2, y2);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawImageCover(ctx, img, x, y, w, h) {
  const imgAR = img.width / img.height;
  const boxAR = w / h;
  let sx, sy, sw, sh;
  if (imgAR > boxAR) {
    sh = img.height;
    sw = sh * boxAR;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / boxAR;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to encode PNG"));
    }, "image/png");
  });
}

export async function shareBagAsCard(bag) {
  let blob;
  try {
    blob = await generateShareCard(bag);
  } catch (err) {
    console.error("[share-card] generate failed:", err);
    return { ok: false, error: "Couldn't generate the card." };
  }

  const file = new File(
    [blob],
    `crema-${(bag.brand || "bag").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`,
    { type: "image/png" }
  );

  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({
        files: [file],
        title: `${bag.brand || "Coffee"} on Crema`,
        text: `Dialed in on Crema — crema.live`,
      });
      return { ok: true, shared: true };
    } catch (err) {
      if (err.name === "AbortError") return { ok: true, shared: false, cancelled: true };
      // fall through to download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { ok: true, shared: false, downloaded: true };
}
