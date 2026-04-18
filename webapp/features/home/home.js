export function initHome() {
  const dateEl = document.getElementById("today-heading");
  if (!dateEl) return;

  const opts = { weekday: "long", month: "long", day: "numeric" };
  dateEl.textContent = new Date().toLocaleDateString(undefined, opts);
}
