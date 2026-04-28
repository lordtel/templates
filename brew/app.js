import { initSentry, captureException, setSentryUser } from "./core/sentry.js";
import { onAuthChange, signOut } from "./core/auth.js";
import {
  loadInitialData,
  resetStore,
  migrateLegacyLocalStorage,
  migrateGuestData,
  isGuest,
  enterGuestMode,
  prepareGuestMerge,
  loadGuestData,
} from "./core/store.js";
import { initRouter } from "./core/router.js";
import { renderNav } from "./features/nav/nav.js";
import { renderEquipStrip } from "./features/equipment/strip.js";
import { renderSignIn } from "./features/sign-in/sign-in.js";
import { renderOnboarding } from "./features/onboarding/onboarding.js";
import { render as renderHome } from "./features/home/home.js";
import { render as renderBagForm } from "./features/bag-form/bag-form.js";
import { render as renderBagDetail } from "./features/bag-detail/bag-detail.js";
import { render as renderRatingForm } from "./features/rating-form/rating-form.js";
import { render as renderDialIn } from "./features/dial-in/dial-in.js";
import { render as renderAnalytics } from "./features/analytics/analytics.js";
import { render as renderEquipment } from "./features/equipment/equipment.js";
import { render as renderAbout } from "./features/about/about.js";
import { render as renderPrivacy } from "./features/privacy/privacy.js";
import { render as renderChangelog } from "./features/changelog/changelog.js";
import { maybeShowWhatsNew } from "./features/whats-new/whats-new.js";

initSentry();

const viewEl = document.getElementById("view");
const navEl = document.getElementById("nav");
const equipEl = document.getElementById("equip-strip");
const footerEl = document.getElementById("app-footer");
const bannerEl = document.getElementById("guest-banner");

const routes = [
  { path: "/", render: renderHome },
  { path: "/bag/new", render: renderBagForm },
  { path: "/bag/:id", render: renderBagDetail },
  { path: "/bag/:id/edit", render: (c, p) => renderBagForm(c, p) },
  { path: "/bag/:id/rate/:drink", render: renderRatingForm },
  { path: "/bag/:id/dial-in", render: renderDialIn },
  { path: "/bag/:id/dial-in/:logId", render: renderDialIn },
  { path: "/analytics", render: renderAnalytics },
  { path: "/equipment", render: renderEquipment },
  { path: "/about", render: renderAbout },
  { path: "/privacy", render: renderPrivacy },
  { path: "/changelog", render: renderChangelog },
];

let bootedOnce = false;
let currentUserId = null;
let currentGuest = false;
let routerStarted = false;

function bootGuest() {
  currentUserId = null;
  currentGuest = true;
  bootedOnce = true;
  loadGuestData();
  navEl.hidden = false;
  equipEl.hidden = false;
  renderGuestBanner(true);
  renderFooter(null);

  if (!routerStarted) {
    renderNav(navEl);
    renderEquipStrip(equipEl);
    initRouter(viewEl, routes);
    routerStarted = true;
  } else {
    location.hash = "";
  }
  maybeShowWhatsNew();
}

