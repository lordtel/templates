import { subscribe } from "../../core/store.js";
import { machineLabel, grinderLabel } from "../../core/gear-catalog.js";
import { navigate } from "../../core/router.js";

export function renderEquipStrip(el) {
  if (!el) return;
  subscribe((state) => paint(el, state.equipment));
}

function paint(el, eq) {
  const machine = machineLabel(eq?.machine?.id, eq?.machine?.custom).trim();
  const grinder = grinderLabel(eq?.grinder?.id, eq?.grinder?.custom).trim();
  const hasAny = machine || grinder;

  el.innerHTML = "";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Edit equipment");

  const icon = `<svg class="equip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><circle cx="12" cy="14" r="3"/></svg>`;

  if (!hasAny) {
    btn.innerHTML = `${icon}<span class="equip-placeholder">Add your machine & grinder</span>`;
  } else {
    const parts = [machine, grinder].filter(Boolean);
    const label = parts.map((p) => escapeHtml(p)).join(' <span class="equip-dot" aria-hidden="true"></span> ');
    btn.innerHTML = `${icon}<span>${label}</span>`;
  }

  btn.addEventListener("click", () => navigate("/equipment"));
  el.appendChild(btn);
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
