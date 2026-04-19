const SLIDES = [
  {
    eyebrow: "Welcome",
    title: "You don't need another app.",
    body: "Your phone is a graveyard of habits you tried once. A sleep tracker you outsmarted. A journal that lasted three days. A running app with a single 2 km PR from 2022. The last thing the world needs is another icon.",
    art: "mug",
  },
  {
    eyebrow: "Unless…",
    title: "You take your coffee seriously.",
    body: "You own a scale you don't use for baking. You have opinions about milk temperature. You've said the word \"crema\" in public, unprompted. Your friends sigh when you mention dialing in.",
    tail: "This one's for you.",
    art: "beans",
  },
  {
    eyebrow: "How it works",
    title: "Log once. Rate four times.",
    body: "Snap a photo of the bag — the OCR fills in the boring fields. Then brew it four ways: espresso, iced americano, iced latte, cappuccino. Rate each, jot the grind.",
    tail: "Crema remembers. Over time it nudges the grind slider toward the number that actually tasted good — weighted by roast, origin, and your ratings.",
    art: "dial",
  },
  {
    eyebrow: "No feed. No streaks.",
    title: "Your shelf. Your data. Your grind.",
    body: "Everything syncs to a private Postgres row tied to your Google account. No ads, no social feed, no leaderboards, no push notifications nagging you to log today's cortado.",
    tail: "Just you, your shelf, and a quietly smarter slider.",
    art: "shelf",
  },
];

export function renderOnboarding(container, { onDone }) {
  let index = 0;

  container.innerHTML = `
    <div class="onboard">
      <button type="button" class="onboard-skip" id="skip-btn">Skip</button>

      <div class="onboard-stage" id="stage"></div>

      <div class="onboard-foot">
        <button type="button" class="onboard-back" id="back-btn" aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div class="onboard-dots" id="dots" role="tablist" aria-label="Intro progress"></div>
        <button type="button" class="btn onboard-next" id="next-btn"></button>
      </div>
    </div>
  `;

  const stage = container.querySelector("#stage");
  const dotsEl = container.querySelector("#dots");
  const nextBtn = container.querySelector("#next-btn");
  const backBtn = container.querySelector("#back-btn");
  const skipBtn = container.querySelector("#skip-btn");

  const paint = () => {
    const slide = SLIDES[index];
    stage.innerHTML = `
      <div class="onboard-slide" key="${index}">
        <div class="onboard-art">${art(slide.art)}</div>
        <p class="onboard-eyebrow">${slide.eyebrow}</p>
        <h1 class="onboard-title">${slide.title}</h1>
        <p class="onboard-body">${slide.body}</p>
        ${slide.tail ? `<p class="onboard-tail">${slide.tail}</p>` : ""}
      </div>
    `;

    dotsEl.innerHTML = SLIDES.map(
      (_, i) => `<span class="onboard-dot${i === index ? " on" : ""}" aria-current="${i === index}"></span>`
    ).join("");

    backBtn.hidden = index === 0;
    const isLast = index === SLIDES.length - 1;
    nextBtn.textContent = isLast ? "Start logging" : "Next";
    skipBtn.hidden = isLast;
  };

  const finish = () => onDone();

  nextBtn.addEventListener("click", () => {
    if (index === SLIDES.length - 1) {
      finish();
    } else {
      index += 1;
      paint();
    }
  });

  backBtn.addEventListener("click", () => {
    if (index > 0) {
      index -= 1;
      paint();
    }
  });

  skipBtn.addEventListener("click", finish);

  paint();
}

function art(kind) {
  if (kind === "mug") {
    return `
      <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M26 44h54v34a18 18 0 0 1-18 18H44a18 18 0 0 1-18-18V44z"/>
        <path d="M80 52h8a12 12 0 0 1 0 24h-8"/>
        <path d="M40 28c0 4-4 4-4 8s4 4 4 8" opacity="0.6"/>
        <path d="M54 24c0 4-4 4-4 8s4 4 4 8" opacity="0.6"/>
        <path d="M68 28c0 4-4 4-4 8s4 4 4 8" opacity="0.6"/>
      </svg>
    `;
  }
  if (kind === "beans") {
    return `
      <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="44" cy="56" rx="20" ry="30" transform="rotate(-20 44 56)"/>
        <path d="M32 40c6 10 6 22 0 32" transform="rotate(-20 44 56)"/>
        <ellipse cx="78" cy="72" rx="20" ry="30" transform="rotate(20 78 72)"/>
        <path d="M66 56c6 10 6 22 0 32" transform="rotate(20 78 72)"/>
      </svg>
    `;
  }
  if (kind === "dial") {
    return `
      <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="60" cy="60" r="42"/>
        <circle cx="60" cy="60" r="8" fill="currentColor" stroke="none"/>
        <path d="M60 18v8M60 94v8M18 60h8M94 60h8M30 30l6 6M84 84l6 6M30 90l6-6M84 36l6-6"/>
        <path d="M60 60l20-12" stroke-width="3"/>
      </svg>
    `;
  }
  if (kind === "shelf") {
    return `
      <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 46h84M18 82h84"/>
        <rect x="28" y="22" width="14" height="24" rx="2"/>
        <rect x="48" y="14" width="14" height="32" rx="2"/>
        <rect x="68" y="26" width="14" height="20" rx="2"/>
        <rect x="34" y="58" width="14" height="24" rx="2"/>
        <rect x="56" y="50" width="14" height="32" rx="2"/>
        <rect x="78" y="62" width="14" height="20" rx="2"/>
      </svg>
    `;
  }
  return "";
}
