# Crema — copy deck

Everything you need to talk about Crema. Mix and match.

---

## Taglines

**Primary (use this as often as possible):**
> Your espresso, dialed in.

**Alt short lines:**
- A quiet espresso journal.
- Log the bag. Nail the recipe.
- Stop re-dialing the same bag twice.
- Remember what worked.
- One shelf for every bag you pull from.

---

## One-liners

**25 chars:**
> Espresso, dialed in.

**50 chars:**
> A quiet espresso journal that remembers.

**80 chars:**
> Log every bag. Rate every brew. Crema learns which grind actually works for you.

**160 chars (meta description):**
> Log coffee bags, rate each brew, and get tuned grind suggestions over time. Free, no ads, works in your phone browser. Guest mode, no email required.

---

## Elevator pitches

**30 words:**
> Crema is a free espresso journal for your phone. Snap a bag, OCR fills the details, rate each brew, and Crema suggests the grind that's worked for you on similar roasts.

**60 words:**
> Crema is the tool you wish was on the back of every coffee bag. Snap the label and OCR pulls out brand, origin, roast and weight. Log each dial-in attempt with dose, yield, time and grind. Rate the drinks you make and Crema starts suggesting grind settings based on what actually worked for you. Web app, guest mode, no ads.

**100 words — for a Product Hunt / directory:**
> Crema is a small, beautifully-opinionated espresso journal. Photograph a new bag and on-device OCR extracts the details. Track each dial-in attempt — dose, yield, time, grind, taste, texture — and rate the drinks you make (espresso, cortado, iced latte, cappuccino, or your own). As your history grows, Crema suggests starting grind settings for new bags based on your own ratings on similar roasts. No app store, no account wall (guest mode keeps everything local), no tracking, no ads. Runs as a PWA, installs to your Home Screen, syncs across devices when you sign in.

---

## Feature list

- **Snap → auto-fill.** Client-side OCR extracts brand, origin, process, roast, weight, altitude, and tasting notes from the bag label.
- **Photo editor built in.** A 4:5 crop/rotate/enhance modal keeps your shelf visually consistent.
- **Per-bag dial-in companion.** Log every pull with dose, yield, time, grind, taste, and texture. The ratio and per-shot cost are computed for you.
- **Mark a recipe as dialed in.** Lock in the target once you're happy. Re-open it when you want to change things.
- **Four standard drinks + custom.** Espresso, iced americano, iced latte, cappuccino — or add your own (cortado, flat white, V60, whatever).
- **Ratings that teach.** Star each drink you pull from a bag and Crema suggests starting grind for your next bag, weighted by how highly you rated similar roasts.
- **Active / Finished shelf.** Mark a bag as finished and it moves to history without cluttering your active shelf.
- **A real journal.** Top picks, 30-day timeline, grinder sweet-spot chart, bag count, rating average.
- **Your grinder, your scale.** Pick your grinder and the slider snaps to its native units (clicks, numbers, turns).
- **Guest mode.** Try everything without signing in — your data stays in your browser.
- **Account sync.** Sign in with Google to have your shelf follow you to any device. Guest data is merged into your account on first sign-in.
- **Export anytime.** One-click JSON export of every bag, rating, dial-in, and equipment preference.
- **Install to Home Screen.** Full-screen PWA with its own icon — feels like a native app.
- **Secure by default.** Row-level security on every Supabase table, private photo storage, Google OAuth. No passwords on our side.
- **Zero ads, zero tracking.** Anonymous crash reports (Sentry) are the only telemetry, and they never contain your data.

---

## FAQ

**Is this free?**
Yes. Free, no ads. There's a Buy Me A Coffee link if it ever saves you a bag's worth of beans.

**Does it work on iPhone / Android?**
It's a PWA — open crema.live in any modern browser. iPhone users should use Safari and "Add to Home Screen" so it installs as an app. Android users get an "Install app" prompt in Chrome.

**Do I need to sign up?**
No. Tap "Continue as guest" and everything stays in your browser. Sign in with Google only when you want sync across devices.

**Where is my data?**
Signed in: Supabase (Postgres with row-level security + private photo bucket). Guest mode: your browser's localStorage. OCR runs entirely on-device — photos never leave your phone during scanning.

**What makes the grind suggestions accurate?**
They're weighted by your own ratings. The more 4- and 5-star pulls you log, the more Crema leans on those recipes when you add a new bag of similar roast and origin.

**Can I export my data?**
Yes. Privacy page → "Download my data (.json)". Works in guest mode too.

**Is there an iOS / Android app?**
Not separately — the PWA installs to Home Screen with its own icon and launches standalone. One codebase, one URL, no store review.

**How was it built?**
Vanilla JS, ES modules, no build step. Supabase for auth/DB/storage. Tesseract.js for client-side OCR. Sentry for crash reports. Deployed on GitHub Pages at crema.live.

**Who made this?**
Nour. It's a side project — feedback goes to nour@crema.live.

---

## Hashtags

`#espresso` `#coffeelovers` `#baristadaily` `#homeespresso` `#coffeejournal` `#specialtycoffee` `#buildinpublic` `#indiehackers` `#sideproject` `#webapp` `#pwa`

---

## Credits

- Design & code: Nour
- Typefaces: Fraunces (David Jonathan Ross) · Inter (Rasmus Andersson)
- Runtime: Supabase, Tesseract.js, Sentry
- Host: GitHub Pages → crema.live

---

## Press contact

**nour@crema.live**

---

## Brand palette

| Role | Hex |
|---|---|
| Paper (light bg) | `#faf2e4` |
| Paper (deep bg) | `#e5d8bf` |
| Ink (body text) | `#2b1b12` |
| Muted text | `#6b5443` |
| Accent | `#7a3e1d` |
| Bean 1 | `#3e1e0b` |
| Bean 2 | `#7a3e1d` |
| Bean 3 | `#b98555` |
| Crema glow | `#f0d48a` |

**Typefaces:** Fraunces (display, 400/500, italic for accents) · Inter (UI, 400/500/600).
