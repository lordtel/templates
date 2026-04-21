import { navigate } from "../../core/router.js";

const ENTRIES = [
  {
    date: "2026-04-21",
    title: "Launch polish",
    tag: "polish",
    items: [
      "Guest data now merges into your account when you sign in — no more lost bags the moment you switch from guest mode.",
      "Export everything as JSON from the Privacy page (works in guest mode too).",
      "Retry button if Supabase hiccups on boot, with three silent retries before it shows up.",
      "OCR: save buttons disable while the label is being scanned, and a 'this can take a moment' nudge shows up if the engine is warming up cold.",
      "Photo editor: Escape key cancels, backdrop tap cancels, and the resize listener is torn down with the modal instead of leaking.",
      "Fixed a divide-by-zero in the dial-in recipe ratio and per-shot cost when dose was zero.",
      "Fixed a NaN that could slip into the starter-grind hint when the recommender had nothing to go on.",
      "Added a bug-report mailto on the About page.",
      "iOS status-bar meta for a cleaner standalone look on iPhone.",
      "robots.txt + sitemap.xml for search engines.",
      "Rewrote the README — storage paragraph was out of date.",
    ],
  },
  {
    date: "2026-04-20",
    title: "Active & Finished bags",
    tag: "new",
    items: [
      "Mark a bag as finished when you're done — it moves to the 'Finished' tab instead of cluttering your shelf.",
      "The shelf now has Active / Finished tabs with counts so your history is preserved but out of the way.",
      "This changelog page, so you can follow what's new.",
    ],
  },
  {
    date: "2026-04-18",
    title: "Privacy, errors & shared links",
    tag: "polish",
    items: [
      "Added a Privacy Policy page linked from the footer and the sign-in screen.",
      "Shared links like crema.live/bag/xyz now resolve correctly on first load.",
      "Save errors (connection drops, quota limits) show a toast instead of failing silently.",
    ],
  },
  {
    date: "2026-04-15",
    title: "Now on crema.live",
    tag: "new",
    items: [
      "Moved to the crema.live custom domain.",
      "New OG image and social previews — links unfurl with a proper card on iMessage, Slack, Twitter.",
      "Redesigned the dial-in summary on each bag page — cleaner stat chips.",
    ],
  },
  {
    date: "2026-04-10",
    title: "Dial-In Companion",
    tag: "new",
    items: [
      "Log dial-in attempts per bag with dose, yield, time, grind, taste, and texture.",
      "Mark a recipe as 'dialed in' once you're happy — it locks in as the target for that bag.",
      "Rating suggestions now factor in your dialed-in recipe for more accurate grind hints.",
    ],
  },
  {
    date: "2026-04-05",
    title: "Guest mode",
    tag: "new",
    items: [
      "Try Crema without signing in — everything stays in your browser until you sign in to sync.",
      "Espresso dose is now per-bag instead of global, so different coffees can use different doses.",
    ],
  },
  {
    date: "2026-04-01",
    title: "UX polish batch",
    tag: "polish",
    items: [
      "Price per 250g shown alongside price per shot on each bag card.",
      "Add custom drinks beyond the default four (Flat white, Cortado, V60…).",
      "Settable dose from equipment page.",
      "Click the brand name in a bag to search the web for it.",
    ],
  },
  {
    date: "2026-03-25",
    title: "The first pour",
    tag: "new",
    items: [
      "Crema launched: log bags, rate each brew as espresso / iced americano / iced latte / cappuccino.",
      "OCR bag labels in your browser — no photos leave the device during scanning.",
      "Syncs across devices via Google sign-in.",
    ],
  },
];

export function render(container) {
  container.innerHTML = `
    <button type="button" class="back-btn"><span aria-hidden="true">‹</span> Back</button>

    <div class="page-head">
      <div>
        <p class="eyebrow">What's new</p>
        <h1>Changelog</h1>
      </div>
    </div>

    <ol class="changelog">
      ${ENTRIES.map(renderEntry).join("")}
    </ol>
  `;

  container.querySelector(".back-btn").addEventListener("click", () => {
    if (history.length > 1) history.back();
    else navigate("/");
  });
}

function renderEntry(e) {
  const tagClass = `tag-${e.tag || "polish"}`;
  return `
    <li class="changelog-entry">
      <div class="changelog-meta">
        <time datetime="${e.date}">${formatDate(e.date)}</time>
        ${e.tag ? `<span class="changelog-tag ${tagClass}">${escapeHtml(e.tag)}</span>` : ""}
      </div>
      <div class="changelog-body">
        <h2>${escapeHtml(e.title)}</h2>
        <ul>${e.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
      </div>
    </li>
  `;
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y) return iso;
  const date = new Date(y, (m || 1) - 1, d || 1);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
