// Generate a 1080×1350 PNG share card for a bag.
//
// We render directly to a <canvas> using app brand tokens. No external libs.
// The output is a Blob the caller can drop into Web Share or download.

const W = 1080;
const H = 1350;

const TOKENS = {
  bg: "#f4ede0",
  bgDeep: "#e9dfc7",
  surface: "#fdf8ee",
  ink: "#2b1b12",
  inkSoft: "#5a4530",
  inkFaint: "#8a7a65",
  accent: "#7a3e1d",
  accentSoft: "#f5e8d8",
  crema: "#d9b580",
  line: "rgba(43, 27, 18, 0.12)",
};

export async function generateShareCard(bag) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  await ensureFonts();

  drawBackground(ctx);
  await drawHero(ctx, bag);
  drawHeader(ctx, bag);
  drawDialIn(ctx, bag);
  drawRatings(ctx, bag);
  drawFooter(ctx);

  return await canvasToBlob(canvas);
}

async function ensureFonts() {
  if (!document.fonts?.ready) return;
  try {
    await document.fonts.ready;
    // Force-load the specific weights we'll use
    await Promise.all([
      document.fonts.load('500 64px "Fraunces"'),
      document.fonts.load('500 36px "Fraunces"'),
      document.fonts.load('600 22px "Inter"'),
      document.fonts.load('500 26px "Inter"'),
      document.fonts.load('400 22px "Inter"'),
    ]);
  } catch {}
}

