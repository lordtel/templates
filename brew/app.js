import { initSentry, captureException, setSentryUser } from "./core/sentry.js";
import { onAuthChange, signOut } from "./core/auth.js";
import {
  loadInitialData,
  resetStore,
  migrateLegacyLocalStorage,
  isGuest,
  enterGuestMode,
  exitGuestMode,
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
    await loadInitialData(session.user.id);
  } catch (err) {
    captureException(err, { where: "boot.loadInitialData" });
    viewEl.innerHTML = `<div class="empty-state"><h2>Couldn't load your data</h2><p>Check your connection and refresh. If it keeps failing, sign out and back in.</p></div>`;
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
}

function renderFooter(user) {
  if (!footerEl) return;
  if (currentGuest) {
    footerEl.innerHTML = `
      <a href="#/about">How it works</a>
      <span aria-hidden="true">·</span>
      <span class="who">Guest</span>
      <span aria-hidden="true">·</span>
      <button type="button" class="linklike" id="exit-guest-btn">Sign in instead</button>
    `;
    footerEl.querySelector("#exit-guest-btn")?.addEventListener("click", () => {
      exitGuestMode();
      location.reload();
    });
    return;
  }
  if (!user) {
    footerEl.innerHTML = `<a href="#/about">How it works</a> <span aria-hidden="true">·</span> <span>Made by Nour</span>`;
    return;
  }
  const email = user.email ?? "";
  const short = email.length > 24 ? email.slice(0, 21) + "…" : email;
  footerEl.innerHTML = `
    <a href="#/about">How it works</a>
    <span aria-hidden="true">·</span>
    <span class="who">${escapeHtml(short)}</span>
    <span aria-hidden="true">·</span>
    <button type="button" class="linklike" id="sign-out-btn">Sign out</button>
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
    exitGuestMode();
    location.reload();
  });
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

onAuthChange((session) => boot(session));
