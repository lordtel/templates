import { signInWithGoogle } from "../../core/auth.js";
import { captureException } from "../../core/sentry.js";

export function renderSignIn(container) {
  container.innerHTML = `
    <div class="sign-in">
      <div class="sign-in-mark" aria-hidden="true"></div>
      <h1>Crema</h1>
      <p class="sign-in-tag">Your espresso journal — bags, ratings, and a grind that tunes itself.</p>
      <div class="sign-in-card">
        <p class="sign-in-copy">Sign in to sync across devices. Your data stays in your private Supabase space — only you can see it.</p>
        <button class="btn google" type="button" id="google-btn">
          <span class="g-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" width="18" height="18"><path fill="#4285F4" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 1 1-3.3-13l5.7-5.7A20 20 0 1 0 44 24a20 20 0 0 0-.4-3.5z"/><path fill="#34A853" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12a12 12 0 0 1 7.6 2.7l5.7-5.7A20 20 0 0 0 6.3 14.7z"/><path fill="#FBBC05" d="M24 44a20 20 0 0 0 13.5-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.6 5.1A20 20 0 0 0 24 44z"/><path fill="#EA4335" d="M43.6 20.5H42V20H24v8h11.3a12.1 12.1 0 0 1-4.1 5.6l6.2 5.2C41.4 36 44 30.5 44 24a20 20 0 0 0-.4-3.5z"/></svg>
          </span>
          Continue with Google
        </button>
        <p class="sign-in-note" id="err"></p>
      </div>
      <p class="sign-in-footer">By continuing you agree to store your bags + ratings in a private database. You can delete everything anytime.</p>
    </div>
  `;

  const btn = container.querySelector("#google-btn");
  const errEl = container.querySelector("#err");
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    errEl.textContent = "";
    try {
      await signInWithGoogle();
    } catch (err) {
      btn.disabled = false;
      errEl.textContent = "Couldn't open Google sign-in. Try again?";
      captureException(err, { where: "signInWithGoogle" });
    }
  });
}
