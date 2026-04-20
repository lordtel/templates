import { subscribe, getBag, drinkLabel, DRINK_TYPES, slugifyDrink, markFinished, markActive } from "../../core/store.js";
import { suggestForDrink } from "../../core/dial-in.js";
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
  info.className = "bag-info card" + (bag.finishedAt ? " finished" : "");
  const per250 = pricePer250g(bag);
  const perCup = pricePerEspresso(bag);
  const pillBits = [bag.roast, bag.process, bag.variety]
    .filter(Boolean)
    .map((v) => `<span class="pill">${escapeHtml(v)}</span>`)
    .join(" ");
  const finishedBanner = bag.finishedAt
    ? `<p class="finished-banner"><span class="finished-dot" aria-hidden="true"></span>Finished ${formatFullDate(bag.finishedAt)}</p>`
    : "";
  const statusBtn = bag.finishedAt
    ? `<button class="btn ghost small" id="status-btn">Move to active</button>`
    : `<button class="btn ghost small" id="status-btn">Mark finished</button>`;
  info.innerHTML = `
    ${finishedBanner}
    <h1>${escapeHtml(bag.brand || "Untitled")}</h1>
    ${bag.origin ? `<p class="bag-origin">${escapeHtml(bag.origin)}${bag.altitude ? " · " + escapeHtml(bag.altitude) : ""}</p>` : ""}
    ${pillBits ? `<div class="pill-row">${pillBits}</div>` : ""}
    ${bag.notes ? `<p class="bag-notes">${escapeHtml(bag.notes)}</p>` : ""}
    <dl class="kv">
      ${per250 ? `<div><dt>Price / 250g</dt><dd>${per250}</dd></div>` : ""}
      ${perCup ? `<div><dt>Price / shot</dt><dd>${perCup}</dd></div>` : ""}
    </dl>
    <div class="info-actions">
      ${statusBtn}
      <button class="btn ghost small" id="edit-btn">Edit</button>
    </div>
  `;
  container.appendChild(info);

  info.querySelector("#edit-btn").addEventListener("click", () => navigate(`/bag/${bag.id}/edit`));
  info.querySelector("#status-btn").addEventListener("click", () => {
    if (bag.finishedAt) {
      markActive(bag.id);
    } else {
      markFinished(bag.id);
    }
  });

  container.appendChild(buildDialInSection(bag));

  const ratingsHead = document.createElement("div");
  ratingsHead.className = "page-head ratings-head";
  ratingsHead.innerHTML = `<h2>How it performed</h2>`;
  container.appendChild(ratingsHead);

  const ratings = bag.ratings ?? [];
  const byDrink = new Map(ratings.map((r) => [r.drinkType, r]));

  const defaultIds = new Set(DRINK_TYPES.map((d) => d.id));
  const customDrinks = ratings
    .filter((r) => !defaultIds.has(r.drinkType))
    .map((r) => ({ id: r.drinkType, label: drinkLabel(r.drinkType) }));

  const allDrinks = [...DRINK_TYPES, ...customDrinks];

  const slots = document.createElement("section");
  slots.className = "rating-slots";
  allDrinks.forEach((d) => {
    const r = byDrink.get(d.id);
    const hint = r ? null : suggestForDrink(d.id, bag);
    slots.appendChild(buildSlot(bag.id, d, r, hint));
  });
  container.appendChild(slots);

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "btn ghost small add-drink";
  addBtn.textContent = "+ Add another drink";
  addBtn.addEventListener("click", () => {
    const name = prompt("What drink did you brew?\n(e.g. Flat white, Cortado, V60)");
    if (!name) return;
    const slug = slugifyDrink(name);
    if (!slug) return;
    navigate(`/bag/${bag.id}/rate/${slug}`);
  });
  container.appendChild(addBtn);
}

