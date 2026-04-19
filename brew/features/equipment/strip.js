import { subscribe } from "../../core/store.js";
import { machineLabel, grinderLabel } from "../../core/gear-catalog.js";
import { navigate } from "../../core/router.js";

export function renderEquipStrip(el) {
  if (!el) return;
  subscribe((state) => paint(el, state.equipment));
}

const MACHINE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h14v5a3 3 0 0 1-3 3h-2l-1 4h-2l-1-4H8a3 3 0 0 1-3-3V3z"/><path d="M8 21h8"/><path d="M10 15l-1 6h6l-1-6"/></svg>`;
const GRINDER_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h10l-1 5H8z"/><rect x="6" y="8" width="12" height="8" rx="2"/><circle cx="12" cy="12" r="2.3"/><path d="M9 16v3h6v-3"/><path d="M10 21h4"/></svg>`;
const PLUS_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;

function paint(el, eq) {
  const machine = machineLabel(eq?.machine?.id, eq?.machine?.custom).trim();
  const grinder = grinderLabel(eq?.grinder?.id, eq?.grinder?.custom).trim();
  const hasAny = machine || grinder;

  el.innerHTML = "";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Edit equipment");

  if (!hasAny) {
    btn.innerHTML = `${PLUS_ICON}<span class="equip-placeholder">Add your machine & grinder</span>`;
  } else {
    const badges = [];
    if (machine) {
      badges.push(`<span class="equip-badge" title="Machine">${MACHINE_ICON}${escapeHtml(machine)}</span>`);
    }
    if (grinder) {
      badges.push(`<span class="equip-badge" title="Grinder">${GRINDER_ICON}${escapeHtml(grinder)}</span>`);
    }
    btn.innerHTML = badges.join('<span class="equip-dot" aria-hidden="true"></span>');
  }

  btn.addEventListener("click", () => navigate("/equipment"));
  el.appendChild(btn);
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
