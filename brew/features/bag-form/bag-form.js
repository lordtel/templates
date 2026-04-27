import { addBag, updateBag, getBag, removeBag, getState } from "../../core/store.js";
import { navigate } from "../../core/router.js";
import { ocrImage, parseBagText } from "../../core/ocr.js";
import { openImageEditor } from "../../core/image-editor.js";

const ROASTS = ["light", "medium-light", "medium", "medium-dark", "dark", "filter", "omni"];
const CURRENCIES = ["€", "$", "£", "¥", "CHF", "SEK", "NOK", "DKK", "AUD", "CAD"];

// Curated suggestions — merged with values from the user's prior bags.
const COMMON_ORIGINS = [
  "Ethiopia", "Colombia", "Brazil", "Kenya", "Guatemala", "Costa Rica",
  "Honduras", "Rwanda", "Burundi", "Panama", "El Salvador", "Indonesia",
  "Yemen", "Peru", "Mexico", "Tanzania", "Uganda", "DR Congo",
  "Bolivia", "Nicaragua", "Ecuador", "India", "Vietnam", "Papua New Guinea",
];
const COMMON_VARIETIES = [
  "Heirloom", "Bourbon", "Typica", "Caturra", "Catuai", "Geisha",
  "Pacamara", "SL28", "SL34", "Mundo Novo", "Pink Bourbon", "Yellow Bourbon",
  "Red Bourbon", "Castillo", "Wush Wush", "Sidra", "Pacas", "Maragogype",
  "Tabi", "Java", "Villa Sarchi", "Kent",
];
const COMMON_PROCESSES = [
  "Washed", "Natural", "Honey", "White Honey", "Yellow Honey", "Red Honey",
  "Black Honey", "Anaerobic", "Carbonic Maceration", "Wet Hulled",
  "Pulped Natural", "Lactic", "Thermal Shock", "Double Anaerobic",
];

// Dedupe + trim a list of suggestions, preserving order.
function dedupeOptions(options) {
  const seen = new Set();
  const out = [];
  options.forEach((v) => {
    const key = String(v ?? "").trim();
    const lc = key.toLowerCase();
    if (key && !seen.has(lc)) {
      seen.add(lc);
      out.push(key);
    }
  });
  return out;
}

// Wraps a text input with a custom dropdown that shows options on focus
// and filters as the user types. Free-text input still works.
function setupCombobox(input, options) {
  const cleanOptions = dedupeOptions(options);
  if (!cleanOptions.length) return; // nothing to suggest — leave as plain input

  const field = input.closest(".field");
  if (!field) return;
  field.classList.add("combo-field");

  // Replace input's parent .field with a wrapper so we can pin a panel.
  const wrap = document.createElement("div");
  wrap.className = "combo-wrap";
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);

  const arrow = document.createElement("span");
  arrow.className = "combo-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.innerHTML = `<svg viewBox="0 0 12 8"><path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  wrap.appendChild(arrow);

  const panel = document.createElement("ul");
  panel.className = "combo-panel";
  panel.setAttribute("role", "listbox");
  panel.hidden = true;
  wrap.appendChild(panel);

  let activeIndex = -1;

  function render(filterText) {
    const q = filterText.trim().toLowerCase();
    const matches = q
      ? cleanOptions.filter((o) => o.toLowerCase().includes(q))
      : cleanOptions;

    if (!matches.length) {
      panel.hidden = true;
      return;
    }

    panel.innerHTML = matches
      .slice(0, 50)
      .map((o, i) => `<li role="option" data-value="${escapeHtml(o)}" class="combo-option">${escapeHtml(o)}</li>`)
      .join("");
    activeIndex = -1;
    panel.hidden = false;
  }

  function pick(value) {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    panel.hidden = true;
    activeIndex = -1;
  }

  input.addEventListener("focus", () => render(input.value));
  input.addEventListener("input", () => render(input.value));
  input.addEventListener("keydown", (e) => {
    const items = Array.from(panel.querySelectorAll(".combo-option"));
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (panel.hidden) render(input.value);
      activeIndex = Math.min(items.length - 1, activeIndex + 1);
      items.forEach((it, i) => it.classList.toggle("active", i === activeIndex));
      items[activeIndex]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = Math.max(0, activeIndex - 1);
      items.forEach((it, i) => it.classList.toggle("active", i === activeIndex));
      items[activeIndex]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && activeIndex >= 0 && !panel.hidden) {
      e.preventDefault();
      pick(items[activeIndex].dataset.value);
    } else if (e.key === "Escape") {
      panel.hidden = true;
      activeIndex = -1;
    }
  });

  // Use mousedown so click fires before blur hides the panel.
  panel.addEventListener("mousedown", (e) => {
    const li = e.target.closest(".combo-option");
    if (!li) return;
    e.preventDefault();
    pick(li.dataset.value);
  });

  // Hide panel when clicking outside.
  document.addEventListener("mousedown", (e) => {
    if (!wrap.contains(e.target)) {
      panel.hidden = true;
      activeIndex = -1;
    }
  });

  input.addEventListener("blur", () => {
    // Slight delay so a click on the panel can fire first.
    setTimeout(() => { panel.hidden = true; }, 120);
  });
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function fieldSuggestions(currentBagId) {
  const bags = (getState().bags ?? []).filter((b) => b.id !== currentBagId);
  const pluck = (key) => bags.map((b) => b[key]).filter(Boolean);
  return {
    brands:    pluck("brand").sort(),
    origins:   [...pluck("origin"),  ...COMMON_ORIGINS],
    varieties: [...pluck("variety"), ...COMMON_VARIETIES],
    processes: [...pluck("process"), ...COMMON_PROCESSES],
  };
}

