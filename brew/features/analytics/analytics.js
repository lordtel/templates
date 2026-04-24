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
  container.appendChild(grindSweetSpot(ratings));
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

  return section;
}

function miniDots(avg) {
  const filled = Math.round(avg);
  let out = `<span class="mini-dots">`;
  for (let i = 1; i <= 5; i++) out += `<span class="dot${i <= filled ? " on" : ""}"></span>`;
  out += `</span>`;
  return out;
}

function grindSweetSpot(ratings) {
  const section = document.createElement("section");
  section.className = "panel";
  section.innerHTML = `<h2>The dial</h2>`;

  if (!ratings.length) {
    section.innerHTML += `<p class="panel-empty">No ratings yet.</p>`;
    return section;
  }

  const grid = document.createElement("div");
  grid.className = "dial-grid";

  DRINK_TYPES.forEach((d) => {
    const list = ratings.filter((r) => r.drinkType === d.id && r.grindSize != null && r.rating);
    if (!list.length) {
      grid.appendChild(dialSvg(d.label, null));
      return;
    }
    const weighted = list.reduce((s, r) => s + r.grindSize * r.rating, 0);
    const totalR = list.reduce((s, r) => s + Number(r.rating), 0);
    const bestGrind = weighted / totalR;
    grid.appendChild(dialSvg(d.label, bestGrind, list.length));
  });

  section.appendChild(grid);
  return section;
}

function dialSvg(label, bestGrind, sampleSize) {
  const wrap = document.createElement("div");
  wrap.className = "dial-tile" + (bestGrind == null ? " muted" : "");

  const w = 120;
  const h = 84;
  const cx = w / 2;
  const cy = 72;
  const r = 48;

  const startA = Math.PI;
  const endA = 0;
  const ax = cx + r * Math.cos(startA);
  const ay = cy + r * Math.sin(startA);
  const bx = cx + r * Math.cos(endA);
  const by = cy + r * Math.sin(endA);

  let marker = "";
  let value = "—";
  let hint = "not enough data";

  if (bestGrind != null) {
    const t = clamp((bestGrind - 1) / 29, 0, 1);
    const ang = Math.PI - t * Math.PI;
    const mx = cx + r * Math.cos(ang);
    const my = cy + r * Math.sin(ang);
    marker = `
      <circle cx="${mx.toFixed(2)}" cy="${my.toFixed(2)}" r="8" fill="url(#crema-glow-${label.replace(/\s/g, "-")})" opacity="0.55"/>
      <circle cx="${mx.toFixed(2)}" cy="${my.toFixed(2)}" r="4.5" fill="var(--accent)" stroke="var(--surface-solid)" stroke-width="2"/>
    `;
    value = bestGrind.toFixed(1);
    hint = `${sampleSize} rating${sampleSize === 1 ? "" : "s"}`;
  }

  wrap.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" class="dial-svg" role="img" aria-label="${label} grind dial">
      <defs>
        <linearGradient id="dial-track-${label.replace(/\s/g, "-")}" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="var(--accent)" stop-opacity="0.45"/>
          <stop offset="0.55" stop-color="var(--crema)" stop-opacity="0.7"/>
          <stop offset="1" stop-color="var(--line-strong)"/>
        </linearGradient>
        <radialGradient id="crema-glow-${label.replace(/\s/g, "-")}">
          <stop offset="0" stop-color="var(--crema)" stop-opacity="0.9"/>
          <stop offset="1" stop-color="var(--crema)" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <path d="M ${ax.toFixed(2)} ${ay.toFixed(2)} A ${r} ${r} 0 0 1 ${bx.toFixed(2)} ${by.toFixed(2)}"
        fill="none" stroke="url(#dial-track-${label.replace(/\s/g, "-")})" stroke-width="6" stroke-linecap="round"/>
      ${marker}
      <text x="${cx}" y="${cy - 6}" text-anchor="middle" class="dial-value">${value}</text>
    </svg>
    <p class="dial-label">${label}</p>
    <p class="dial-hint">${hint}</p>
  `;
  return wrap;
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