function drawBackground(ctx) {
  // Cream gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#f0e6d2");
  grad.addColorStop(1, "#d8c8a8");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Soft accent glow top
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, W * 0.7);
  glow.addColorStop(0, "rgba(217, 181, 128, 0.5)");
  glow.addColorStop(1, "rgba(217, 181, 128, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}

async function drawHero(ctx, bag) {
  // Photo card 540 wide, centered horizontally, top of card area
  const cardX = 90;
  const cardY = 80;
  const cardW = W - cardX * 2;
  const cardH = 600;

  // Card shadow + base
  ctx.save();
  ctx.shadowColor = "rgba(43, 27, 18, 0.18)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  roundRect(ctx, cardX, cardY, cardW, cardH, 32);
  ctx.fillStyle = TOKENS.surface;
  ctx.fill();
  ctx.restore();

  // Photo (clipped to rounded rect with inset)
  const photo = bag.photo;
  if (photo) {
    try {
      const img = await loadImage(photo);
      ctx.save();
      const padding = 24;
      const px = cardX + padding;
      const py = cardY + padding;
      const pw = cardW - padding * 2;
      const ph = cardH - padding * 2;
      roundRect(ctx, px, py, pw, ph, 18);
      ctx.clip();

      // object-fit: cover
      const imgAR = img.width / img.height;
      const boxAR = pw / ph;
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
      ctx.drawImage(img, sx, sy, sw, sh, px, py, pw, ph);
      ctx.restore();
      return;
    } catch {
      // Fall through to placeholder
    }
  }

  // Placeholder hero — gradient with first letter
  ctx.save();
  const padding = 24;
  const px = cardX + padding;
  const py = cardY + padding;
  const pw = cardW - padding * 2;
  const ph = cardH - padding * 2;
  roundRect(ctx, px, py, pw, ph, 18);
  ctx.clip();
  const phGrad = ctx.createLinearGradient(px, py, px + pw, py + ph);
  phGrad.addColorStop(0, "#3a1e0e");
  phGrad.addColorStop(0.5, TOKENS.accent);
  phGrad.addColorStop(1, "#b98555");
  ctx.fillStyle = phGrad;
  ctx.fillRect(px, py, pw, ph);

  const letter = (bag.brand || "☕")[0]?.toUpperCase() || "☕";
  ctx.fillStyle = "rgba(240, 212, 138, 0.92)";
  ctx.font = '500 220px "Fraunces", Georgia, serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, px + pw / 2, py + ph / 2);
  ctx.restore();
}

function drawHeader(ctx, bag) {
  const y = 740;

  // Brand name
  ctx.fillStyle = TOKENS.ink;
  ctx.font = '500 64px "Fraunces", Georgia, serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const brand = bag.brand || "Untitled";
  ctx.fillText(truncate(ctx, brand, W - 200), W / 2, y);

  // Origin · process
  const subParts = [bag.origin, bag.process].filter(Boolean);
  if (subParts.length) {
    ctx.fillStyle = TOKENS.accent;
    ctx.font = '500 24px "Inter", system-ui, sans-serif';
    ctx.fillText(subParts.join(" · ").toUpperCase(), W / 2, y + 38);
  }
}

function drawDialIn(ctx, bag) {
  const r = bag.dialedInRecipe;
  if (!bag.dialedInAt || !r) return;

  const y = 840;
  const cardX = 90;
  const cardW = W - cardX * 2;
  const cardH = 200;

  // Card
  ctx.save();
  ctx.shadowColor = "rgba(43, 27, 18, 0.1)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  roundRect(ctx, cardX, y, cardW, cardH, 24);
  ctx.fillStyle = TOKENS.surface;
  ctx.fill();
  ctx.restore();

  // "DIAL-IN" eyebrow + "Dialed in" badge
  ctx.fillStyle = TOKENS.accent;
  ctx.font = '600 18px "Inter", sans-serif';
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("DIALED IN", cardX + 32, y + 40);

  // Stats row — Dose, Yield, Ratio, Time, Grind
  const stats = [];
  if (r.dose != null) stats.push({ label: "Dose", value: `${r.dose}g` });
  if (r.yield != null) stats.push({ label: "Yield", value: `${r.yield}g` });
  if (r.dose && r.yield) {
    stats.push({ label: "Ratio", value: `1:${(Number(r.yield) / Number(r.dose)).toFixed(2)}` });
  }
  if (r.time != null) stats.push({ label: "Time", value: `${r.time}s` });
  if (r.grind != null) stats.push({ label: "Grind", value: String(r.grind) });

  const colW = cardW / stats.length;
  const colY = y + 110;
  stats.forEach((s, i) => {
    const cx = cardX + colW * i + colW / 2;
    ctx.fillStyle = TOKENS.inkFaint;
    ctx.font = '500 14px "Inter", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(s.label.toUpperCase(), cx, colY);

    ctx.fillStyle = TOKENS.ink;
    ctx.font = '500 38px "Fraunces", Georgia, serif';
    ctx.fillText(s.value, cx, colY + 50);
  });
}

function drawRatings(ctx, bag) {
  const ratings = bag.ratings ?? [];
  if (!ratings.length) return;

  // Compute average
  const avg = ratings.reduce((s, r) => s + (Number(r.rating) || 0), 0) / ratings.length;
  if (!avg) return;

  const y = 1095;
  ctx.fillStyle = TOKENS.inkFaint;
  ctx.font = '500 16px "Inter", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`AVERAGE · ${ratings.length} ${ratings.length === 1 ? "RATING" : "RATINGS"}`, W / 2, y);

  // Stars
  const filled = Math.round(avg);
  const starSize = 36;
  const gap = 12;
  const totalW = starSize * 5 + gap * 4;
  const startX = (W - totalW) / 2;
  for (let i = 0; i < 5; i++) {
    const sx = startX + i * (starSize + gap);
    drawStar(ctx, sx + starSize / 2, y + 36, starSize / 2, i < filled ? TOKENS.accent : "rgba(122, 62, 29, 0.18)");
  }
}

function drawFooter(ctx) {
  // crema.live
  ctx.fillStyle = TOKENS.accent;
  ctx.font = '600 22px "Inter", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = "0.2em";
  ctx.fillText("CREMA.LIVE", W / 2, H - 60);
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (-Math.PI / 2) + (i * 2 * Math.PI) / 5;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    const a2 = a + Math.PI / 5;
    const x2 = cx + (r * 0.45) * Math.cos(a2);
    const y2 = cy + (r * 0.45) * Math.sin(a2);
    ctx.lineTo(x2, y2);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
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

function truncate(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + "…").width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "…";
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to encode PNG"));
    }, "image/png");
  });
}

// Trigger a Web Share with the image, falling back to a download.
export async function shareBagAsCard(bag) {
  let blob;
  try {
    blob = await generateShareCard(bag);
  } catch (err) {
    console.error("[share-card] generate failed:", err);
    return { ok: false, error: "Couldn't generate the card." };
  }

  const file = new File([blob], `crema-${(bag.brand || "bag").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`, {
    type: "image/png",
  });

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
      // Fall through to download
    }
  }

  // Fallback: trigger download
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