export function render(container, params = {}) {
  const editing = !!params.id;
  const existing = editing ? getBag(params.id) : null;
  if (editing && !existing) {
    container.innerHTML = `<div class="empty-state"><h2>Not found</h2><p>This bag no longer exists.</p></div>`;
    return;
  }

  const state = {
    photo: existing?.photo ?? "",
    photoPath: existing?.photoPath ?? "",
    photoUpload: "",
    brand: existing?.brand ?? "",
    origin: existing?.origin ?? "",
    process: existing?.process ?? "",
    variety: existing?.variety ?? "",
    roast: existing?.roast ?? "",
    notes: existing?.notes ?? "",
    weight: existing?.weight ?? "",
    price: existing?.price ?? "",
    dose: existing?.dose ?? "",
    currency: existing?.currency ?? "€",
    altitude: existing?.altitude ?? "",
    ocrText: existing?.ocrText ?? "",
  };

  const suggest = fieldSuggestions(params.id);

  container.innerHTML = `
    <div class="page-head">
      <div>
        <p class="eyebrow">${editing ? "Edit bag" : "New bag"}</p>
        <h1>${editing ? "Update details" : "Log a bag"}</h1>
      </div>
    </div>
    <div class="card bag-form">
      <div class="photo-slot" id="photo-slot" role="button" tabindex="0" aria-label="Upload bag photo">
        <input type="file" id="photo-input" accept="image/*" hidden />
        <div class="photo-placeholder" id="photo-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M8 5l1.5-2h5L16 5"/></svg>
          <span>Add a photo</span>
          <small>Camera or photo library — we'll try to auto-fill the fields</small>
        </div>
        <img id="photo-preview" alt="" hidden />
      </div>

      <div class="ocr-status" id="ocr-status" hidden>
        <div class="ocr-bar"><span id="ocr-fill"></span></div>
        <p id="ocr-message">Reading label…</p>
      </div>

      <div class="field">
        <label for="f-brand">Brand / Roaster</label>
        <input type="text" id="f-brand" autocomplete="off" placeholder="e.g. La Cabra" />
      </div>

      <div class="field-row">
        <div class="field">
          <label for="f-origin">Origin</label>
          <input type="text" id="f-origin" autocomplete="off" placeholder="Ethiopia" />
        </div>
        <div class="field">
          <label for="f-variety">Variety</label>
          <input type="text" id="f-variety" autocomplete="off" placeholder="Heirloom" />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="f-process">Process</label>
          <input type="text" id="f-process" autocomplete="off" placeholder="Washed" />
        </div>
        <div class="field">
          <label for="f-roast">Roast</label>
          <select id="f-roast">
            <option value="">—</option>
            ${ROASTS.map((r) => `<option value="${r}">${r}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="f-weight">Weight (g)</label>
          <input type="number" id="f-weight" min="0" step="1" placeholder="250" />
        </div>
        <div class="field">
          <label for="f-altitude">Altitude</label>
          <input type="text" id="f-altitude" placeholder="1800 masl" />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="f-price">Price</label>
          <input type="number" id="f-price" min="0" step="0.01" placeholder="18.00" />
        </div>
        <div class="field">
          <label for="f-currency">Currency</label>
          <select id="f-currency">
            ${CURRENCIES.map((c) => `<option value="${c}">${c}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="field">
        <label for="f-dose">Dose per double espresso (g)</label>
        <input type="number" id="f-dose" min="8" max="25" step="0.5" placeholder="18" />
        <p class="field-hint">Unlocks the per-shot price for this bag.</p>
      </div>

      <div class="field">
        <label for="f-notes">Tasting notes</label>
        <textarea id="f-notes" placeholder="Blueberry, milk chocolate, caramel" maxlength="500"></textarea>
      </div>

      <div class="form-actions">
        <button class="btn ghost" type="button" id="cancel-btn">Cancel</button>
        <div class="spacer"></div>
        ${editing ? '<button class="btn danger small" type="button" id="delete-btn">Delete</button>' : ""}
        ${
          editing
            ? '<button class="btn" type="button" id="save-btn">Save changes</button>'
            : `
              <button class="btn ghost" type="button" id="save-btn">Save — already dialed</button>
              <button class="btn" type="button" id="save-dial-btn">Save &amp; dial in →</button>
            `
        }
      </div>
    </div>
  `;

  bind(container, state, editing, params.id, suggest);
}

function bind(container, state, editing, id, suggest) {
  const el = {
    photoSlot: container.querySelector("#photo-slot"),
    photoInput: container.querySelector("#photo-input"),
    photoPreview: container.querySelector("#photo-preview"),
    photoPlaceholder: container.querySelector("#photo-placeholder"),
    ocrStatus: container.querySelector("#ocr-status"),
    ocrFill: container.querySelector("#ocr-fill"),
    ocrMessage: container.querySelector("#ocr-message"),
    brand: container.querySelector("#f-brand"),
    origin: container.querySelector("#f-origin"),
    variety: container.querySelector("#f-variety"),
    process: container.querySelector("#f-process"),
    roast: container.querySelector("#f-roast"),
    weight: container.querySelector("#f-weight"),
    altitude: container.querySelector("#f-altitude"),
    price: container.querySelector("#f-price"),
    currency: container.querySelector("#f-currency"),
    dose: container.querySelector("#f-dose"),
    notes: container.querySelector("#f-notes"),
    save: container.querySelector("#save-btn"),
    saveDial: container.querySelector("#save-dial-btn"),
    cancel: container.querySelector("#cancel-btn"),
    del: container.querySelector("#delete-btn"),
  };

  paintFields(el, state);

  // Combobox dropdowns for the four searchable text fields.
  if (suggest) {
    setupCombobox(el.brand,   suggest.brands);
    setupCombobox(el.origin,  suggest.origins);
    setupCombobox(el.variety, suggest.varieties);
    setupCombobox(el.process, suggest.processes);
  }

  el.photoSlot.addEventListener("click", () => el.photoInput.click());
  el.photoSlot.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      el.photoInput.click();
    }
  });

  el.photoInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readAsDataUrl(file);
    const resized = await resizeImage(dataUrl, 1600);
    const edited = await openImageEditor(resized);
    const final = edited ?? resized;
    state.photo = final;
    state.photoUpload = final;
    el.photoPreview.src = final;
    el.photoPreview.hidden = false;
    el.photoPlaceholder.hidden = true;
    el.photoInput.value = "";
    runOcr(final, state, el);
  });

  const commit = (afterPath) => {
    readFields(el, state);
    if (!state.brand && !state.origin && !state.photo && !state.photoUpload) {
      el.brand.focus();
      return;
    }
    if (editing) {
      updateBag(id, { ...state });
      navigate(afterPath ?? `/bag/${id}`);
    } else {
      const newId = addBag({ ...state });
      navigate(afterPath ? afterPath.replace(":id", newId) : `/bag/${newId}`);
    }
  };

  el.save.addEventListener("click", () => commit());
  el.saveDial?.addEventListener("click", () => commit(`/bag/:id/dial-in`));

  el.cancel.addEventListener("click", () => {
    if (editing) navigate(`/bag/${id}`);
    else navigate("/");
  });

  el.del?.addEventListener("click", () => {
    if (!confirm("Delete this bag and all its brews?")) return;
    removeBag(id);
    navigate("/");
  });
}

