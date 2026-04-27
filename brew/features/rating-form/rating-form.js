import { getBag, upsertRating, removeRating, getRating, drinkLabel, getDialedInRecipe } from "../../core/store.js";
import { suggestForDrink, getActiveGrinder } from "../../core/dial-in.js";
import { navigate } from "../../core/router.js";

const GENERIC_SCALE = { min: 1, max: 30, step: 1, unit: "" };

const GRIND_LABELS = [
  { max: 5, label: "Turkish" },
  { max: 12, label: "Espresso" },
  { max: 18, label: "Moka / AeroPress" },
  { max: 24, label: "V60 / Drip" },
  { max: 30, label: "French Press / Cold Brew" },
];

export function render(container, params) {
  const bag = getBag(params.id);
  const drinkType = params.drink;

  if (!bag || !drinkType) {
    container.innerHTML = `<div class="empty-state"><h2>Not found</h2></div>`;
    return;
  }

  const existing = getRating(bag.id, drinkType);
  const dialedIn = drinkType === "espresso" ? getDialedInRecipe(bag.id) : null;
  const suggestion = existing || dialedIn ? null : suggestForDrink(drinkType, bag);
  const grinder = getActiveGrinder();
  const scale = grinder?.scale ?? GENERIC_SCALE;
  const defaultGrind =
    (dialedIn?.grind != null ? Number(dialedIn.grind) : null) ??
    suggestion?.grind ??
    ((scale.min + scale.max) / 2);
  const state = {
    grindSize: existing?.grindSize ?? defaultGrind,
    rating: existing?.rating ?? 0,
    notes: existing?.notes ?? "",
    date: existing?.date ?? todayIso(),
  };

  container.innerHTML = `
    <button type="button" class="back-btn"><span aria-hidden="true">‹</span> ${escapeHtml(bag.brand || "Bag")}</button>

    <div class="page-head">
      <div>
        <p class="eyebrow">${existing ? "Edit rating" : "New rating"}</p>
        <h1>${drinkLabel(drinkType)}</h1>
      </div>
    </div>

    <div class="card rating-form">
      ${suggestion ? dialInBanner(suggestion) : ""}

      <div class="field">
        <label for="r-date">Date</label>
        <input type="date" id="r-date" value="${state.date}" max="${todayIso()}" />
      </div>

      <div class="field">
        <label for="grind">
          Grind size
          <span class="grind-tag" id="grind-tag">${grinder ? formatGrind(state.grindSize, scale) : grindLabel(state.grindSize)}</span>
        </label>
        <input type="range" id="grind" min="${scale.min}" max="${scale.max}" step="${scale.step}" value="${state.grindSize}" />
        <div class="grind-scale">
          <span>Fine (${scale.min})</span>
          ${grinder ? `<span>${grinder.brand} ${grinder.model}</span>` : `<span>Medium</span>`}
          <span>Coarse (${scale.max})</span>
        </div>
      </div>

      <div class="field">
        <label>Rating</label>
        <div class="rating" role="radiogroup" aria-label="Rate this drink">
          ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="star" data-rating="${n}" aria-label="${n} stars"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3l2.8 5.7 6.3.9-4.6 4.5 1.1 6.3L12 17.8 6.4 20.4l1.1-6.3L2.9 9.6l6.3-.9L12 3z"/></svg></button>`).join("")}
        </div>
      </div>

      <div class="field">
        <label for="r-notes">Notes</label>
        <textarea id="r-notes" placeholder="Bright, clean, slight acidity — dialed in nicely." maxlength="1000">${escapeHtml(state.notes)}</textarea>
      </div>

      <div class="form-actions">
        ${existing ? `<button class="btn danger small" type="button" id="delete-btn">Delete</button>` : ""}
        <div class="spacer"></div>
        <button class="btn ghost" type="button" id="cancel-btn">Cancel</button>
        <button class="btn" type="button" id="save-btn">${existing ? "Update" : "Save"}</button>
      </div>
    </div>
  `;

  bind(container, state, bag.id, drinkType, !!existing);
}

function bind(container, state, bagId, drinkType, isEdit) {
  const el = {
    back: container.querySelector(".back-btn"),
    date: container.querySelector("#r-date"),
    grind: container.querySelector("#grind"),
    grindTag: container.querySelector("#grind-tag"),
    stars: container.querySelectorAll(".star"),
    notes: container.querySelector("#r-notes"),
    save: container.querySelector("#save-btn"),
    cancel: container.querySelector("#cancel-btn"),
    del: container.querySelector("#delete-btn"),
  };

  el.back.addEventListener("click", () => navigate(`/bag/${bagId}`));
  el.cancel.addEventListener("click", () => navigate(`/bag/${bagId}`));

  el.date.addEventListener("change", () => {
    state.date = el.date.value || todayIso();
  });

  const grinder = getActiveGrinder();
  const scale = grinder?.scale ?? GENERIC_SCALE;
  el.grind.addEventListener("input", () => {
    state.grindSize = Number(el.grind.value);
    el.grindTag.textContent = grinder ? formatGrind(state.grindSize, scale) : grindLabel(state.grindSize);
  });

  el.stars.forEach((s) => {
    s.addEventListener("click", () => {
      state.rating = Number(s.dataset.rating);
      syncStars(el, state);
    });
  });

  if (el.del) {
    el.del.addEventListener("click", () => {
      if (confirm("Remove this rating?")) {
        removeRating(bagId, drinkType);
        navigate(`/bag/${bagId}`);
      }
    });
  }

  el.save.addEventListener("click", () => {
    state.notes = el.notes.value.trim();
    if (!state.rating) {
      el.stars[0].focus();
      return;
    }
    upsertRating(bagId, drinkType, { ...state });
    navigate(`/bag/${bagId}`);
  });

  syncStars(el, state);
}

function syncStars(el, state) {
  el.stars.forEach((s, i) => {
    s.classList.toggle("on", i < state.rating);
  });
}

function grindLabel(n) {
  return GRIND_LABELS.find((g) => n <= g.max)?.label ?? "";
}

function formatGrind(n, scale) {
  const decimals = scale?.step && scale.step < 1
    ? Math.max(0, -Math.floor(Math.log10(scale.step)))
    : 0;
  const num = Number(n).toFixed(decimals);
  const unit = scale?.unit ? " " + scale.unit + (Number(n) === 1 ? "" : "s") : "";
  return `${num}${unit}`;
}

function dialInBanner(s) {
  const icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/></svg>`;
  const grindText = formatGrind(s.grind, s.grinder?.scale);
  const title = s.hasData
    ? `Start at ${grindText}`
    : `Try ${grindText} to start`;
  const sub = s.hasData
    ? `Weighted from ${s.sampleSize} rating${s.sampleSize === 1 ? "" : "s"} ${s.scopeLabel} · avg ${s.avgRating.toFixed(1)}/5`
    : `${s.scopeLabel.charAt(0).toUpperCase() + s.scopeLabel.slice(1)} for ${s.drinkLabel.toLowerCase()} — adjust after tasting`;
  return `
    <div class="dial-in">
      <span class="dial-in-icon" aria-hidden="true">${icon}</span>
      <div>
        <p class="dial-in-title">${title}</p>
        <p class="dial-in-sub">${sub}</p>
      </div>
    </div>
  `;
}

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
