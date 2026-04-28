// "What's new" popup — shows the latest changelog entry once after a user
// boots the app post-update, then never again.
//
// Persistence: localStorage key `crema.changelog.lastSeen.v1` holds the
// date of the most recent entry the user has dismissed. If the topmost
// entry's date is newer than that (or unset), we show the popup.
//
// First-time users: their lastSeen is silently set to the latest date so
// they don't get a "what's new" surprise on top of onboarding.

import { ENTRIES } from "../changelog/changelog.js";
import { navigate } from "../../core/router.js";

const STORAGE_KEY = "crema.changelog.lastSeen.v1";

export function maybeShowWhatsNew({ skipFirstTime = true } = {}) {
  if (!ENTRIES.length) return;
  const latest = ENTRIES[0];
  const lastSeen = readLastSeen();

  // Brand new user: silently mark as seen so onboarding isn't crowded
  if (!lastSeen) {
    if (skipFirstTime) {
      writeLastSeen(latest.date);
      return;
    }
  }

  // Up to date: nothing to show
  if (lastSeen && lastSeen >= latest.date) return;

  showPopup(latest);
}

function readLastSeen() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeLastSeen(date) {
  try {
    localStorage.setItem(STORAGE_KEY, date);
  } catch {}
}

function showPopup(entry) {
  // Avoid stacking
  if (document.querySelector(".whats-new")) return;

  const overlay = document.createElement("div");
  overlay.className = "whats-new";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "whats-new-title");
  overlay.innerHTML = `
    <div class="whats-new-panel" role="document">
      <button type="button" class="whats-new-close" aria-label="Close">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <path d="M6 6l12 12M18 6L6 18"/>
        </svg>
      </button>
      <div class="whats-new-body">
        <p class="whats-new-eyebrow">What's new${entry.tag ? ` · <span class="whats-new-tag tag-${entry.tag}">${escapeHtml(entry.tag)}</span>` : ""}</p>
        <h2 id="whats-new-title">${escapeHtml(entry.title)}</h2>
        <ul class="whats-new-items">
          ${entry.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}
        </ul>
      </div>
      <div class="whats-new-actions">
        <button type="button" class="btn ghost small" data-act="see-all">See full changelog</button>
        <button type="button" class="btn" data-act="dismiss">Got it</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  // Lock the focus inside the dialog
  const panel = overlay.querySelector(".whats-new-panel");
  panel.tabIndex = -1;
  panel.focus({ preventScroll: true });

  const close = () => {
    writeLastSeen(entry.date);
    overlay.classList.add("whats-new--leaving");
    overlay.addEventListener("transitionend", () => overlay.remove(), { once: true });
    document.removeEventListener("keydown", onKey);
  };

  const onKey = (e) => {
    if (e.key === "Escape") close();
  };

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector(".whats-new-close").addEventListener("click", close);
  overlay.querySelector('[data-act="dismiss"]').addEventListener("click", close);
  overlay.querySelector('[data-act="see-all"]').addEventListener("click", () => {
    close();
    navigate("/changelog");
  });

  document.addEventListener("keydown", onKey);

  // Trigger entrance animation on next frame
  requestAnimationFrame(() => overlay.classList.add("whats-new--show"));
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
