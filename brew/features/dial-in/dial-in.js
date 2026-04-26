import {
  getBag,
  getDialInLogs,
  getDialInLog,
  getDialedInRecipe,
  upsertDialInLog,
  removeDialInLog,
  markDialedIn,
  unmarkDialedIn,
  subscribe,
} from "../../core/store.js";
import { getActiveGrinder } from "../../core/dial-in.js";
import { navigate } from "../../core/router.js";

const GENERIC_SCALE = { min: 1, max: 30, step: 1, unit: "" };

const TASTE_LABELS = {
  "-3": "Super sour",
  "-2": "Sour",
  "-1": "A touch sour",
  "0": "Balanced",
  "1": "A touch bitter",
  "2": "Bitter",
  "3": "Super bitter",
};

const TEXTURE_LABELS = {
  "-3": "Watery",
  "-2": "Thin",
  "-1": "Light",
  "0": "Balanced",
  "1": "Rich",
  "2": "Heavy",
  "3": "Syrupy",
};

export function render(container, params) {
  const bagId = params.id;
  container.innerHTML = "";

  const unsubscribe = subscribe(() => paint(container, bagId, params.logId));
  return unsubscribe;
}

function paint(container, bagId, logId) {
  const bag = getBag(bagId);
  container.innerHTML = "";

  if (!bag) {
    container.innerHTML = `<div class="empty-state"><h2>Not found</h2></div>`;
    return;
  }

  const editingLog = logId ? getDialInLog(bagId, logId) : null;
  const existingRecipe = getDialedInRecipe(bagId);
  const grinder = getActiveGrinder();
  const scale = grinder?.scale ?? GENERIC_SCALE;

  const defaults = existingRecipe || editingLog || {};
  const state = {
    id: editingLog?.id ?? null,
    dose: editingLog?.dose ?? bag.dose ?? defaults.dose ?? "",
    yield:
      editingLog?.yield ??
      defaults.yield ??
      (bag.dose ? Number(bag.dose) * 2 : ""),
    time: editingLog?.time ?? defaults.time ?? 28,
    grind: editingLog?.grind ?? defaults.grind ?? ((scale.min + scale.max) / 2),
    taste: editingLog?.taste ?? 0,
    texture: editingLog?.texture ?? 0,
    note: editingLog?.note ?? "",
    date: editingLog?.date ?? todayIso(),
  };

  const back = document.createElement("button");
  back.type = "button";
  back.className = "back-btn";
  back.innerHTML = `<span aria-hidden="true">‹</span> ${escapeHtml(bag.brand || "Bag")}`;
  back.addEventListener("click", () => navigate(`/bag/${bagId}`));
  container.appendChild(back);

  const head = document.createElement("div");
  head.className = "page-head";
  head.innerHTML = `
    <div>
      <p class="eyebrow">${bag.dialedInAt ? "Dialed in" : "Dial-in companion"}</p>
      <h1>${editingLog ? "Edit attempt" : "New attempt"}</h1>
    </div>
  `;
  container.appendChild(head);

  if (bag.dialedInAt && existingRecipe) {
    const locked = document.createElement("div");
    locked.className = "dialed-locked";
    locked.innerHTML = `
      <div>
        <p class="dialed-locked-title">Locked recipe — aiming to match:</p>
        <p class="dialed-locked-sub">${formatRecipe(existingRecipe)}</p>
      </div>
      <button type="button" class="btn ghost small" id="reopen-btn">Re-open</button>
    `;
    container.appendChild(locked);
    locked.querySelector("#reopen-btn").addEventListener("click", () => {
      unmarkDialedIn(bagId);
      showDialInToast("Recipe unlocked. Mark an attempt as dialed in when you're happy.");
    });
  }

  // "Same as last attempt?" prefill banner — only on a brand new attempt
  // when there's at least one prior log to copy from.
  const allLogs = getDialInLogs(bagId);
  if (!editingLog && allLogs.length > 0) {
    const lastLog = allLogs[0];
    const banner = document.createElement("div");
    banner.className = "last-attempt";
    banner.innerHTML = `
      <span class="last-attempt-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>
        </svg>
      </span>
      <div class="last-attempt-body">
        <p class="last-attempt-title">Same as last attempt?</p>
        <p class="last-attempt-recipe">${escapeHtml(formatLastAttempt(lastLog, scale))}</p>
      </div>
      <button type="button" class="btn small" id="copy-last-btn">Copy</button>
    `;
    container.appendChild(banner);
    banner.querySelector("#copy-last-btn").addEventListener("click", () => {
      const ids = [
        ["di-dose", lastLog.dose],
        ["di-yield", lastLog.yield],
        ["di-time", lastLog.time],
        ["di-grind", lastLog.grind],
      ];
      ids.forEach(([id, val]) => {
        const input = document.getElementById(id);
        if (input && val != null && val !== "") {
          input.value = val;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
      const btn = banner.querySelector("#copy-last-btn");
      btn.textContent = "Copied ✓";
      btn.disabled = true;
      banner.classList.add("last-attempt--used");
    });
  }

  const card = document.createElement("div");
  card.className = "card dial-in-form";
  card.innerHTML = `
    <p class="di-section-title">Parameters</p>

    <div class="field-row">
      <div class="field">
        <label for="di-dose">Dose in (g)</label>
        <div class="stepper">
          <button type="button" class="stepper-btn" data-target="di-dose" data-step="-0.5" aria-label="Decrease dose">−</button>
          <input type="number" id="di-dose" min="6" max="30" step="0.1" inputmode="decimal" value="${state.dose}" placeholder="18" />
          <button type="button" class="stepper-btn" data-target="di-dose" data-step="0.5" aria-label="Increase dose">+</button>
        </div>
      </div>
      <div class="field">
        <label for="di-yield">Yield out (g)</label>
        <div class="stepper">
          <button type="button" class="stepper-btn" data-target="di-yield" data-step="-1" aria-label="Decrease yield">−</button>
          <input type="number" id="di-yield" min="10" max="80" step="0.1" inputmode="decimal" value="${state.yield}" placeholder="36" />
          <button type="button" class="stepper-btn" data-target="di-yield" data-step="1" aria-label="Increase yield">+</button>
        </div>
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="di-time">Shot time (s)</label>
        <div class="stepper">
          <button type="button" class="stepper-btn" data-target="di-time" data-step="-1" aria-label="Decrease time">−</button>
          <input type="number" id="di-time" min="8" max="60" step="0.5" inputmode="decimal" value="${state.time}" placeholder="28" />
          <button type="button" class="stepper-btn" data-target="di-time" data-step="1" aria-label="Increase time">+</button>
        </div>
      </div>
      <div class="field">
        <label>Ratio</label>
        <p class="ratio-display" id="ratio">—</p>
      </div>
    </div>

    <div class="field">
      <label for="di-grind">
        Grind size
        <span class="grind-tag" id="di-grind-tag">${formatGrind(state.grind, scale)}</span>
      </label>
      <input type="range" id="di-grind" min="${scale.min}" max="${scale.max}" step="${scale.step}" value="${state.grind}" />
      <div class="grind-scale">
        <span>Fine (${scale.min})</span>
        ${grinder ? `<span>${grinder.brand} ${grinder.model}</span>` : `<span>Medium</span>`}
        <span>Coarse (${scale.max})</span>
      </div>
    </div>

    <p class="di-section-title di-section-title--results">Results</p>

    <div class="field">
      <label for="di-taste">
        Taste
        <span class="grind-tag" id="di-taste-tag">${TASTE_LABELS[String(state.taste)]}</span>
      </label>
      <input type="range" id="di-taste" class="bipolar sour-bitter" min="-3" max="3" step="1" value="${state.taste}" />
      <div class="grind-scale">
        <span>Super sour</span>
        <span>Balanced</span>
        <span>Super bitter</span>
      </div>
    </div>

    <div class="field">
      <label for="di-texture">
        Texture
        <span class="grind-tag" id="di-texture-tag">${TEXTURE_LABELS[String(state.texture)]}</span>
      </label>
      <input type="range" id="di-texture" class="bipolar water-syrup" min="-3" max="3" step="1" value="${state.texture}" />
      <div class="grind-scale">
        <span>Watery</span>
        <span>Balanced</span>
        <span>Syrupy</span>
      </div>
    </div>

    <div class="field">
      <label for="di-date">Date</label>
      <input type="date" id="di-date" value="${state.date}" max="${todayIso()}" />
    </div>

    <div class="field">
      <label for="di-note">Notes</label>
      <textarea id="di-note" placeholder="Bright, bit sour, pulled fast — tighten grind next.">${escapeHtml(state.note)}</textarea>
    </div>

    <div class="form-actions">
      ${editingLog ? `<button class="btn danger small" type="button" id="delete-btn">Delete</button>` : ""}
      <div class="spacer"></div>
      <button class="btn ghost" type="button" id="cancel-btn">Cancel</button>
      <button class="btn" type="button" id="save-btn">${editingLog ? "Update" : "Save attempt"}</button>
    </div>
  `;
  container.appendChild(card);

  bind(container, card, bagId, state, editingLog, scale);

  const logs = getDialInLogs(bagId);
  if (logs.length) {
    const listHead = document.createElement("div");
    listHead.className = "page-head ratings-head";
    listHead.innerHTML = `<h2>Previous attempts</h2>`;
    container.appendChild(listHead);

    const list = document.createElement("div");
    list.className = "dial-in-list";
    logs.forEach((log) => list.appendChild(buildLogCard(bagId, log, scale)));
    container.appendChild(list);
  }
}

function bind(container, card, bagId, state, editingLog, scale) {
  const el = {
    dose: card.querySelector("#di-dose"),
    yield: card.querySelector("#di-yield"),
    time: card.querySelector("#di-time"),
    ratio: card.querySelector("#ratio"),
    grind: card.querySelector("#di-grind"),
    grindTag: card.querySelector("#di-grind-tag"),
    taste: card.querySelector("#di-taste"),
    tasteTag: card.querySelector("#di-taste-tag"),
    texture: card.querySelector("#di-texture"),
    textureTag: card.querySelector("#di-texture-tag"),
    date: card.querySelector("#di-date"),
    note: card.querySelector("#di-note"),
    save: card.querySelector("#save-btn"),
    cancel: card.querySelector("#cancel-btn"),
    del: card.querySelector("#delete-btn"),
  };

  const syncRatio = () => {
    const d = Number(el.dose.value);
    const y = Number(el.yield.value);
    if (d > 0 && y > 0) el.ratio.textContent = `1 : ${(y / d).toFixed(2)}`;
    else el.ratio.textContent = "—";
  };

  const syncTint = (input) => {
    const v = Number(input.value);
    input.dataset.zone = v < 0 ? "neg" : v > 0 ? "pos" : "zero";
  };

  syncRatio();
  syncTint(el.taste);
  syncTint(el.texture);

  el.dose.addEventListener("input", syncRatio);
  el.yield.addEventListener("input", syncRatio);

  // Stepper buttons (− / +) on dose, yield, time
  card.querySelectorAll(".stepper-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = card.querySelector(`#${btn.dataset.target}`);
      if (!target) return;
      const step = Number(btn.dataset.step);
      const min = Number(target.min);
      const max = Number(target.max);
      const fallback = Number(target.placeholder) || 0;
      // First tap on an empty input snaps to placeholder; otherwise step.
      let next = target.value === ""
        ? fallback
        : Number(target.value) + step;
      if (Number.isFinite(min)) next = Math.max(min, next);
      if (Number.isFinite(max)) next = Math.min(max, next);
      target.value = +next.toFixed(1);
      target.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });

  el.grind.addEventListener("input", () => {
    el.grindTag.textContent = formatGrind(el.grind.value, scale);
  });
  el.taste.addEventListener("input", () => {
    el.tasteTag.textContent = TASTE_LABELS[String(el.taste.value)] ?? "";
    syncTint(el.taste);
  });
  el.texture.addEventListener("input", () => {
    el.textureTag.textContent = TEXTURE_LABELS[String(el.texture.value)] ?? "";
    syncTint(el.texture);
  });

  el.cancel.addEventListener("click", () => navigate(`/bag/${bagId}`));

  if (el.del && editingLog) {
    el.del.addEventListener("click", (e) => {
      inlineConfirm(e.currentTarget, "Delete this attempt?", "Delete", () => {
        removeDialInLog(bagId, editingLog.id);
        navigate(`/bag/${bagId}/dial-in`);
      });
    });
  }

  el.save.addEventListener("click", () => {
    if (el.save.disabled) return;
    el.save.disabled = true;
    const payload = {
      id: editingLog?.id,
      dose: el.dose.value,
      yield: el.yield.value,
      time: el.time.value,
      grind: el.grind.value,
      taste: el.taste.value,
      texture: el.texture.value,
      note: el.note.value.trim(),
      date: el.date.value || todayIso(),
    };
    upsertDialInLog(bagId, payload);
    navigate(`/bag/${bagId}/dial-in`);
  });
}

function buildLogCard(bagId, log, scale) {
  const card = document.createElement("div");
  card.className = "dial-in-attempt";
  const ratio =
    Number(log.dose) > 0 && Number(log.yield) > 0
      ? `1:${(Number(log.yield) / Number(log.dose)).toFixed(2)}`
      : "";
  card.innerHTML = `
    <div class="dial-in-attempt-head">
      <div>
        <p class="dial-in-attempt-date">${formatDate(log.date)}</p>
        <p class="dial-in-attempt-recipe">
          ${log.dose ? `${log.dose}g` : "—"} → ${log.yield ? `${log.yield}g` : "—"}
          ${ratio ? `<span class="muted">· ${ratio}</span>` : ""}
          ${log.time ? `<span class="muted">· ${log.time}s</span>` : ""}
        </p>
      </div>
      <span class="dial-in-attempt-grind">Grind ${formatGrind(log.grind, scale)}</span>
    </div>
    <div class="dial-in-attempt-tags">
      <span class="tag-bipolar sour-bitter" data-val="${log.taste}">${TASTE_LABELS[String(log.taste)]}</span>
      <span class="tag-bipolar water-syrup" data-val="${log.texture}">${TEXTURE_LABELS[String(log.texture)]}</span>
    </div>
    ${log.note ? `<p class="dial-in-attempt-note">${escapeHtml(log.note)}</p>` : ""}
    <div class="dial-in-attempt-actions">
      <button type="button" class="linklike" data-act="edit">Edit</button>
      <button type="button" class="linklike strong" data-act="lock">Mark as dialed in</button>
    </div>
  `;

  card.querySelector('[data-act="edit"]').addEventListener("click", () => {
    navigate(`/bag/${bagId}/dial-in/${log.id}`);
  });
  card.querySelector('[data-act="lock"]').addEventListener("click", (e) => {
    inlineConfirm(e.currentTarget, "Lock this in as your recipe?", "Lock it in", () => {
      markDialedIn(bagId, {
        dose: log.dose,
        yield: log.yield,
        time: log.time,
        grind: log.grind,
      });
      navigate(`/bag/${bagId}`);
    });
  });

  return card;
}

function formatRecipe(r) {
  const bits = [];
  if (r.dose) bits.push(`${r.dose}g`);
  if (r.yield) bits.push(`→ ${r.yield}g`);
  if (Number(r.dose) > 0 && Number(r.yield) > 0) {
    bits.push(`(1:${(Number(r.yield) / Number(r.dose)).toFixed(2)})`);
  }
  if (r.time) bits.push(`${r.time}s`);
  if (r.grind != null) bits.push(`grind ${r.grind}`);
  return bits.join(" · ");
}

function formatLastAttempt(log, scale) {
  const bits = [];
  if (log.date) bits.push(formatDate(log.date));
  if (log.dose && log.yield) bits.push(`${log.dose}g → ${log.yield}g`);
  else if (log.dose) bits.push(`${log.dose}g in`);
  if (log.time) bits.push(`${log.time}s`);
  if (log.grind != null && log.grind !== "") bits.push(`grind ${formatGrind(log.grind, scale)}`);
  return bits.join(" · ");
}

function formatGrind(n, scale) {
  if (n === "" || n == null) return "—";
  const decimals =
    scale?.step && scale.step < 1
      ? Math.max(0, -Math.floor(Math.log10(scale.step)))
      : 0;
  const num = Number(n).toFixed(decimals);
  const unit = scale?.unit ? " " + scale.unit + (Number(n) === 1 ? "" : "s") : "";
  return `${num}${unit}`;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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

function showDialInToast(msg) {
  const existing = document.getElementById("di-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "di-toast";
  toast.className = "toast toast--show";
  toast.setAttribute("role", "status");
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove("toast--show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 4000);
}

function inlineConfirm(btn, question, confirmLabel, onConfirm) {
  btn.style.display = "none";
  const row = document.createElement("span");
  row.className = "inline-confirm";
  const q = document.createElement("span");
  q.className = "inline-confirm-q";
  q.textContent = question;
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "linklike";
  cancel.textContent = "Cancel";
  const yes = document.createElement("button");
  yes.type = "button";
  yes.className = "btn small";
  yes.textContent = confirmLabel;
  row.appendChild(q);
  row.appendChild(cancel);
  row.appendChild(yes);
  btn.after(row);
  cancel.addEventListener("click", () => { row.remove(); btn.style.display = ""; });
  yes.addEventListener("click", () => { row.remove(); btn.style.display = ""; onConfirm(); });
}
