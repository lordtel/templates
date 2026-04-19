import { subscribe, allRatings, DRINK_TYPES } from "../../core/store.js";
import { navigate } from "../../core/router.js";

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
      <h1>Analytics</h1>
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

  container.appendChild(totalsGrid(bags, ratings));
  container.appendChild(drinkBreakdown(ratings));
  container.appendChild(bagRanking(bags));
  container.appendChild(grindSweetSpot(ratings));
  container.appendChild(timeline(ratings));
}

function totalsGrid(bags, ratings) {
  const totalSpent = bags.reduce((s, b) => s + (Number(b.price) || 0), 0);
  const totalRatings = ratings.length;
  const avgRating = totalRatings
    ? ratings.reduce((s, r) => s + (Number(r.rating) || 0), 0) / totalRatings
    : 0;
  const ratedBags = bags.filter((b) => (b.ratings ?? []).length).length;

  const grid = document.createElement("section");
  grid.className = "stats-grid";
  grid.innerHTML = `
    ${statCard("Bags", bags.length, "")}
    ${statCard("Rated", ratedBags, ratedBags ? "bags" : "")}
    ${statCard("Ratings", totalRatings, "")}
    ${statCard("Spent", formatPrice(totalSpent), "")}
    ${statCard("Avg rating", avgRating ? avgRating.toFixed(2) : "—", avgRating ? "of 5" : "")}
  `;
  return grid;
}

function statCard(label, value, sub) {
  return `
    <div class="stat-card">
      <p class="stat-label">${label}</p>
      <p class="stat-value">${value}</p>
      ${sub ? `<p class="stat-sub">${sub}</p>` : ""}
    </div>
  `;
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

function bagRanking(bags) {
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
  section.innerHTML = `<h2>Best bags</h2>`;

  if (!ranked.length) {
    section.innerHTML += `<p class="panel-empty">No ratings yet.</p>`;
    return section;
  }

  const list = document.createElement("ol");
  list.className = "rank-list";
  ranked.slice(0, 6).forEach((r, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="rank-num">${i + 1}</span>
      <div class="rank-meta">
        <h3>${escapeHtml(r.bag.brand || "Untitled")}</h3>
        <p>${r.bag.origin ? escapeHtml(r.bag.origin) + " · " : ""}${r.count}/4 drinks rated</p>
      </div>
      <span class="rank-score">${r.avg.toFixed(1)}</span>
    `;
    li.addEventListener("click", () => navigate(`/bag/${r.bag.id}`));
    list.appendChild(li);
  });
  section.appendChild(list);
  return section;
}

function grindSweetSpot(ratings) {
  const section = document.createElement("section");
  section.className = "panel";
  section.innerHTML = `<h2>Grind sweet spot</h2>`;

  if (!ratings.length) {
    section.innerHTML += `<p class="panel-empty">No ratings yet.</p>`;
    return section;
  }

  const rows = document.createElement("div");
  rows.className = "drink-rows";
  DRINK_TYPES.forEach((d) => {
    const list = ratings.filter((r) => r.drinkType === d.id && r.grindSize != null && r.rating);
    if (!list.length) {
      rows.innerHTML += `
        <div class="drink-line muted">
          <span class="drink-line-label">${d.label}</span>
          <div class="drink-bar"></div>
          <span class="drink-line-val">—</span>
        </div>`;
      return;
    }
    const weighted = list.reduce((s, r) => s + r.grindSize * r.rating, 0);
    const totalR = list.reduce((s, r) => s + Number(r.rating), 0);
    const bestGrind = weighted / totalR;
    const minG = Math.min(...list.map((r) => r.grindSize));
    const maxG = Math.max(...list.map((r) => r.grindSize));
    const pct = ((bestGrind - 1) / 29) * 100;
    rows.innerHTML += `
      <div class="drink-line">
        <span class="drink-line-label">${d.label}</span>
        <div class="grind-track"><span class="grind-marker" style="left: ${pct}%"></span></div>
        <span class="drink-line-val">${bestGrind.toFixed(1)}${minG !== maxG ? ` (${minG}–${maxG})` : ""}</span>
      </div>`;
  });
  section.appendChild(rows);
  return section;
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
  const w = 560;
  const h = 100;
  const stepX = w / (days - 1);
  const points = counts
    .map((c, i) => `${(i * stepX).toFixed(1)},${(h - (c / max) * (h - 8) - 4).toFixed(1)}`)
    .join(" ");

  section.innerHTML += `
    <svg class="timeline" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Rating timeline, last 30 days">
      <polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      ${counts.map((c, i) => c > 0 ? `<circle cx="${(i * stepX).toFixed(1)}" cy="${(h - (c / max) * (h - 8) - 4).toFixed(1)}" r="2.2" fill="var(--accent)"/>` : "").join("")}
    </svg>
    <p class="timeline-foot">${ratings.length} total ratings</p>
  `;
  return section;
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
