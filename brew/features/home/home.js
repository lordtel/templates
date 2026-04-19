import { subscribe, DRINK_TYPES, drinkLabel, getEquipment } from "../../core/store.js";
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
    const eq = getEquipment();
    const hasGear = !!(eq?.machine?.id || eq?.grinder?.id);
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <h2>Welcome to Crema</h2>
      <p>Log each coffee bag once, rate how it brews as espresso, iced americano, iced latte and cappuccino, and get tuned grind suggestions over time. Everything stays on this device.</p>
      ${hasGear ? "" : `<p class="empty-hint">Tip — set your machine &amp; grinder first so suggestions match your setup.</p>`}
    `;
    const actions = document.createElement("div");
    actions.className = "empty-actions";
    if (!hasGear) {
      const gearBtn = document.createElement("button");
      gearBtn.className = "btn ghost";
      gearBtn.textContent = "Set up equipment";
      gearBtn.addEventListener("click", () => navigate("/equipment"));
      actions.appendChild(gearBtn);
    }
    const addBtn = document.createElement("button");
    addBtn.className = "btn";
    addBtn.textContent = "Add your first bag";
    addBtn.addEventListener("click", () => navigate("/bag/new"));
    actions.appendChild(addBtn);
    empty.appendChild(actions);
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
  const ratings = bag.ratings ?? [];
  const rated = ratings.length;
  const avg = avgRating(ratings);
  const roast = bag.roast ? `<span class="pill">${escapeHtml(bag.roast)}</span>` : "";
  const priceBit = formatPrice(bag.price, bag.currency);

  meta.innerHTML = `
    <h3>${escapeHtml(brand)}</h3>
    <p class="bag-sub">${escapeHtml(origin ? origin.slice(3) : "—")}${bag.process ? " · " + escapeHtml(bag.process) : ""}</p>
    <div class="bag-row">
      ${roast}
      <span class="bag-dots" aria-label="Average rating ${avg ? avg.toFixed(1) : 'none'}">${ratingDots(avg)}</span>
      <span class="bag-count">${rated}/4 rated</span>
      ${priceBit ? `<span class="bag-price">${priceBit}</span>` : ""}
    </div>
  `;

  card.append(thumb, meta);
  return card;
}

function avgRating(ratings) {
  if (!ratings.length) return 0;
  const sum = ratings.reduce((s, r) => s + (Number(r.rating) || 0), 0);
  return sum / ratings.length;
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
