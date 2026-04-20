import { navigate } from "../../core/router.js";

export function render(container) {
  container.innerHTML = `
    <button type="button" class="back-btn"><span aria-hidden="true">‹</span> Back</button>

    <div class="page-head">
      <div>
        <p class="eyebrow">Legal</p>
        <h1>Privacy Policy</h1>
      </div>
    </div>

    <div class="about">
      <p class="privacy-updated">Last updated: April 2026</p>

      <section class="card about-card">
        <h2>What this app is</h2>
        <p>Crema is a personal espresso journal. It helps you log coffee bags, rate brews, and tune your grind. It is made and operated by Nour (an individual), not a company.</p>
      </section>

      <section class="card about-card">
        <h2>What we collect</h2>
        <ul class="about-list">
          <li><strong>Account info</strong> — your Google email address and Google account ID, provided when you sign in. Used only to identify your data.</li>
          <li><strong>Coffee data</strong> — bag details (brand, origin, roast, notes, photo), ratings, grind settings, and dial-in logs that you enter yourself.</li>
          <li><strong>Photos</strong> — bag photos you optionally upload. Stored securely and linked to your account only.</li>
          <li><strong>Equipment preferences</strong> — your chosen machine and grinder model.</li>
          <li><strong>Crash reports</strong> — anonymous error reports via Sentry when the app breaks. These include device type and browser version, but never your email, photos, or coffee data.</li>
        </ul>
      </section>

      <section class="card about-card">
        <h2>What we don't collect</h2>
        <ul class="about-list">
          <li>No passwords — authentication is handled entirely by Google.</li>
          <li>No payment information — Crema is free.</li>
          <li>No tracking pixels, ad networks, or analytics beyond crash reporting.</li>
          <li>OCR (label scanning) runs entirely in your browser — photos are never sent anywhere during that step.</li>
        </ul>
      </section>

      <section class="card about-card">
        <h2>Where your data lives</h2>
        <ul class="about-list">
          <li><strong>Supabase</strong> — database and photo storage. Your rows are protected by Row Level Security, meaning only you can read or write your data. Supabase runs on AWS infrastructure.</li>
          <li><strong>Google OAuth</strong> — handles sign-in. Your Google password never touches our servers.</li>
          <li><strong>Sentry</strong> — crash reporting only. No personal data is included in error reports.</li>
        </ul>
      </section>

      <section class="card about-card">
        <h2>Guest mode</h2>
        <p>If you use Guest mode, everything stays in your browser's localStorage — nothing is sent to any server. Clearing your browser data or switching devices will erase it permanently. There is no account to delete in guest mode.</p>
      </section>

      <section class="card about-card">
        <h2>Deleting your data</h2>
        <p>You can delete individual bags (and their photos) from within the app at any time. To delete your entire account and all associated data, email <strong>nour@crema.live</strong> and we'll wipe it within 7 days.</p>
      </section>

      <section class="card about-card">
        <h2>Changes to this policy</h2>
        <p>If anything meaningful changes, the "last updated" date at the top will reflect it. For a personal app like this, that's unlikely to happen often.</p>
      </section>

      <section class="card about-card">
        <h2>Contact</h2>
        <p>Questions? <strong>nour@crema.live</strong></p>
      </section>
    </div>
  `;

  container.querySelector(".back-btn").addEventListener("click", () => {
    if (history.length > 1) history.back();
    else navigate("/");
  });
}
