import { subscribe, allRatings, DRINK_TYPES } from "../../core/store.js";
import { navigate } from "../../core/router.js";

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

export function render(container) {
  container.innerHTML = "";
  const unsubscribe = subscribe((state) => paint(container, state));
  return unsubscribe;
}

function paint(container, state) {
  container.innerHTML = "";
  const head = document.createElement("div");
  head.className = "page-head";
  head.innerHTML = `
    <div>
      <p class="eyebrow">Your coffee</p>
      <h1>Journal</h1>
    </div>
  `;
  container.appendChild(head);

  const bags = state.bags;
  const ratings = allRatings();

  if (bags.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <h2>Nothing to analyze yet</h2>
      <p>Add a bag and rate a few drinks to see your stats.</p>
    `;
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "Add a bag";
    btn.addEventListener("click", () => navigate("/bag/new"));
    empty.appendChild(btn);
    container.appendChild(empty);
    return;
  }

  container.appendChild(hero(bags, ratings));
  container.appendChild(topPicks(bags));
  container.appendChild(financialView(bags));
  container.appendChild(tasteProfile(bags));
  container.appendChild(timeline(ratings));
}

function hero(bags, ratings) {
  const brews = ratings.length;
  const bagCount = bags.length;
  const avg = brews
    ? ratings.reduce((s, r) => s + (Number(r.rating) || 0), 0) / brews
    : 0;

  const totalSpent = bags.reduce((s, b) => s + (Number(b.price) || 0), 0);
  const finished = bags.filter((b) => b.finishedAt).length;
  const topDrink = favoriteDrink(ratings);

  const section = document.createElement("section");
  section.className = "hero-journal";

  const line = brews
    ? `You've logged <strong>${brews} brew${brews === 1 ? "" : "s"}</strong>
       across <strong>${bagCount} bag${bagCount === 1 ? "" : "s"}</strong>,
       averaging <strong>${avg.toFixed(1)}</strong> out of five.`
    : `You've added <strong>${bagCount} bag${bagCount === 1 ? "" : "s"}</strong>.
       Rate a few brews to see the rest of your journal.`;

  section.innerHTML = `
    <p class="journal-prose">${line}</p>
    <dl class="journal-stats">
      <div><dt>Spent</dt><dd>${formatPrice(totalSpent)}</dd></div>
      <div><dt>Finished</dt><dd>${finished}</dd></div>
      <div><dt>Favourite</dt><dd>${topDrink || "—"}</dd></div>
    </dl>
  `;
  return section;
}

function favoriteDrink(ratings) {
  if (!ratings.length) return "";
  const counts = new Map();
  ratings.forEach((r) => counts.set(r.drinkType, (counts.get(r.drinkType) || 0) + 1));
  let best = null;
  let max = 0;
  counts.forEach((n, id) => {
    if (n > max) { max = n; best = id; }
  });
  const hit = DRINK_TYPES.find((d) => d.id === best);
  if (hit) return hit.label;
  if (!best) return "";
  return best.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function topPicks(bags) {
  const ranked = bags
    .map((b) => {
      const list = b.ratings ?? [];
      const avg = list.length ? list.reduce((s, r) => s + (Number(r.rating) || 0), 0) / list.length : 0;
      return { bag: b, avg, count: list.length };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.avg - a.avg);

  const section = document.createElement("section");
  section.className = "panel";
  section.innerHTML = `<h2>Top picks</h2>`;

  if (!ranked.length) {
    section.innerHTML += `<p class="panel-empty">No ratings yet.</p>`;
    return section;
  }

  const list = document.createElement("ol");
  list.className = "menu-list";
  ranked.slice(0, 5).forEach((r, i) => {
    const filled = Math.round(r.avg);
    let dots = "";
    for (let k = 1; k <= 5; k++) {
      dots += `<span class="dot${k <= filled ? " on" : ""}"></span>`;
    }
    const li = document.createElement("li");
    li.className = "menu-row";
    li.innerHTML = `
      <span class="menu-numeral">${ROMAN[i] || i + 1}</span>
      <div class="menu-body">
        <h3>${escapeHtml(r.bag.brand || "Untitled")}</h3>
        <p>${r.bag.origin ? escapeHtml(r.bag.origin) : ""}${r.bag.origin && r.bag.roast ? " · " : ""}${r.bag.roast ? escapeHtml(r.bag.roast) : ""}</p>
      </div>
      <div class="menu-score">
        <span class="menu-dots">${dots}</span>
        <span class="menu-score-num">${r.avg.toFixed(1)}</span>
      </div>
    `;
    li.addEventListener("click", () => navigate(`/bag/${r.bag.id}`));
    list.appendChild(li);
  });
  section.appendChild(list);
  return section;
}

function financialView(bags) {
  const section = document.createElement("section");
  section.className = "panel";
  section.innerHTML = `<h2>Your spend</h2>`;

  const sym = bags.find((b) => b.currency)?.currency || "€";

  const enriched = bags.map((b) => {
    const price = Number(b.price);
    const weight = Number(b.weight);
    const dose = Number(b.dose) || 18;
    const perShot = price && weight ? (price * dose) / weight : null;
    const list = b.ratings ?? [];
    const avgRating = list.length
      ? list.reduce((s, r) => s + (Number(r.rating) || 0), 0) / list.length
      : null;
    return { bag: b, price, perShot, avgRating };
  });

  const totalSpent = enriched.reduce((s, x) => s + (x.price || 0), 0);
  const withShot = enriched.filter((x) => x.perShot != null);
  const avgPerShot = withShot.length
    ? withShot.reduce((s, x) => s + x.perShot, 0) / withShot.length
    : null;

  // ── Summary row ──
  const summary = document.createElement("div");
  summary.className = "spend-summary";
  summary.innerHTML = `
    <div class="spend-kv">
      <span class="spend-kv-val">${sym}${totalSpent.toFixed(2)}</span>
      <span class="spend-kv-label">Total spent</span>
    </div>
    <div class="spend-kv">
      <span class="spend-kv-val">${avgPerShot != null ? sym + avgPerShot.toFixed(2) : "—"}</span>
      <span class="spend-kv-label">Avg / shot</span>
    </div>
    <div class="spend-kv">
      <span class="spend-kv-val">${bags.filter((b) => b.finishedAt).length}</span>
      <span class="spend-kv-label">Bags finished</span>
    </div>
  `;
  section.appendChild(summary);

  if (!withShot.length) {
    const hint = document.createElement("p");
    hint.className = "panel-empty";
    hint.textContent = "Add price and weight to bags to see cost analysis.";
    section.appendChild(hint);
    return section;
  }

  // ── Cost-per-shot ladder (cheapest → priciest) ──
  const ladder = [...withShot].sort((a, b) => a.perShot - b.perShot);
  const maxCost = Math.max(...ladder.map((x) => x.perShot));
  const minCost = Math.min(...ladder.map((x) => x.perShot));

  // Best value = highest (avgRating / perShot), only bags that have both
  const withBoth = ladder.filter((x) => x.avgRating != null);
  const bestValue = withBoth.length
    ? withBoth.reduce((best, x) =>
        x.avgRating / x.perShot > best.avgRating / best.perShot ? x : best)
    : null;

  if (bestValue) {
    const callout = document.createElement("p");
    callout.className = "best-value-callout";
    callout.innerHTML = `
      <span class="best-value-star">✦</span>
      Best value: <strong>${escapeHtml(bestValue.bag.brand || "Untitled")}</strong>
      · ${bestValue.avgRating.toFixed(1)}★ at ${sym}${bestValue.perShot.toFixed(2)}/shot
    `;
    section.appendChild(callout);
  }

  const subTitle = document.createElement("p");
  subTitle.className = "spend-subtitle";
  subTitle.textContent = "Cost per shot — cheapest to priciest";
  section.appendChild(subTitle);

  const rows = document.createElement("div");
  rows.className = "cost-ladder";

  ladder.forEach(({ bag, perShot, avgRating }) => {
    const pct = maxCost > minCost
      ? 20 + ((perShot - minCost) / (maxCost - minCost)) * 80
      : 60;
    const isBest = bestValue && bag.id === bestValue.bag.id;
    const dotsHtml = avgRating != null ? miniDots(avgRating) : "";

    const row = document.createElement("div");
    row.className = "cost-row" + (isBest ? " best-value" : "");
    row.innerHTML = `
      <div class="cost-row-name">
        <span>${escapeHtml(bag.brand || "Untitled")}</span>
        ${dotsHtml ? `<span class="cost-row-dots">${dotsHtml}</span>` : ""}
      </div>
      <div class="cost-bar-wrap">
        <div class="cost-bar" style="width:${pct.toFixed(1)}%"></div>
      </div>
      <span class="cost-row-val">${sym}${perShot.toFixed(2)}</span>
      ${isBest ? `<span class="best-value-pip" title="Best value">✦</span>` : `<span></span>`}
    `;
    row.addEventListener("click", () => navigate(`/bag/${bag.id}`));
    rows.appendChild(row);
  });
  section.appendChild(rows);

  return section;
}

function miniDots(avg) {
  const filled = Math.round(avg);
  let out = `<span class="mini-dots">`;
  for (let i = 1; i <= 5; i++) out += `<span class="dot${i <= filled ? " on" : ""}"></span>`;
  out += `</span>`;
  return out;
}

// ── Taste profile spider chart ────────────────────────
//
// 6 axes, clockwise from top, each normalised 0–1:
//   Bright   — sour side of taste slider   (dial-in logs)
//   Dose     — input weight                (locked recipes)
//   Long     — extraction time             (locked recipes)
//   Bold     — bitter side of taste slider (dial-in logs)
//   Rich     — body/texture fullness       (dial-in logs)
//   Strength — shot concentration (ratio)  (locked recipes)

const SPIDER_AXES = [
  {
    key: "bright", label: "Bright",
    desc: "Sour, citrus, wine. Pulled from your taste slider sour readings.",
  },
  {
    key: "dose", label: "Dose",
    desc: "Average coffee input weight per shot, from locked recipes.",
  },
  {
    key: "long", label: "Long pull",
    desc: "Extraction time. Short = fast & punchy; long = slow & complex.",
  },
  {
    key: "bold", label: "Bold",
    desc: "Bitter, dark chocolate, intensity. Opposite of bright.",
  },
  {
    key: "rich", label: "Rich",
    desc: "Body and mouthfeel. Low = light & watery; high = thick & syrupy.",
  },
  {
    key: "strength", label: "Strength",
    desc: "Shot concentration via yield ratio. High = tight ristretto.",
  },
];

function tasteProfile(bags) {
  const section = document.createElement("section");
  section.className = "panel";
  section.innerHTML = `<h2>Your taste profile</h2>`;

  const allLogs = bags.flatMap((b) => (b.dialIns ?? []).map((l) => ({ ...l, bag: b })));
  const locked  = bags.filter((b) => b.dialedInAt && b.dialedInRecipe).map((b) => b.dialedInRecipe);

  if (!allLogs.length && !locked.length) {
    section.innerHTML += `<p class="panel-empty">Start dialing in bags to see your taste profile.</p>`;
    return section;
  }

  // ── Axis values ──────────────────────────────────────
  const tasteVals   = allLogs.map((l) => Number(l.taste)   || 0);
  const textureVals = allLogs.map((l) => Number(l.texture) || 0);
  const avgTaste    = tasteVals.length   ? tasteVals.reduce((a, b)   => a + b, 0) / tasteVals.length   : 0;
  const avgTexture  = textureVals.length ? textureVals.reduce((a, b) => a + b, 0) / textureVals.length : 0;

  const avgOf = (arr, fn) => arr.length ? arr.reduce((s, x) => s + (fn(x) || 0), 0) / arr.length : null;
  const avgDose  = avgOf(locked, (r) => Number(r.dose));
  const avgRatio = avgOf(
    locked.filter((r) => Number(r.dose) > 0 && Number(r.yield) > 0),
    (r) => Number(r.yield) / Number(r.dose)
  );
  const avgTime = avgOf(locked.filter((r) => Number(r.time) > 0), (r) => Number(r.time));

  const bright   = clamp(Math.max(0, -avgTaste) / 3, 0, 1);
  const bold     = clamp(Math.max(0, avgTaste)  / 3, 0, 1);
  const rich     = clamp((avgTexture + 3) / 6,        0, 1);
  const strength = avgRatio != null ? clamp(1 - (avgRatio - 1.5) / 2, 0, 1) : 0.5;
  const long     = avgTime  != null ? clamp((avgTime - 18) / 22,       0, 1) : 0.5;
  const dose     = avgDose  != null ? clamp((avgDose - 14) / 8,        0, 1) : 0.5;

  const values = { bright, bold, rich, strength, long, dose };

  // ── Build UI ─────────────────────────────────────────
  const wrap = document.createElement("div");
  wrap.className = "spider-wrap";

  const chartArea = document.createElement("div");
  chartArea.className = "spider-chart-area";
  chartArea.innerHTML = spiderSvg(values, SPIDER_AXES);
  wrap.appendChild(chartArea);

  wrap.appendChild(buildSpiderLegend(values, SPIDER_AXES));

  const parts = [];
  if (tasteVals.length)  parts.push(`${allLogs.length} dial-in log${allLogs.length === 1 ? "" : "s"}`);
  if (locked.length)     parts.push(`${locked.length} locked recipe${locked.length === 1 ? "" : "s"}`);
  const sub = document.createElement("p");
  sub.className = "spider-sub";
  sub.textContent = parts.length ? `Based on ${parts.join(" · ")}` : "Log dial-in attempts to sharpen the shape.";
  wrap.appendChild(sub);

  section.appendChild(wrap);
  return section;
}

function spiderSvg(values, axes) {
  const N  = axes.length;
  const cx = 100, cy = 100, R = 84;
  const rings = [0.33, 0.66, 1];

  const angle = (i) => (2 * Math.PI * i) / N - Math.PI / 2;
  const px = (i, t) => cx + t * R * Math.cos(angle(i));
  const py = (i, t) => cy + t * R * Math.sin(angle(i));

  const ringPaths = rings.map((t) => {
    const pts = axes.map((_, i) => `${px(i, t).toFixed(2)},${py(i, t).toFixed(2)}`).join(" ");
    return `<polygon points="${pts}" class="spider-ring"/>`;
  }).join("\n");

  const spokes = axes.map((_, i) =>
    `<line x1="${cx}" y1="${cy}" x2="${px(i, 1).toFixed(2)}" y2="${py(i, 1).toFixed(2)}" class="spider-spoke"/>`
  ).join("\n");

  const dataPts = axes.map(({ key }, i) =>
    `${px(i, values[key]).toFixed(2)},${py(i, values[key]).toFixed(2)}`
  ).join(" ");

  const dots = axes.map(({ key }, i) => {
    const v = values[key];
    return `<circle cx="${px(i, v).toFixed(2)}" cy="${py(i, v).toFixed(2)}" r="4.5" class="spider-dot"/>`;
  }).join("\n");

  return `
    <svg viewBox="0 0 200 200" class="spider-svg" role="img" aria-label="Taste profile radar chart">
      <defs>
        <radialGradient id="spider-fill-grad" cx="50%" cy="50%">
          <stop offset="0%"   stop-color="var(--accent)" stop-opacity="0.38"/>
          <stop offset="100%" stop-color="var(--crema)"  stop-opacity="0.12"/>
        </radialGradient>
      </defs>
      ${ringPaths}
      ${spokes}
      <polygon points="${dataPts}" class="spider-area"/>
      <polygon points="${dataPts}" class="spider-border"/>
      ${dots}
    </svg>
  `;
}

function buildSpiderLegend(values, axes) {
  const legend = document.createElement("div");
  legend.className = "spider-legend";

  axes.forEach(({ key, label, desc }) => {
    const pct = Math.round(values[key] * 100);
    const item = document.createElement("div");
    item.className = "spider-legend-item";
    item.innerHTML = `
      <div class="spider-axis-head">
        <span class="spider-axis-name">${label}</span>
        <span class="spider-axis-pct">${pct}%</span>
      </div>
      <div class="spider-axis-bar-wrap">
        <div class="spider-axis-bar" style="width:${pct}%"></div>
      </div>
      <p class="spider-axis-desc">${desc}</p>
    `;
    legend.appendChild(item);
  });

  return legend;
}

function timeline(ratings) {
  const section = document.createElement("section");
  section.className = "panel";
  section.innerHTML = `<h2>Last 30 days</h2>`;

  const today = startOfDay(new Date());
  const days = 30;
  const DAY = 24 * 60 * 60 * 1000;
  const counts = Array(days).fill(0);
  ratings.forEach((r) => {
    const ts = parseIsoDate(r.date) ?? r.updatedAt ?? r.createdAt;
    if (ts == null) return;
    const age = Math.floor((today - startOfDay(new Date(ts))) / DAY);
    if (age >= 0 && age < days) counts[days - 1 - age] += 1;
  });

  const max = Math.max(1, ...counts);
  const bars = document.createElement("div");
  bars.className = "pour-row";
  counts.forEach((c, i) => {
    const pct = (c / max) * 100;
    const bar = document.createElement("div");
    bar.className = "pour-col" + (c === 0 ? " empty" : "");
    bar.title = c ? `${c} rating${c === 1 ? "" : "s"}` : "—";
    bar.innerHTML = `<span class="pour-fill" style="height: ${Math.max(6, pct)}%"></span>`;
    bars.appendChild(bar);
  });

  section.appendChild(bars);
  const foot = document.createElement("p");
  foot.className = "timeline-foot";
  foot.textContent = `${ratings.length} total ratings`;
  section.appendChild(foot);
  return section;
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function parseIsoDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y) return null;
  return new Date(y, (m || 1) - 1, d || 1).getTime();
}

function formatPrice(value, currency) {
  const sym = currency || "€";
  return `${sym}${Number(value).toFixed(2)}`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
