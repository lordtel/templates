import { subscribe, DRINK_TYPES, drinkLabel, getEquipment } from "../../core/store.js";
import { navigate } from "../../core/router.js";

let currentFilter = "active";

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

  const tabs = document.createElement("div");
  tabs.className = "shelf-tabs";
  tabs.setAttribute("role", "tablist");
  container.appendChild(tabs);

  const listEl = document.createElement("div");
  listEl.className = "bags";
  container.appendChild(listEl);

  const unsubscribe = subscribe((state) => paint(tabs, listEl, state.bags));
  return unsubscribe;
}

function paint(tabsEl, listEl, bags) {
  const active = bags.filter((b) => !b.finishedAt);
  const finished = bags.filter((b) => b.finishedAt);

  paintTabs(tabsEl, listEl, bags, active.length, finished.length);

  const shown = currentFilter === "finished" ? finished : active;
  listEl.innerHTML = "";

  if (bags.length === 0) {
    renderWelcome(listEl);
    return;
  }

  if (shown.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state shelf-empty";
    if (currentFilter === "finished") {
      empty.innerHTML = `
        <h2>No finished bags yet</h2>
        <p>When you polish off a bag, mark it as finished from its page. It'll move here so your history stays intact without cluttering your shelf.</p>
      `;
    } else {
      empty.innerHTML = `
        <h2>Shelf is empty</h2>
        <p>All your bags are archived. Add a new one or browse what you've had before.</p>
      `;
      const actions = document.createElement("div");
      actions.className = "empty-actions";
      const addBtn = document.createElement("button");
      addBtn.className = "btn";
      addBtn.textContent = "+ Add bag";
      addBtn.addEventListener("click", () => navigate("/bag/new"));
      actions.appendChild(addBtn);
      empty.appendChild(actions);
    }
    listEl.appendChild(empty);
    return;
  }

  shown.forEach((bag) => listEl.appendChild(buildCard(bag)));
}

function paintTabs(tabsEl, listEl, bags, activeCount, finishedCount) {
  if (bags.length === 0) {
    tabsEl.innerHTML = "";
    return;
  }
  tabsEl.innerHTML = `
    <button type="button" class="shelf-tab${currentFilter === "active" ? " on" : ""}" data-filter="active" role="tab" aria-selected="${currentFilter === "active"}">
      Active <span class="shelf-tab-count">${activeCount}</span>
    </button>
    <button type="button" class="shelf-tab${currentFilter === "finished" ? " on" : ""}" data-filter="finished" role="tab" aria-selected="${currentFilter === "finished"}">
      Finished <span class="shelf-tab-count">${finishedCount}</span>
    </button>
  `;
  tabsEl.querySelectorAll(".shelf-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      if (f === currentFilter) return;
      currentFilter = f;
      paint(tabsEl, listEl, bags);
    });
  });
}

function renderWelcome(listEl) {
  const eq = getEquipment();
  const hasGear = !!(eq?.machine?.id || eq?.grinder?.id);
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.innerHTML = `
    <h2>Welcome to Crema</h2>
    <p>Snap a bag, rate your brews, get grind suggestions based on your history.</p>
    ${hasGear ? "" : `<p class="empty-hint">Tip — set your grinder first so suggestions match your setup.</p>`}
  `;
  const actions = document.createElement("div");
  actions.className = "empty-actions";
  if (!hasGear) {
    const gearBtn = document.createElement("button");
    gearBtn.className = "btn ghost";
    gearBtn.textContent = "Set up gear";
    gearBtn.addEventListener("click", () => navigate("/equipment"));
    actions.appendChild(gearBtn);
  }
  const addBtn = document.createElement("button");
  addBtn.className = "btn";
  addBtn.textContent = "Add your first bag →";
  addBtn.addEventListener("click", () => navigate("/bag/new"));
  actions.appendChild(addBtn);
  empty.appendChild(actions);
  listEl.appendChild(empty);
}

function buildCard(bag) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "bag-card" + (bag.finishedAt ? " finished" : "");
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
  const avg = avgRating(ratings);
  const roast = bag.roast ? `<span class="pill">${escapeHtml(bag.roast)}</span>` : "";
  const per250 = pricePer250g(bag);
  const perCup = pricePerEspresso(bag);
  const finishedBadge = bag.finishedAt
    ? `<span class="finished-badge">Finished ${formatFinishedDate(bag.finishedAt)}</span>`
    : "";

  meta.innerHTML = `
    <h3>${escapeHtml(brand)}</h3>
    <p class="bag-sub">${escapeHtml(origin ? origin.slice(3) : "—")}${bag.process ? " · " + escapeHtml(bag.process) : ""}</p>
    <div class="bag-row">
      ${roast}
      <span class="bag-dots" aria-label="Average rating ${avg ? avg.toFixed(1) : 'none'}">${ratingDots(avg)}</span>
      ${finishedBadge || (per250 ? `<span class="bag-price">${per250} / 250g</span>` : "")}
      ${finishedBadge ? "" : (perCup ? `<span class="bag-price muted">${perCup} / shot</span>` : "")}
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

function pricePer250g(bag) {
  const p = Number(bag.price);
  const w = Number(bag.weight);
  if (!p || !w) return "";
  const sym = bag.currency || "€";
  return `${sym}${((p / w) * 250).toFixed(2)}`;
}

function pricePerEspresso(bag) {
  const p = Number(bag.price);
  const w = Number(bag.weight);
  const dose = Number(bag.dose);
  if (!p || !w || !dose) return "";
  const sym = bag.currency || "€";
  return `${sym}${((p / w) * dose).toFixed(2)}`;
}

function formatFinishedDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