function buildSlot(bagId, drink, rating, hint) {
  const slot = document.createElement("button");
  slot.type = "button";
  slot.className = "rating-slot" + (rating ? " filled" : " empty");
  slot.addEventListener("click", () => navigate(`/bag/${bagId}/rate/${drink.id}`));

  if (!rating) {
    const hintText = hint
      ? (hint.hasData
          ? `Try ${formatHintGrind(hint)} · from ${hint.sampleSize} rating${hint.sampleSize === 1 ? "" : "s"}`
          : `Try ${formatHintGrind(hint)} to start`)
      : "Not rated yet";
    slot.innerHTML = `
      <div class="slot-head">
        <h3>${drink.label}</h3>
        <span class="slot-action">Rate</span>
      </div>
      <p class="slot-empty">${hintText}</p>
    `;
    return slot;
  }

  const dateStr = formatDate(rating.date);
  const grindStr = rating.grindSize != null ? `Grind ${rating.grindSize}` : "";
  slot.innerHTML = `
    <div class="slot-head">
      <h3>${drink.label}</h3>
      <span class="slot-stars" aria-label="${rating.rating} of 5">${starRow(rating.rating)}</span>
    </div>
    <p class="slot-meta">${[dateStr, grindStr].filter(Boolean).join(" · ")}</p>
    ${rating.notes ? `<p class="slot-notes">${escapeHtml(rating.notes)}</p>` : ""}
  `;
  return slot;
}

function formatHintGrind(hint) {
  const scale = hint?.grinder?.scale;
  const decimals = scale?.step && scale.step < 1
    ? Math.max(0, -Math.floor(Math.log10(scale.step)))
    : 0;
  const num = Number(hint.grind).toFixed(decimals);
  const unit = scale?.unit ? " " + scale.unit + (Number(hint.grind) === 1 ? "" : "s") : "";
  return `grind ${num}${unit}`;
}

function starRow(n) {
  const r = Number(n) || 0;
  let out = "";
  for (let i = 1; i <= 5; i++) out += `<span class="dot${i <= r ? " on" : ""}"></span>`;
  return out;
}

function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y) return "";
  const date = new Date(y, (m || 1) - 1, d || 1);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatFullDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function buildDialInSection(bag) {
  const section = document.createElement("section");
  section.className = "dial-in-section card";
  const dialed = bag.dialedInAt && bag.dialedInRecipe;
  const attempts = bag.dialIns?.length ?? 0;

  const badge = dialed
    ? `<span class="dialed-badge">Dialed in</span>`
    : attempts > 0
      ? `<span class="dialed-badge pending">${attempts} attempt${attempts === 1 ? "" : "s"}</span>`
      : "";

  const btnLabel = dialed
    ? "Log another attempt"
    : attempts > 0
      ? "Continue dialing"
      : "Start dial-in →";

  const body = dialed
    ? buildDialInStats(bag.dialedInRecipe)
    : `<p class="dial-in-section-sub">${
        attempts > 0
          ? `${attempts} attempt${attempts === 1 ? "" : "s"} logged — mark one as dialed in when you're happy.`
          : "Log your first pull to start tuning the recipe."
      }</p>`;

  section.innerHTML = `
    <div class="dial-in-section-top">
      <p class="eyebrow">Dial-in</p>
      ${badge}
    </div>
    ${body}
    <button type="button" class="btn small dial-in-section-btn" id="dial-in-btn">${btnLabel}</button>
  `;

  section.querySelector("#dial-in-btn").addEventListener("click", () => {
    navigate(`/bag/${bag.id}/dial-in`);
  });

  return section;
}

function buildDialInStats(r) {
  const stats = [];
  if (r.dose != null) stats.push({ label: "Dose", value: `${r.dose}g` });
  if (r.yield != null) stats.push({ label: "Yield", value: `${r.yield}g` });
  if (r.dose && r.yield) stats.push({ label: "Ratio", value: `1:${(Number(r.yield) / Number(r.dose)).toFixed(2)}` });
  if (r.time != null) stats.push({ label: "Time", value: `${r.time}s` });
  if (r.grind != null) stats.push({ label: "Grind", value: String(r.grind) });
  if (!stats.length) return `<p class="dial-in-section-sub">Recipe saved.</p>`;
  return `<dl class="dial-in-stats">${stats.map((s) => `<div><dt>${s.label}</dt><dd>${s.value}</dd></div>`).join("")}</dl>`;
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
  return `${sym}${((p / w) * dose).toFixed(2)} · ${dose}g`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
