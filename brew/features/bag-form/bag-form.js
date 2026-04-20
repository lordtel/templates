import { addBag, updateBag, getBag, removeBag } from "../../core/store.js";
import { navigate } from "../../core/router.js";
import { ocrImage, parseBagText } from "../../core/ocr.js";

const ROASTS = ["light", "medium-light", "medium", "medium-dark", "dark", "filter", "omni"];
const CURRENCIES = ["€", "$", "£", "¥", "CHF", "SEK", "NOK", "DKK", "AUD", "CAD"];

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
        <input type="text" id="f-brand" placeholder="e.g. La Cabra" />
      </div>

      <div class="field-row">
        <div class="field">
          <label for="f-origin">Origin</label>
          <input type="text" id="f-origin" placeholder="Ethiopia" />
        </div>
        <div class="field">
          <label for="f-variety">Variety</label>
          <input type="text" id="f-variety" placeholder="Heirloom" />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="f-process">Process</label>
          <input type="text" id="f-process" placeholder="Washed" />
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
        <textarea id="f-notes" placeholder="Blueberry, milk chocolate, caramel"></textarea>
      </div>

      <div class="form-actions">
        <button class="btn ghost" type="button" id="cancel-btn">Cancel</button>
        <div class="spacer"></div>
        ${editing ? '<button class="btn danger small" type="button" id="delete-btn">Delete</button>' : ""}
        <button class="btn" type="button" id="save-btn">${editing ? "Save changes" : "Save bag"}</button>
      </div>
    </div>
  `;

  bind(container, state, editing, params.id);
}

function bind(container, state, editing, id) {
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
    cancel: container.querySelector("#cancel-btn"),
    del: container.querySelector("#delete-btn"),
  };

  paintFields(el, state);

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
    const resized = await resizeImage(dataUrl, 1200);
    state.photo = resized;
    state.photoUpload = resized;
    el.photoPreview.src = resized;
    el.photoPreview.hidden = false;
    el.photoPlaceholder.hidden = true;
    runOcr(resized, state, el);
  });

  el.save.addEventListener("click", () => {
    readFields(el, state);
    if (!state.brand && !state.origin && !state.photo && !state.photoUpload) {
      el.brand.focus();
      return;
    }
    if (editing) {
      updateBag(id, { ...state });
      navigate(`/bag/${id}`);
    } else {
      const newId = addBag({ ...state });
      navigate(`/bag/${newId}`);
    }
  });

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

    const filled = Object.entries(parsed).filter(([k, v]) => v && k !== "raw").length;
    el.ocrFill.style.width = "100%";
    el.ocrMessage.textContent = filled
      ? `Prefilled ${filled} field${filled === 1 ? "" : "s"} — review and adjust.`
      : "Couldn't auto-detect much. Fill in manually.";
    setTimeout(() => (el.ocrStatus.hidden = true), 2400);
  } catch (err) {
    el.ocrMessage.textContent = "OCR failed — you can still fill in manually.";
    console.error(err);
    setTimeout(() => (el.ocrStatus.hidden = true), 2400);
  }
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
