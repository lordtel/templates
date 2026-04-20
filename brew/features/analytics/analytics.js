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
  container.appendChild(drinkBreakdown(ratings));
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

function drinkBreakdown(ratings) {
  const section = document.createElement("section");
  section.className = "panel";
  section.innerHTML = `<h2>By drink</h2>`;

  const byType = DRINK_TYPES.map((d) => {
    const list = ratings.filter((r) => r.drinkType === d.id);
    const avg = list.length
      ? list.reduce((s, r) => s + (Number(r.rating) || 0), 0) / list.length
      : 0;
    return { label: d.label, count: list.length, avg };
  });

  const maxCount = Math.max(1, ...byType.map((x) => x.count));

  const rows = document.createElement("div");
  rows.className = "drink-rows";
  rows.innerHTML = byType.map((x) => `
    <div class="drink-line">
      <span class="drink-line-label">${x.label}</span>
      <div class="drink-bar"><span style="width: ${(x.count / maxCount) * 100}%"></span></div>
      <span class="drink-line-val">${x.avg ? x.avg.toFixed(1) : "—"} · ${x.count}</span>
    </div>
  `).join("");
  section.appendChild(rows);
  return section;
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
