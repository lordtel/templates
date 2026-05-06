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
              <p>Pick your machine and grinder from the <strong>Gear</strong> tab. Crema knows the click count or turn range of common grinders, so the slider in the app matches what's actually on yours.</p>
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
              <h3>It picks up your taste</h3>
              <p>Once you've rated a few bags, Crema looks at what scored well on similar roasts and suggests where to start the grind on a new one. Before that, it just picks something in the middle of your grinder's espresso range.</p>
            </div>
          </li>
        </ol>
      </section>

      <section class="card about-card">
        <h2>Your data</h2>
        <ul class="about-list">
          <li>Everything you log lives in your own row — bags, ratings, photos. Only you can read it.</li>
          <li>Sign in on any device, phone or laptop, and your shelf comes with you.</li>
          <li>OCR runs in your browser, so your photos stay on your device until you save a bag.</li>
          <li>If something crashes, a stripped-down report goes out — no passwords, no photos, just what broke.</li>
          <li>Delete a bag and its photo goes with it. Want everything gone? Sign out, email me, I'll drop the row.</li>
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

        <p class="install-foot">Once it's on your Home Screen, Safari stops clearing the data when it's bored. Your bags stick around.</p>
      </section>

      <section class="card about-card">
        <h2>Replay the intro</h2>
        <p>Want to show someone the pitch, or miss the jokes?</p>
        <button class="btn ghost small" type="button" id="replay-btn">Replay intro</button>
      </section>

      <section class="card about-card">
        <h2>Found a bug? Got an idea?</h2>
        <p>I'm one person building this on the side. If you tell me what broke or what's missing, I can usually fix it within a week. If you don't, I'll probably never notice.</p>
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
