import { subscribe, getEquipment, setEquipment } from "../../core/store.js";
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
        <input type="text" id="machine" placeholder="e.g. Breville Bambino Plus" value="${escapeAttr(eq.machine)}" />
      </div>

      <div class="field">
        <label for="grinder">Grinder</label>
        <input type="text" id="grinder" placeholder="e.g. Baratza Encore" value="${escapeAttr(eq.grinder)}" />
      </div>

      <div class="equipment-hint">
        <p>Shown at the top of every page. Saved locally on this device.</p>
      </div>

      <div class="form-actions">
        <button class="btn ghost" type="button" id="clear-btn">Clear</button>
        <div class="spacer"></div>
        <button class="btn" type="button" id="save-btn">Save</button>
      </div>
    </div>
  `;

  const machineEl = container.querySelector("#machine");
  const grinderEl = container.querySelector("#grinder");
  const saveBtn = container.querySelector("#save-btn");
  const clearBtn = container.querySelector("#clear-btn");

  saveBtn.addEventListener("click", () => {
    setEquipment({
      machine: machineEl.value.trim(),
      grinder: grinderEl.value.trim(),
    });
    navigate("/");
  });

  clearBtn.addEventListener("click", () => {
    machineEl.value = "";
    grinderEl.value = "";
    machineEl.focus();
  });
}

function escapeAttr(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
