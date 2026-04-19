import { getBag, addBrew, DRINK_TYPES } from "../../core/store.js";
import { navigate } from "../../core/router.js";

const GRIND_LABELS = [
  { max: 5, label: "Turkish" },
  { max: 12, label: "Espresso" },
  { max: 18, label: "Moka / AeroPress" },
  { max: 24, label: "V60 / Drip" },
  { max: 30, label: "French Press / Cold Brew" },
];

export function render(container, params) {
  const bag = getBag(params.id);
  if (!bag) {
    container.innerHTML = `<div class="empty-state"><h2>Bag not found</h2></div>`;
    return;
  }

  const state = {
    drinkType: "espresso",
    grindSize: 10,
    rating: 0,
    doseGrams: "",
    yieldGrams: "",
    notes: "",
  };

  container.innerHTML = `
    <button type="button" class="back-btn"><span aria-hidden="true">‹</span> ${escapeHtml(bag.brand || "Bag")}</button>

    <div class="page-head">
      <div>
        <p class="eyebrow">Log a brew</p>
        <h1>How did it pull?</h1>
      </div>
    </div>

    <div class="card brew-form">
      <div class="field">
        <label>Drink</label>
        <div class="drink-picker" role="radiogroup">
          ${DRINK_TYPES.map((d) => `
            <button type="button" role="radio" aria-checked="false" data-drink="${d.id}" class="drink-option">
              ${d.label}
            </button>
          `).join("")}
        </div>
      </div>

      <div class="field">
        <label for="grind">Grind size <span class="grind-tag" id="grind-tag">Espresso</span></label>
        <input type="range" id="grind" min="1" max="30" step="1" value="10" />
        <div class="grind-scale">
          <span>Fine</span>
          <span>Medium</span>
          <span>Coarse</span>
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="dose">Dose (g)</label>
          <input type="number" id="dose" min="0" step="0.1" placeholder="18.0" />
        </div>
        <div class="field">
          <label for="yield">Yield (g)</label>
          <input type="number" id="yield" min="0" step="0.1" placeholder="36.0" />
        </div>
      </div>

      <div class="field">
        <label>Rating</label>
        <div class="rating" role="radiogroup" aria-label="Rate this brew">
          ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="star" data-rating="${n}" aria-label="${n} stars"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3l2.8 5.7 6.3.9-4.6 4.5 1.1 6.3L12 17.8 6.4 20.4l1.1-6.3L2.9 9.6l6.3-.9L12 3z"/></svg></button>`).join("")}
        </div>
      </div>

      <div class="field">
        <label for="b-notes">Notes</label>
        <textarea id="b-notes" placeholder="Bright, clean, slight acidity — dialed in nicely."></textarea>
      </div>

      <div class="form-actions">
        <button class="btn ghost" type="button" id="cancel-btn">Cancel</button>
        <div class="spacer"></div>
        <button class="btn" type="button" id="save-btn">Save brew</button>
      </div>
    </div>
  `;

  bind(container, state, bag.id);
}

function bind(container, state, bagId) {
  const el = {
    back: container.querySelector(".back-btn"),
    drinkButtons: container.querySelectorAll(".drink-option"),
    grind: container.querySelector("#grind"),
    grindTag: container.querySelector("#grind-tag"),
    dose: container.querySelector("#dose"),
    yield: container.querySelector("#yield"),
    stars: container.querySelectorAll(".star"),
    notes: container.querySelector("#b-notes"),
    save: container.querySelector("#save-btn"),
    cancel: container.querySelector("#cancel-btn"),
  };

  el.back.addEventListener("click", () => navigate(`/bag/${bagId}`));
  el.cancel.addEventListener("click", () => navigate(`/bag/${bagId}`));

  el.drinkButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.drinkType = btn.dataset.drink;
      syncDrink(el, state);
    });
  });

  el.grind.addEventListener("input", () => {
    state.grindSize = Number(el.grind.value);
    el.grindTag.textContent = grindLabel(state.grindSize);
  });

  el.stars.forEach((s) => {
    s.addEventListener("click", () => {
      state.rating = Number(s.dataset.rating);
      syncStars(el, state);
    });
  });

  el.save.addEventListener("click", () => {
    state.doseGrams = el.dose.value ? Number(el.dose.value) : "";
    state.yieldGrams = el.yield.value ? Number(el.yield.value) : "";
    state.notes = el.notes.value.trim();
    if (!state.rating) {
      el.stars[0].focus();
      return;
    }
    addBrew(bagId, { ...state });
    navigate(`/bag/${bagId}`);
  });

  syncDrink(el, state);
  syncStars(el, state);
  el.grindTag.textContent = grindLabel(state.grindSize);
}

function syncDrink(el, state) {
  el.drinkButtons.forEach((btn) => {
    const active = btn.dataset.drink === state.drinkType;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-checked", String(active));
  });
}

function syncStars(el, state) {
  el.stars.forEach((s, i) => {
    s.classList.toggle("on", i < state.rating);
  });
}

function grindLabel(n) {
  return GRIND_LABELS.find((g) => n <= g.max)?.label ?? "";
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
