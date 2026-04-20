# Reddit launch — draft posts

Three drafts for different subs. Don't cross-post the same one — Reddit's automod
hates that. Space them out by a day or two. Post around 9am US East / 2pm UK on a
weekday for espresso subs.

Reply to every comment in the first 2 hours. Admit limits. Don't get defensive.

---

## r/espresso (primary audience)

**Title:**
I built a tiny web app to log bags and dial in espresso — curious what you think

**Body:**

I kept buying new bags, scribbling "18 in / 38 out / 28s" on the back with a
Sharpie, losing the notes, buying the same bag three months later and
re-dialing from scratch. So I built the tool I wanted.

It's called Crema. It's a web app — no install required, works on your phone
browser, and you can add it to your Home Screen so it launches like a native
app.

What it does:

- Snap the bag, OCR pulls out the brand, origin, roast, weight
- Log each dial-in attempt — it does the ratio and per-shot cost for you
- Rate each drink type per bag (espresso, cortado, iced latte, cappuccino) 1–5
- After a few ratings it suggests a starting grind for new bags based on what
  worked for you on similar roasts — weighted by how high you rated them
- Finished a bag? Mark it finished, it moves off the shelf to your history
- Your whole journal in one page: top picks, grind sweet spot per drink,
  30-day timeline

Free. No ads. No email required (there's a guest mode that keeps everything on
your device). Sign in if you want it to sync across phone and laptop. It's a
side project so I'm eating the hosting — there's a Buy Me A Coffee link in the
app if it ever saves you a bag's worth of beans.

Link: [crema.live](https://crema.live)

Would love feedback, especially from people who've gone further down the
rabbit hole than me. What's missing? What's annoying? Fire away.

---

## r/SideProject

**Title:**
Crema — a quiet espresso journal I built to stop re-dialing the same bag twice

**Body:**

Side project I've been chipping away at for a few months. It scratches my own
itch: I kept losing the Sharpie notes on the back of my coffee bags.

**What it does**

A web app (PWA, installs to Home Screen) where you log each coffee bag, rate
the drinks you make from it, and it learns which grind setting works best for
you on each kind of roast. The dial-in log gives you ratio, per-shot cost, and
a timeline of attempts.

**Stack**

- Vanilla JS — no framework, no build step, ES modules straight to the browser
- Supabase for auth + Postgres + photo storage + RLS
- Tesseract.js for client-side OCR of bag labels
- GitHub Pages on a custom domain
- Fraunces + Inter for the typography
- Sentry for errors
- Single CSS file + feature-folder architecture (`features/<feature>/<feature>.{js,css}`)

**Design choices that paid off**

- Guest mode — no email wall. Lots of "try before you log in" conversions.
- OCR first, form second — you snap and the fields fill themselves.
- Every photo runs through an in-app 4:5 crop/rotate/enhance editor so the
  shelf looks uniform.
- The grind recommendation is weighted by your own rating history — it gets
  smarter the more you use it.

**What's hard**

- OCR quality on matte roaster labels is rough. I'm debating a light
  server-side fallback.
- Retention is the real test — will check back in a month.

Link: [crema.live](https://crema.live) · Feedback super welcome.

---

## r/coffee (short, community-first — DON'T lead with "I built")

**Title:**
Tired of losing grind notes between bags — made something to keep track

**Body:**

I used to write dial-in notes on the back of the bag with a Sharpie and then
lose them. Or forget the grind setting when I bought the same bean three months
later.

I spun up a free web tool for it: log bags, rate your drinks out of five, and
it starts suggesting starting grind settings for new bags based on your
ratings on similar roasts. No accounts needed to try it (guest mode).

crema.live

Not selling anything, no ads. Happy to hear what you'd change.

---

## Carousel

Open `docs/carousel/index.html` in a browser. Each slide is 1080×1350 (Reddit's
4:5 sweet spot). Right-click each slide → "Capture node screenshot" in
Chrome/Edge devtools, or use a full-page screenshot tool. The slides:

1. Cover — wordmark + tagline
2. Snap → auto-fill
3. Rate each brew
4. It learns your sweet spot
5. Your coffee journal
6. crema.live — call to action
