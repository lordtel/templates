import { getEquipment, setEquipment } from "../../core/store.js";
import { MACHINES, GRINDERS } from "../../core/gear-catalog.js";
import { navigate } from "../../core/router.js";

export function render(container) {
  const eq = getEquipment();

  container.innerHTML = `
    <div class="page-head">
      <div>
        <p class="eyebrow">Your setup</p>
        <h1>Equipment</h1>
      </div>
    </div>

    <div class="card equipment-form">
      <div class="field">
        <label for="machine">Espresso machine</label>
        <select id="machine">
          <option value="">—</option>
          ${groupOptions(MACHINES, eq.machine.id)}
          <option value="custom" ${eq.machine.id === "custom" ? "selected" : ""}>Other…</option>
        </select>
        <input
          type="text"
          id="machine-custom"
          placeholder="Machine name"
          value="${escapeAttr(eq.machine.custom)}"
          ${eq.machine.id === "custom" ? "" : "hidden"}
        />
      </div>

      <div class="field">
        <label for="grinder">Grinder</label>
        <select id="grinder">
          <option value="">—</option>
          ${GRINDERS.map((g) => `
            <option value="${g.id}" ${eq.grinder.id === g.id ? "selected" : ""}>
              ${g.brand} ${g.model}${g.burrSize ? " · " + g.burrSize : ""}
            </option>
          `).join("")}
          <option value="custom" ${eq.grinder.id === "custom" ? "selected" : ""}>Other…</option>
        </select>
        <input
          type="text"
          id="grinder-custom"
          placeholder="Grinder name"
          value="${escapeAttr(eq.grinder.custom)}"
          ${eq.grinder.id === "custom" ? "" : "hidden"}
        />
        <p class="grinder-hint" id="grinder-hint"></p>
      </div>

      <div class="equipment-hint">
        <p>Shown at the top of every page. Grinder specs help tune the dial-in suggestions on the rating form.</p>
      </div>

      <div class="form-actions">
        <button class="btn ghost" type="button" id="clear-btn">Clear</button>
        <div class="spacer"></div>
        <button class="btn" type="button" id="save-btn">Save</button>
      </div>
    </div>

    <aside class="support-card">
      <div class="support-ico" aria-hidden="true">
        <svg viewBox="0 0 40 40" width="32" height="32">
          <defs>
            <radialGradient id="support-cup" cx="40%" cy="35%">
              <stop offset="0" stop-color="var(--crema)"/>
              <stop offset="1" stop-color="var(--accent)"/>
            </radialGradient>
          </defs>
          <path d="M8 14h20l-1.6 14.5A5 5 0 0 1 21.4 33h-6.8a5 5 0 0 1-5-4.5L8 14Z" fill="url(#support-cup)"/>
          <path d="M28 17h3a4 4 0 0 1 0 8h-2.2" fill="none" stroke="var(--accent)" stroke-width="2"/>
          <path d="M13 5c0 2 2 2 2 4s-2 2-2 4M19 5c0 2 2 2 2 4s-2 2-2 4M25 5c0 2 2 2 2 4s-2 2-2 4" fill="none" stroke="var(--ink-soft)" stroke-width="1.4" stroke-linecap="round" opacity="0.55"/>
        </svg>
      </div>
      <div class="support-body">
        <h2>No ads. No paywalls. Ever.</h2>
        <p>Crema is free and will stay that way. If it's earned a spot in your routine, a small coffee helps keep it running.</p>
        <a href="https://buymeacoffee.com/cremacoffee" target="_blank" rel="noopener" class="btn small support-btn">Buy me a coffee →</a>
      </div>
    </aside>
  `;

  bind(container);
}

function bind(container) {
  const machineSel = container.querySelector("#machine");
  const machineCustom = container.querySelector("#machine-custom");
  const grinderSel = container.querySelector("#grinder");
  const grinderCustom = container.querySelector("#grinder-custom");
  const grinderHint = container.querySelector("#grinder-hint");
  const saveBtn = container.querySelector("#save-btn");
  const clearBtn = container.querySelector("#clear-btn");

  const syncCustom = (sel, input) => {
    input.hidden = sel.value !== "custom";
    if (sel.value !== "custom") input.value = "";
  };

  const syncGrinderHint = () => {
    const g = GRINDERS.find((x) => x.id === grinderSel.value);
    if (!g) {
      grinderHint.textContent = "";
      return;
    }
    const { min, max, step, unit } = g.scale;
    const [lo, hi] = g.espressoRange;
    const unitStr = unit ? " " + unit + (step < 1 ? "" : "s") : "";
    grinderHint.textContent =
      `Scale ${min}–${max}${unitStr} · Espresso ${lo}–${hi} · Filter ${g.filterRange[0]}–${g.filterRange[1]}`;
  };

  machineSel.addEventListener("change", () => syncCustom(machineSel, machineCustom));
  grinderSel.addEventListener("change", () => {
    syncCustom(grinderSel, grinderCustom);
    syncGrinderHint();
  });

  syncGrinderHint();

  saveBtn.addEventListener("click", () => {
    setEquipment({
      machine: {
        id: machineSel.value,
        custom: machineSel.value === "custom" ? machineCustom.value.trim() : "",
      },
      grinder: {
        id: grinderSel.value,
        custom: grinderSel.value === "custom" ? grinderCustom.value.trim() : "",
      },
    });
    navigate("/");
  });

  clearBtn.addEventListener("click", () => {
    machineSel.value = "";
    machineCustom.value = "";
    machineCustom.hidden = true;
    grinderSel.value = "";
    grinderCustom.value = "";
    grinderCustom.hidden = true;
    grinderHint.textContent = "";
    machineSel.focus();
  });
}

function groupOptions(items, selectedId) {
  return items
    .map((m) => `<option value="${m.id}" ${m.id === selectedId ? "selected" : ""}>${m.brand} ${m.model}</option>`)
    .join("");
}

function escapeAttr(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
