let currentCleanup = null;
let routes = [];
let viewEl = null;

export function initRouter(el, routeList) {
  viewEl = el;
  routes = routeList.map((r) => ({ ...r, regex: toRegex(r.path), keys: keysOf(r.path) }));
  window.addEventListener("hashchange", mount);
  mount();
}

export function navigate(path) {
  const target = "#" + path;
  if (location.hash === target) {
    mount();
  } else {
    location.hash = target;
  }
}

export function currentPath() {
  const hash = location.hash.replace(/^#/, "") || "/";
  return hash;
}

function mount() {
  if (!viewEl) return;
  if (typeof currentCleanup === "function") {
    try {
      currentCleanup();
    } catch {}
    currentCleanup = null;
  }

  const path = currentPath();
  const match = matchRoute(path);
  viewEl.innerHTML = "";
  viewEl.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: "instant" });

  if (match) {
    const cleanup = match.route.render(viewEl, match.params);
    if (typeof cleanup === "function") currentCleanup = cleanup;
  } else {
    viewEl.innerHTML = '<div class="empty-state"><h2>Not found</h2><p>That page doesn\'t exist.</p></div>';
  }

  document.dispatchEvent(new CustomEvent("route:changed", { detail: { path } }));
}

function matchRoute(path) {
  for (const r of routes) {
    const m = path.match(r.regex);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      return { route: r, params };
    }
  }
  return null;
}

function toRegex(pattern) {
  const src = pattern
    .replace(/\//g, "\\/")
    .replace(/:([a-zA-Z_]+)/g, "([^/]+)");
  return new RegExp("^" + src + "$");
}

function keysOf(pattern) {
  return Array.from(pattern.matchAll(/:([a-zA-Z_]+)/g)).map((m) => m[1]);
}
