import { subscribe, setFilter } from "../../core/store.js";

export function initFilters() {
  const buttons = document.querySelectorAll(".filter");
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => setFilter(btn.dataset.filter));
  });

  subscribe((state) => {
    buttons.forEach((btn) => {
      const active = btn.dataset.filter === state.filter;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
  });
}
