import { subscribe } from "../../core/store.js";

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function initProgress() {
  const valueEl = document.getElementById("progress-value");
  const countEl = document.getElementById("progress-count");
  const ringEl = document.querySelector(".ring-fill");
  if (!valueEl || !countEl || !ringEl) return;

  subscribe((state) => {
    const total = state.tasks.length;
    const done = state.tasks.filter((t) => t.done).length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);

    ringEl.style.strokeDashoffset = CIRCUMFERENCE - (CIRCUMFERENCE * pct) / 100;
    valueEl.textContent = pct + "%";
    countEl.textContent = done + " of " + total;
  });
}
