import { navigate } from "../../core/router.js";

export function render(container) {
  container.innerHTML = `
    <button type="button" class="back-btn"><span aria-hidden="true">‹</span> Back</button>

    <div class="page-head">
      <div>
        <p class="eyebrow">About</p>
        <h1>How Crema works</h1>
      </div>
    </div>

    <div class="about">
      <section class="card about-card">
        <h2>The loop</h2>
        <ol class="about-steps">
          <li>
            <span class="step-num">1</span>
            <div>
              <h3>Set your gear</h3>
              <p>Pick your espresso machine and grinder from the <strong>Gear</strong> tab. The grinder's native scale (clicks, numbers, turns) shapes the slider and seeds starter grind suggestions.</p>
            </div>
          </li>
          <li>
            <span class="step-num">2</span>
            <div>
              <h3>Log a bag</h3>
              <p>Snap a photo and the OCR tries to pre-fill brand, origin, roast, weight. You can also type it all in — the photo is optional.</p>
            </div>
          </li>
          <li>
            <span class="step-num">3</span>
            <div>
              <h3>Rate each drink</h3>
              <p>Each bag has four slots — espresso, iced americano, iced latte, cappuccino. Open one, dial in, taste, then give it a rating and a quick note. One rating per drink per bag — update it when you dial in better.</p>
            </div>
          </li>
          <li>
            <span class="step-num">4</span>
            <div>
              <h3>Watch it tune itself</h3>
              <p>After a few ratings the new-rating screen suggests a grind based on your past results for the same roast &amp; origin (weighted by how highly you rated them). Until then it suggests a sensible starting point from your grinder's espresso range.</p>
            </div>
          </li>
        </ol>
      </section>

      <section class="card about-card">
        <h2>Your data</h2>
        <ul class="about-list">
          <li>Bags, ratings and photos sync to your own private, secure space. Only you can read them.</li>
          <li>Sign in on any device — phone, laptop — and your shelf follows.</li>
          <li>OCR runs locally in your browser, so your photos stay on your device until you save a bag.</li>
          <li>Anonymous crash reports help fix bugs — no passwords, no photos.</li>
          <li>Delete a bag and its photo goes with it. Want a full wipe? Sign out, ask Nour, we'll drop the row.</li>
        </ul>
      </section>

      <section class="card about-card">
        <h2>Install it</h2>
        <p>On iPhone: <strong>Share → Add to Home Screen</strong>.</p>
        <p>On Android Chrome: the <strong>⋮ menu → Install app</strong>.</p>
        <p>It launches standalone, no browser chrome, and survives Safari's aggressive storage eviction.</p>
      </section>

      <section class="card about-card">
        <h2>Replay the intro</h2>
        <p>Want to show someone the pitch, or miss the jokes?</p>
        <button class="btn ghost small" type="button" id="replay-btn">Replay intro</button>
      </section>
    </div>
  `;

  container.querySelector(".back-btn").addEventListener("click", () => {
    if (history.length > 1) history.back();
    else navigate("/");
  });

  container.querySelector("#replay-btn")?.addEventListener("click", async () => {
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("crema.onboarded."));
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {}
    location.reload();
  });
}