async function boot(session) {
  const newUserId = session?.user?.id ?? null;

  if (!session && isGuest()) {
    if (bootedOnce && currentGuest) return;
    bootGuest();
    return;
  }

  if (bootedOnce && newUserId === currentUserId && !currentGuest) {
    renderFooter(session?.user ?? null);
    return;
  }
  bootedOnce = true;
  currentUserId = newUserId;
  currentGuest = false;

  if (!session) {
    resetStore();
    navEl.hidden = true;
    equipEl.hidden = true;
    renderGuestBanner(false);
    renderFooter(null);
    renderSignIn(viewEl, { onGuest: () => { enterGuestMode(); bootGuest(); } });
    return;
  }

  navEl.hidden = false;
  equipEl.hidden = false;
  renderGuestBanner(false);
  renderFooter(session.user);
  setSentryUser(session.user);

  viewEl.innerHTML = `<div class="empty-state"><h2>Loading your shelf…</h2></div>`;

  try {
    await migrateLegacyLocalStorage();
  } catch (err) {
    captureException(err, { where: "boot.migrate" });
  }

  try {
    await migrateGuestData();
  } catch (err) {
    captureException(err, { where: "boot.migrateGuest" });
  }

  let loaded = false;
  for (let attempt = 1; attempt <= 3 && !loaded; attempt++) {
    try {
      await loadInitialData(session.user.id);
      loaded = true;
    } catch (err) {
      captureException(err, { where: "boot.loadInitialData", attempt });
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }
  if (!loaded) {
    viewEl.innerHTML = `
      <div class="empty-state">
        <h2>Couldn't load your data</h2>
        <p>Your connection dropped. Try again — your data is safe on the server.</p>
        <div class="empty-cta"><button type="button" class="btn" id="boot-retry-btn">Retry</button></div>
      </div>
    `;
    viewEl.querySelector("#boot-retry-btn")?.addEventListener("click", () => {
      bootedOnce = false;
      currentUserId = null;
      boot(session);
    });
    return;
  }

  const onboardKey = `crema.onboarded.${session.user.id}.v1`;
  const needsOnboarding = !localStorage.getItem(onboardKey);

  if (needsOnboarding && !routerStarted) {
    navEl.hidden = true;
    equipEl.hidden = true;
    renderOnboarding(viewEl, {
      onDone: () => {
        try { localStorage.setItem(onboardKey, "1"); } catch {}
        navEl.hidden = false;
        equipEl.hidden = false;
        renderNav(navEl);
        renderEquipStrip(equipEl);
        initRouter(viewEl, routes);
        routerStarted = true;
        maybeShowWhatsNew();
      },
    });
    return;
  }

  if (!routerStarted) {
    renderNav(navEl);
    renderEquipStrip(equipEl);
    initRouter(viewEl, routes);
    routerStarted = true;
  } else {
    location.hash = "";
  }
  maybeShowWhatsNew();
}

function renderFooter(user) {
  if (!footerEl) return;
  const links = `
    <div class="footer-links">
      <a href="#/about">How it works</a>
      <a href="#/changelog">What's new</a>
      <a href="#/privacy">Privacy</a>
      <a href="https://buymeacoffee.com/cremacoffee" target="_blank" rel="noopener" class="bmc-link" title="Keeps the app free and ad-free">
        <span class="bmc-ico" aria-hidden="true">
          <svg viewBox="0 0 20 20" width="14" height="14"><path d="M4 7h12l-1 7.5a3 3 0 0 1-3 2.5H8a3 3 0 0 1-3-2.5L4 7Zm3-3.5a.8.8 0 1 1 1.6 0 1.4 1.4 0 0 0 .8 1.3.8.8 0 1 1-.8 1.4 3 3 0 0 1-1.6-2.7ZM11 3.2a.8.8 0 1 1 1.6 0 1.4 1.4 0 0 0 .8 1.3.8.8 0 1 1-.8 1.4 3 3 0 0 1-1.6-2.7Z" fill="currentColor"/></svg>
        </span>
        Buy me a coffee
      </a>
    </div>
  `;
  if (currentGuest) {
    footerEl.innerHTML = `
      ${links}
      <div class="footer-meta">
        <span class="who">Guest</span>
        <span aria-hidden="true" class="dot-sep">·</span>
        <button type="button" class="linklike" id="exit-guest-btn">Sign in instead</button>
      </div>
    `;
    footerEl.querySelector("#exit-guest-btn")?.addEventListener("click", () => {
      prepareGuestMerge();
      location.reload();
    });
    return;
  }
  if (!user) {
    footerEl.innerHTML = `${links}<div class="footer-meta"><span>Made by Nour</span></div>`;
    return;
  }
  const email = user.email ?? "";
  const short = email.length > 24 ? email.slice(0, 21) + "…" : email;
  footerEl.innerHTML = `
    ${links}
    <div class="footer-meta">
      <span class="who">${escapeHtml(short)}</span>
      <span aria-hidden="true" class="dot-sep">·</span>
      <button type="button" class="linklike" id="sign-out-btn">Sign out</button>
    </div>
  `;
  footerEl.querySelector("#sign-out-btn")?.addEventListener("click", async () => {
    await signOut();
  });
}

function renderGuestBanner(show) {
  if (!bannerEl) return;
  if (!show) {
    bannerEl.hidden = true;
    bannerEl.innerHTML = "";
    return;
  }
  bannerEl.hidden = false;
  bannerEl.innerHTML = `
    <span>Guest mode — your data lives only on this device, no guarantee it'll stick around.</span>
    <button type="button" class="linklike" id="banner-signin">Sign in to sync</button>
  `;
  bannerEl.querySelector("#banner-signin")?.addEventListener("click", () => {
    prepareGuestMerge();
    location.reload();
  });
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

onAuthChange((session) => boot(session));

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      captureException(err, { where: "sw.register" });
    });
  });
}

document.addEventListener("crema:save-error", (e) => {
  const msg = e.detail?.label ?? "Couldn't save — check your connection.";
  const existing = document.getElementById("crema-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "crema-toast";
  toast.className = "toast";
  toast.setAttribute("role", "alert");
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast--show"));
  setTimeout(() => {
    toast.classList.remove("toast--show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 4000);
});