function paintFields(el, state) {
  if (state.photo) {
    el.photoPreview.src = state.photo;
    el.photoPreview.hidden = false;
    el.photoPlaceholder.hidden = true;
  }
  el.brand.value = state.brand;
  el.origin.value = state.origin;
  el.variety.value = state.variety;
  el.process.value = state.process;
  el.roast.value = state.roast;
  el.weight.value = state.weight;
  el.altitude.value = state.altitude;
  el.price.value = state.price;
  el.currency.value = state.currency || "€";
  el.dose.value = state.dose;
  el.notes.value = state.notes;
}

function readFields(el, state) {
  state.brand = el.brand.value.trim();
  state.origin = el.origin.value.trim();
  state.variety = el.variety.value.trim();
  state.process = el.process.value.trim();
  state.roast = el.roast.value;
  state.weight = el.weight.value ? Number(el.weight.value) : "";
  state.altitude = el.altitude.value.trim();
  state.price = el.price.value ? Number(el.price.value) : "";
  state.currency = el.currency.value;
  state.dose = el.dose.value ? Number(el.dose.value) : "";
  state.notes = el.notes.value.trim();
}

async function runOcr(dataUrl, state, el) {
  el.ocrStatus.hidden = false;
  el.ocrMessage.textContent = "Loading OCR engine…";
  el.ocrFill.style.width = "0%";
  setSaveBusy(el, true, "Scanning…");

  let skipRequested = false;
  let skipLink = null;

  // After 6 s with no result, offer a manual-fill escape hatch.
  const skipTimer = setTimeout(() => {
    if (!el.ocrStatus.hidden && !skipLink) {
      skipLink = document.createElement("button");
      skipLink.type = "button";
      skipLink.className = "ocr-skip-link";
      skipLink.textContent = "Skip, fill manually";
      skipLink.addEventListener("click", () => {
        skipRequested = true;
        el.ocrStatus.hidden = true;
        setSaveBusy(el, false);
      });
      el.ocrStatus.appendChild(skipLink);
    }
  }, 6000);

  // If OCR hasn't progressed after a beat, nudge the copy.
  const slowTimer = setTimeout(() => {
    if (!el.ocrStatus.hidden && !skipRequested) {
      el.ocrMessage.textContent = "Scanning label (this can take a moment on first run)…";
    }
  }, 4000);

  try {
    const text = await ocrImage(dataUrl, ({ stage, progress }) => {
      if (stage === "loading") el.ocrMessage.textContent = "Loading OCR engine…";
      if (stage === "recognizing") {
        el.ocrMessage.textContent = "Reading label…";
        el.ocrFill.style.width = Math.round(progress * 100) + "%";
      }
    });

    const parsed = parseBagText(text);
    state.ocrText = text;
    if (parsed.brand && !el.brand.value) el.brand.value = parsed.brand;
    if (parsed.origin && !el.origin.value) el.origin.value = parsed.origin;
    if (parsed.variety && !el.variety.value) el.variety.value = parsed.variety;
    if (parsed.process && !el.process.value) el.process.value = parsed.process;
    if (parsed.roast && !el.roast.value) el.roast.value = parsed.roast;
    if (parsed.weight && !el.weight.value) el.weight.value = parsed.weight;
    if (parsed.altitude && !el.altitude.value) el.altitude.value = parsed.altitude;
    if (parsed.notes && !el.notes.value) el.notes.value = parsed.notes;

    if (skipRequested) return;
    const filled = Object.entries(parsed).filter(([k, v]) => v && k !== "raw").length;
    el.ocrFill.style.width = "100%";
    if (skipLink) skipLink.remove();
    el.ocrMessage.textContent = filled
      ? `Prefilled ${filled} field${filled === 1 ? "" : "s"} — review and adjust.`
      : "Couldn't auto-detect much. Fill in manually.";
    setTimeout(() => (el.ocrStatus.hidden = true), 2400);
  } catch (err) {
    if (!skipRequested) {
      el.ocrMessage.textContent = "OCR failed — you can still fill in manually.";
      console.error(err);
      setTimeout(() => (el.ocrStatus.hidden = true), 2400);
    }
  } finally {
    clearTimeout(slowTimer);
    clearTimeout(skipTimer);
    if (!skipRequested) setSaveBusy(el, false);
  }
}

function setSaveBusy(el, busy, label) {
  const btns = [el.save, el.saveDial].filter(Boolean);
  btns.forEach((btn) => {
    if (busy) {
      if (!btn.dataset.origLabel) btn.dataset.origLabel = btn.textContent;
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      if (label) btn.textContent = label;
    } else {
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
      if (btn.dataset.origLabel) {
        btn.textContent = btn.dataset.origLabel;
        delete btn.dataset.origLabel;
      }
    }
  });
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function resizeImage(dataUrl, maxSide) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = dataUrl;
  });
}
