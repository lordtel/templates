import { navigate, currentPath } from "../../core/router.js";

const items = [
  { path: "/", label: "Bags", icon: bagsIcon() },
  { path: "/bag/new", label: "Add", icon: plusIcon(), primary: true },
  { path: "/analytics", label: "Stats", icon: statsIcon() },
];

export function renderNav(el) {
  el.innerHTML = "";
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "nav-item" + (item.primary ? " primary" : "");
    btn.type = "button";
    btn.innerHTML = `<span class="nav-icon">${item.icon}</span><span class="nav-label">${item.label}</span>`;
    btn.addEventListener("click", () => navigate(item.path));
    el.appendChild(btn);
  });

  const sync = () => {
    const path = currentPath();
    Array.from(el.children).forEach((child, i) => {
      const item = items[i];
      const active =
        (item.path === "/" && path === "/") ||
        (item.path !== "/" && path.startsWith(item.path));
      child.classList.toggle("is-active", active);
    });
  };

  sync();
  document.addEventListener("route:changed", sync);
}

function bagsIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>`;
}

function plusIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;
}

function statsIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>`;
}
