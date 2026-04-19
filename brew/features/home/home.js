import { subscribe, DRINK_TYPES, drinkLabel } from "../../core/store.js";
import { navigate } from "../../core/router.js";

export function render(container) {
  container.innerHTML = "";

  const head = document.createElement("div");
  head.className = "page-head";
  head.innerHTML = `
    <div>
      <p class="eyebrow">Your shelf</p>
      <h1>Coffee bags</h1>
    </div>
  `;
  const action = document.createElement("button");
  action.className = "btn small";
  action.textContent = "+ Add bag";
  action.addEventListener("click", () => navigate("/bag/new"));
  head.appendChild(action);
  container.appendChild(head);

  const listEl = document.createElement("div");
  listEl.className = "bags";
  container.appendChild(listEl);

  const unsubscribe = subscribe((state) => paint(listEl, state.bags));
  return unsubscribe;
}

function paint(listEl, bags) {
  listEl.innerHTML = "";
  if (bags.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <h2>No bags yet</h2>
      <p>Snap a photo of your next bag to get started.</p>
    `;
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "Add your first bag";
    btn.addEventListener("click", () => navigate("/bag/new"));
    empty.appendChild(btn);
    listEl.appendChild(empty);
    return;
  }

  bags.forEach((bag) => listEl.appendChild(buildCard(bag)));
}

function buildCard(bag) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "bag-card";
  card.addEventListener("click", () => navigate(`/bag/${bag.id}`));

  const thumb = document.createElement("div");
  thumb.className = "bag-thumb";
  if (bag.photo) {
    const img = document.createElement("img");
    img.src = bag.photo;
    img.alt = "";
    thumb.appendChild(img);
  } else {
    thumb.classList.add("no-photo");
    thumb.textContent = bag.brand?.[0]?.toUpperCase() ?? "☕";
  }

  const meta = document.createElement("div");
  meta.className = "bag-meta";
  const brand = bag.brand || "Untitled bag";
  const origin = bag.origin ? ` · ${bag.origin}` : "";
  const brewCount = (bag.brews ?? []).length;
  const avg = avgRating(bag.brews ?? []);
  const roast = bag.roast ? `<span class="pill">${escapeHtml(bag.roast)}</span>` : "";
  const priceBit = formatPrice(bag.price, bag.currency);

  meta.innerHTML = `
    <h3>${escapeHtml(brand)}</h3>
    <p class="bag-sub">${escapeHtml(origin ? origin.slice(3) : "—")}${bag.process ? " · " + escapeHtml(bag.process) : ""}</p>
    <div class="bag-row">
      ${roast}
      <span class="bag-dots" aria-label="Average rating ${avg ? avg.toFixed(1) : 'none'}">${ratingDots(avg)}</span>
      <span class="bag-count">${brewCount} ${brewCount === 1 ? "brew" : "brews"}</span>
      ${priceBit ? `<span class="bag-price">${priceBit}</span>` : ""}
    </div>
  `;

  card.append(thumb, meta);
  return card;
}

function avgRating(brews) {
  if (!brews.length) return 0;
  const sum = brews.reduce((s, b) => s + (Number(b.rating) || 0), 0);
  return sum / brews.length;
}

function ratingDots(avg) {
  if (!avg) return `<span class="dots muted">— — — — —</span>`;
  const filled = Math.round(avg);
  let out = `<span class="dots">`;
  for (let i = 1; i <= 5; i++) {
    out += `<span class="dot${i <= filled ? " on" : ""}"></span>`;
  }
  out += `</span>`;
  return out;
}

function formatPrice(price, currency) {
  if (price == null || price === "") return "";
  const sym = currency || "€";
  return `${sym}${Number(price).toFixed(2)}`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
