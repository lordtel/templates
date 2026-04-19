import { subscribe, getBag, removeBrew, drinkLabel, DRINK_TYPES } from "../../core/store.js";
import { navigate } from "../../core/router.js";

export function render(container, params) {
  const bagId = params.id;
  container.innerHTML = "";

  const unsubscribe = subscribe(() => paint(container, bagId));
  return unsubscribe;
}

function paint(container, bagId) {
  const bag = getBag(bagId);
  container.innerHTML = "";

  if (!bag) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Bag not found</h2>
        <p>It may have been deleted.</p>
      </div>
    `;
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = "Back to bags";
    btn.addEventListener("click", () => navigate("/"));
    container.querySelector(".empty-state").appendChild(btn);
    return;
  }

  const back = document.createElement("button");
  back.type = "button";
  back.className = "back-btn";
  back.innerHTML = `<span aria-hidden="true">‹</span> Bags`;
  back.addEventListener("click", () => navigate("/"));
  container.appendChild(back);

  const hero = document.createElement("div");
  hero.className = "bag-hero";
  if (bag.photo) {
    hero.innerHTML = `<img src="${bag.photo}" alt="" />`;
  } else {
    hero.classList.add("no-photo");
    hero.innerHTML = `<span>${(bag.brand?.[0] ?? "☕").toUpperCase()}</span>`;
  }
  container.appendChild(hero);

  const info = document.createElement("section");
  info.className = "bag-info card";
  const priceStr = formatPrice(bag.price, bag.currency);
  const weightStr = bag.weight ? `${bag.weight} g` : "";
  const pillBits = [bag.roast, bag.process, bag.variety]
    .filter(Boolean)
    .map((v) => `<span class="pill">${escapeHtml(v)}</span>`)
    .join(" ");
  info.innerHTML = `
    <h1>${escapeHtml(bag.brand || "Untitled")}</h1>
    ${bag.origin ? `<p class="bag-origin">${escapeHtml(bag.origin)}${bag.altitude ? " · " + escapeHtml(bag.altitude) : ""}</p>` : ""}
    ${pillBits ? `<div class="pill-row">${pillBits}</div>` : ""}
    ${bag.notes ? `<p class="bag-notes">${escapeHtml(bag.notes)}</p>` : ""}
    <dl class="kv">
      ${priceStr ? `<div><dt>Price</dt><dd>${priceStr}</dd></div>` : ""}
      ${weightStr ? `<div><dt>Weight</dt><dd>${weightStr}</dd></div>` : ""}
      ${priceStr && weightStr ? `<div><dt>€/g</dt><dd>${(bag.price / bag.weight).toFixed(3)}</dd></div>` : ""}
    </dl>
    <div class="info-actions">
      <button class="btn ghost small" id="edit-btn">Edit</button>
    </div>
  `;
  container.appendChild(info);

  info.querySelector("#edit-btn").addEventListener("click", () => navigate(`/bag/${bag.id}/edit`));

  const brewsHead = document.createElement("div");
  brewsHead.className = "page-head brews-head";
  brewsHead.innerHTML = `<h2>Brews</h2>`;
  const addBrew = document.createElement("button");
  addBrew.className = "btn small";
  addBrew.textContent = "+ Log brew";
  addBrew.addEventListener("click", () => navigate(`/bag/${bag.id}/brew`));
  brewsHead.appendChild(addBrew);
  container.appendChild(brewsHead);

  const byType = groupBy((bag.brews ?? []), "drinkType");
  const summary = document.createElement("section");
  summary.className = "drink-summary";
  summary.innerHTML = DRINK_TYPES.map((d) => {
    const list = byType[d.id] ?? [];
    const avg = list.length ? list.reduce((s, b) => s + Number(b.rating || 0), 0) / list.length : 0;
    return `
      <div class="drink-card">
        <p class="eyebrow">${d.label}</p>
        <p class="drink-score">${avg ? avg.toFixed(1) : "—"}</p>
        <p class="drink-sub">${list.length} ${list.length === 1 ? "brew" : "brews"}</p>
      </div>
    `;
  }).join("");
  container.appendChild(summary);

  const list = document.createElement("section");
  list.className = "brews-list";
  if (!(bag.brews ?? []).length) {
    list.innerHTML = `
      <div class="empty-state">
        <h2>No brews yet</h2>
        <p>Log your first pull with this bag.</p>
      </div>
    `;
  } else {
    bag.brews.forEach((brew) => list.appendChild(buildBrew(bag.id, brew)));
  }
  container.appendChild(list);
}

function buildBrew(bagId, brew) {
  const row = document.createElement("article");
  row.className = "brew-row";
  const date = new Date(brew.createdAt);
  const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  row.innerHTML = `
    <header>
      <div>
        <h3>${drinkLabel(brew.drinkType)}</h3>
        <p class="brew-sub">${escapeHtml(dateStr)}${brew.grindSize ? " · grind " + escapeHtml(String(brew.grindSize)) : ""}${brew.doseGrams ? " · " + escapeHtml(String(brew.doseGrams)) + "g" : ""}</p>
      </div>
      <div class="brew-rating" aria-label="Rating ${brew.rating} of 5">${ratingDots(brew.rating)}</div>
    </header>
    ${brew.notes ? `<p class="brew-notes">${escapeHtml(brew.notes)}</p>` : ""}
    <button class="brew-del" aria-label="Remove brew" data-id="${brew.id}">×</button>
  `;
  row.querySelector(".brew-del").addEventListener("click", (e) => {
    e.stopPropagation();
    if (confirm("Remove this brew?")) removeBrew(bagId, brew.id);
  });
  return row;
}

function ratingDots(r) {
  const n = Number(r) || 0;
  let out = "";
  for (let i = 1; i <= 5; i++) out += `<span class="dot${i <= n ? " on" : ""}"></span>`;
  return out;
}

function groupBy(arr, key) {
  return arr.reduce((acc, x) => {
    const k = x[key];
    (acc[k] = acc[k] ?? []).push(x);
    return acc;
  }, {});
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
