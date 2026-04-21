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
        <h2>Install as an app</h2>
        <p>Crema runs best from your Home Screen — full-screen, no browser bar, with its own icon. It takes ten seconds.</p>

        <div class="install-block">
          <div class="install-head">
            <span class="install-chip">iPhone · Safari</span>
          </div>
          <ol class="install-steps">
            <li><span class="install-num">1</span><span>Open <strong>crema.live</strong> in Safari (it has to be Safari — Chrome and others can't install web apps on iOS).</span></li>
            <li><span class="install-num">2</span><span>Tap the <strong>Share</strong> icon
              <svg class="install-ico" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              at the bottom of the screen.</span></li>
            <li><span class="install-num">3</span><span>Scroll and pick <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</span></li>
          </ol>
        </div>

        <div class="install-block">
          <div class="install-head">
            <span class="install-chip">Android · Chrome</span>
          </div>
          <ol class="install-steps">
            <li><span class="install-num">1</span><span>Open <strong>crema.live</strong> in Chrome.</span></li>
            <li><span class="install-num">2</span><span>Tap the <strong>⋮</strong> menu, then <strong>Install app</strong> (or <strong>Add to Home Screen</strong>).</span></li>
          </ol>
        </div>

        <p class="install-foot">Once installed it launches standalone and survives Safari's aggressive storage eviction — your bags won't disappear on you.</p>
      </section>

      <section class="card about-card">
        <h2>Replay the intro</h2>
        <p>Want to show someone the pitch, or miss the jokes?</p>
        <button class="btn ghost small" type="button" id="replay-btn">Replay intro</button>
      </section>

      <section class="card about-card">
        <h2>Found a bug? Got an idea?</h2>
        <p>Crema is a one-person side project — feedback is the difference between a feature landing next week and never. Tell me what broke, what felt off, or what you wish was here.</p>
        <a class="btn small" href="mailto:nour@crema.live?subject=Crema%20feedback" rel="noopener">Email Nour</a>
      </section>

      <p class="about-ph">
        <a href="https://www.producthunt.com/products/crema-3?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-crema-3" target="_blank" rel="noopener noreferrer" aria-label="Crema on Product Hunt">
          <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1128894&theme=dark&t=1776785283385" alt="Crema — Your espresso, dialed in. | Product Hunt" width="180" height="39" loading="lazy" />
        </a>
      </p>
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
