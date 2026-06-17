# 🗺️ Stackadoo Roadmap

A living plan for where Stackadoo is going. Update freely.

> **Positioning:** the math game kids *ask* to play. Solve math → earn blocks →
> build worlds. The learning is the fuel; the building is the fun. Grades 2–5.
> No ads, no chat, kid-safe. Buyers are parents.

---

## ✅ Shipped (live now)

- **Math Meadow** — the full, free math game (adaptive grades 2–5, fresh
  questions, hint button that teaches the *method* not the answer).
- Building sandbox: blocks (paint, stack), doors/windows/roofs that orient to
  walls, furniture, a **stove & oven** with cooking, sleeping in bed, photos
  (with share), berries/trees, the Gloomies mode (stair-climbing, difficulty
  ramp, math shield), badges (cap 25), parent dashboard with a pencil-paper tip.
- **Worlds + portal** framework: pick a world, travel via the 🌀 portal,
  per-world saves, per-world themes/decor.
- **Reading City** (reading + grammar) and **Spanish Beach** (beginner Spanish)
  are built but currently **🔜 Coming Soon** (teased, not enterable).
- **Installable PWA** (works offline), bright on mobile, compact HUD chips,
  glowing animated portal.
- **Payments**: $4.99 one-time unlock wired to a Stripe payment link (test
  mode now); **dormant** while worlds are Coming Soon. Flip a world's
  `comingSoon` flag off → it becomes the paid unlock again.
- **Landing page** (`landing.html`): free-to-play framing, worlds "coming soon."

---

## 🎯 Strategy

1. **Launch the free math game now.** It's polished and genuinely good — the
   strongest first impression and the thing worth sharing.
2. **Tease the other worlds as "Coming Soon"** to build interest and *measure
   demand* before investing in the deep build (and before charging anyone).
3. **Build Reading first, then Spanish.** Reading is all-English and
   code-generatable; Spanish needs realistic voice/pronunciation (see below).
4. Only turn a world **paid** once it's genuinely worth $4.99.

---

## 🎚️ Difficulty: move from grades → **levels** (planned, likely soon)

**Decision leaning:** replace the player-chosen **grade** with an **earned level**
system — ideally *before* the grade model entrenches (saves, habits, UI).

**The problem with grades:** grade is a difficulty the *player picks*, so an older
kid can choose a low grade to farm easy coins. Self-declared difficulty + flat-ish
rewards = a gameable loop.

**Why levels fix it:**
- **You earn your level, you can't pick it** — it only goes *up*, via streaks /
  first-try accuracy. There's no dial to turn *down* for easy money.
- **Reward scales with level** — low levels pay little, high levels pay more. Once
  that's true, playing below your ability gains you nothing. *(This reward curve is
  the actual anti-gaming lever — even keeping grades, scaling pay by difficulty
  would help; levels are just the cleaner, more motivating version.)*

**Half-built already** — promote, don't rebuild: the game already has adaptive
per-skill levels under the hood (`mathLevel`, `readLevel`, `spellLevel`) that climb
on hot streaks and ease down on misses, and harder questions already pay a bit more.
The work is making the level the *source of truth* and surfacing it.

**Two cautions:**
1. **Keep a light starting point.** Pure level-1-for-everyone bores a 10-yo on
   "2+2" and overwhelms a 6-yo. Keep grade as a one-time **placement** (where you
   *start*), then never allow it to be lowered — progression is level-only after.
2. **Make levels visible & celebratory.** A little XP / level bar + a "Level up! 🎉"
   moment is genuinely motivating for kids (why Minecraft/Roblox feel rewarding).
   The level-up toasts already exist; a visible bar would do a lot.

### 🔐 Secret grade-mapping (the parent selling point)

Each level **secretly maps to a grade band** behind the scenes. Two audiences, one
system:
- **Kid-facing = pure fun.** They only ever see "Level 12 ⭐", an XP bar, and
  level-up confetti. **No grade labels** — a struggling kid never sees a low grade
  stamped on them; they just watch their level climb. Healthier and more motivating.
- **Parent-facing = the reveal.** The dashboard translates the earned level into a
  grade-equivalency: *"working at ≈ Grade 4 level."* Because we capture the kid's
  **actual grade at placement**, we get the killer line for free:
  **actual grade vs current working level →** *"🎉 Your 3rd grader is doing
  4th-grade-level math."* Aspirational, screenshot-worthy, a concrete reason to buy
  & stay.

**Guardrails:**
- **Per-subject**, not one global number — "strong reader, building math" is itself a
  valuable (and honest) parent insight.
- **Frame as growth, not a scoreboard.** Use "working at ≈ Grade X level" (not a
  guarantee) and show the line *moving up over weeks* ("grew a grade level in 6
  weeks" sells harder than a static badge — and avoids competitive-parent stress).
- Map levels to grade **bands with overlap** so the claim stays defensible.

### ⚠️ Handle BOTH ends (the below-grade risk)

The grade reveal cuts both ways: "ahead!" delights, but "behind" is where you get
refund requests, angry emails, and 1-star reviews. **The kid never sees grades, so
the kid is never hurt — the entire risk lives in the *parent* dashboard framing.**
Rules:
- **Lead with growth (always positive).** "Grew 2 levels this month • 30 new skills •
  9-day streak." Growth is encouraging at *any* absolute level → make it the headline,
  grade-equivalency the small print.
- **Only show the explicit grade reveal when flattering** (at/above grade). When the
  kid is **below** grade, *suppress the comparison* and show progress + encouragement
  instead. Never volunteer "your kid is behind."
- **If below-grade is ever surfaced, frame as opportunity, not deficit.** "Building
  strong Grade-2 foundations 💪 — here's how to help" beats "below grade level." It's
  also the best *retention* story: the kid who's behind benefits most from practice,
  so the dashboard becomes "look how much they're growing here."
- **Position as practice, not assessment.** A small "a fun estimate from gameplay, not
  a formal assessment" line defuses most disputes.
- **Keep it parent-only & gated** (dashboard already has the code gate); consider
  making the grade-equivalency an opt-in toggle.

**Sketch of the build, when ready:** placement (sets actual grade + starting level) →
per-subject earned levels as the source of truth → visible XP/level bar + level-up
celebration → coins scaled by level reached → parent dashboard shows grade-equivalency
("working at ≈ Grade X") and growth over time.

---

## 🔜 Next: Reading Town (was "Reading City")

**Rename direction:** "Reading City" → **Reading Town** — a friendly *suburban
neighborhood*, not a downtown of condos. Why: kids build with **blocks**, and
blocks want an *outdoor plot*, not an indoor condo. A suburban lot keeps the
beloved build-your-own-house mechanic while adding a town to explore.

**The world:**
- **Your plot** — a suburban lot where the kid builds their own house with
  blocks (same mechanic as Meadow), maybe a yard, fence, garden.
- **Walk-in town buildings** (the learning + activity hubs):
  - **📚 Library** — *the headline feature.* Walk in → shelves of books → pick
    one → read a short, *fun* themed passage (sci-fi / mystery / adventure) →
    spot the literary device (simile, metaphor, alliteration, onomatopoeia,
    personification, rhyme) → earn a reward / unlock the next book. Reframes
    reading from worksheet → quest.
  - **🏬 Department store** — a themed shop for furniture/decor (reuse the shop
    system).
  - **☕ Cafe** — a cozy spot; snack/social flavor, maybe a small activity.
- **Camera:** first- and third-person already work everywhere (the 👁️ / C
  toggle) — no extra work.

**Build order for Reading Town:**
1. The **Library** vertical slice (walk in → read → spot the device → reward).
   This is the learning payoff *and* proves the "walk into a building" mechanic.
2. Suburban plot styling + build-your-house on a lot.
3. More walk-in buildings (store, cafe) as time allows.

When Reading Town is genuinely fun, flip it from Coming Soon → the **$4.99**
unlock.

---

## 🌳 Math Meadow → countryside polish (small, soon)

Give the Meadow a **countryside** feel to contrast with the town:
- A few **rolling hills** (decorative backdrop bumps around the edges — keep
  them non-collidable so building/physics stay simple), maybe distant barns,
  hay bales, a winding fence.
- Keep it the calm, open, rural "home base."

(Decorative hills are low-risk; *walkable* terrain height is a much bigger
change and not planned.)

---

## 🏖️ Later: Spanish Beach

Deferred on purpose — Spanish needs to be **done right**:
- **Realistic voice + pronunciation** is essential (kids must hear correct
  Spanish). Options: a recorded voice actor (best, but production cost) or
  high-quality text-to-speech. Tap a word → hear it spoken.
- A fluent reviewer to validate vocabulary, accents, and example sentences.
- Beach-appropriate build: a **beach hut** to start, a **beach mansion** later
  as a progression.

Park it until Reading Town proves the "walk-in building + learning quest" model.

> **Rethink (Jun 2026):** the old Spanish was too text/translate-heavy — overwhelmed
> Leo (he just mashed the speak button). When revived, **redesign it pictorial &
> young-kid-first**: picture + native audio + tap-to-match, almost no text, greetings
> (Hola, ¿Cómo estás?), lots of repetition/praise (Duolingo ABC / Gus on the Go model).
> Start tiny, not a "language school." **Bigger open question:** is Spanish even the
> right 3rd world? Math + Reading already cover the required subjects, so a 3rd world is
> optional — and **Science/STEM may be a stronger, funner fit** (build a rocket/volcano/
> ecosystem; kids love it; parents value enrichment). Don't decide pre-launch — ship
> math+reading, tease "coming soon" world(s), and let parent demand pick the next build.


---

## 🧰 Tech / ops notes

- **⚠️ Hosting — MUST move off GitHub Pages before commercial launch.** GitHub
  Pages' terms forbid sites "primarily directed at facilitating commercial
  transactions." Stackadoo sells a $4.99 unlock → commercial → not allowed on
  Pages long-term. **Move to a host that permits commercial use.** The site is a
  single static `index.html` (no build step), so migration is quick:
  - **Recommended: Cloudflare Pages** — generous free tier, explicitly allows
    commercial, fast global CDN, easy custom-domain + auto HTTPS. (Netlify or
    Vercel also work; mind their bandwidth limits.)
  - Steps: connect this repo (deploy `main`) **or** drag-drop the file → set the
    custom domain `www.stackadoo.com` → point DNS at the new host → enable HTTPS.
  - Payments are unaffected (the Stripe link is external and works anywhere).
  - This also retires the `main → serene-maxwell-pvjoce` deploy workaround.
- **Domain:** `stackadoo.com` (Squarespace). Quick path: a "Play Free" button →
  the game URL. Cleaner later: `play.stackadoo.com` → the host (DNS CNAME).
- **Payments:** Stripe (Buni LLC, Managed Payments) — test link wired, live link
  saved in a comment. Set the redirect to `…/?unlocked=1`. Switch worlds from
  `comingSoon` → paid when ready.
- **Support:** `support@stackadoo.com` + an FAQ page (no phone number).

---

## 👪 Accounts & cloud saves (post-launch, the real fix for lost saves)

**The problem today:** saves live only in one browser's `localStorage`. Clear the
browser, switch tablets, or split www-vs-apex → the world is gone. This is what
caused the resets (Leo's puppy + coins). Cloud accounts make saves **portable and
durable** across devices.

**Design principles (don't compromise the trust pitch):**
- **Parent account, not a kid account.** The grown-up signs in (we already have
  their email from Stripe); kid profiles are *nicknames under* that account — **no
  kid email, no kid PII.** Keeps the COPPA-friendly "no data collection" story intact.
- **Magic-link + Google Sign-In.** No passwords for kids to manage. Offer Google
  one-tap *and* email magic-link ("tap the link to log in").
- **Tie it to the existing purchase.** The "Founding Family" unlock is basically an
  account already — sign-in becomes "restore your unlock + your worlds on any
  device," which also retires the localStorage / www-vs-apex split-save risk.
- **Free game stays login-free.** Don't gate Math Meadow behind sign-in (kills the
  frictionless hook). Cloud save is an opt-in perk for paying/multi-device families;
  **local-first stays the default**, cloud is a backup layer on top.

**Architecture, when ready:** **Cloudflare Worker + KV/D1** (we're moving to
Cloudflare anyway) storing each kid's save JSON — it's a tiny blob — keyed to the
parent account, with Google/magic-link auth. Stays in one ecosystem. (Firebase or
Supabase also give Google auth out of the box, at the cost of more 3rd-party data.)

**Why it's low-risk to add later:** the save is already a small JSON blob, so "sync
this blob to the cloud" is an add-on, not a rebuild of the game.

**Stopgap until then:** ✅ shipped — the **🛟 Back up now** button in the grown-ups
dashboard (native share sheet on tablets → Save to Files / email / cloud; download on
desktop), plus a "back up your saves" nudge and **⬆️ Import** to restore on any device.

### 💵 Backend cost & options (what to use, what it costs)

**Save data is the cheapest kind of workload** — a few KB per kid, written only a few
times per session. Even ~100k kids ≈ a few GB and a few hundred k writes/day, which
sits inside or just past most **free tiers**. This won't run up a scary bill, even viral.

- **The Cloudflare "$5" demystified:** Workers has a *genuinely free* tier (~100k
  requests/**day**). The **$5/mo** is the optional paid plan (~10M req/mo, then ~30¢/M)
  — a flat fee, not a surprise meter. Cloudflare's free tier **fails closed** (throttles
  rather than silently billing), so no runaway invoice.
- **The catch:** raw Cloudflare *stores* saves cheaply but **doesn't give you Google/
  Facebook login** — you'd build auth yourself. Two services bundle social login **and**
  storage on a free tier (less code, less money):

  | Option | Free tier (rough) | Social sign-in built in? | Best for |
  |---|---|---|---|
  | **Firebase** (Google) | ~1 GB data, ~50k reads / 20k writes per **day** | ✅ Google, Facebook, Apple, email | Easiest "sign in + save" |
  | **Supabase** | ~500 MB DB, 50k monthly users, auth incl. | ✅ Google, Facebook, etc. | If you ever want a real SQL DB |
  | **Cloudflare** Worker + KV/D1 | 100k req/day, generous storage | ❌ build it yourself | Cheapest *storage*, more code |

- **Leaning choice:** **Firebase free (Spark) plan** — $0 to start, Google + Facebook
  logins included, social auth out of the box. Supabase is the close runner-up.
  **Keep Cloudflare for hosting the game** (free, great); let Firebase/Supabase handle
  accounts + saves.
- **If it goes viral:** on Firebase pay-as-you-go you'd likely still be **single digits
  a month** at thousands of active families — and you can set a **hard budget cap /
  alert** so it can't run away. By then the $4.99 unlocks cover it many times over.

**Recommended sequencing:** launch with the 🛟 backup button (free, no server) → after
launch, build sign-in on **Firebase free tier** with a budget alert → only think about
paid when genuinely big (revenue covers it easily).

---

## 🏪 Two stores (when there are enough items)

Split Stack Mart into two once the catalog is big enough:
- **🛒 General / Grocery Store** — food, groceries, garden/outdoor, basics.
- **🏚️ "Stack Barn"** (furniture & household) — couches, tables, chairs, decor,
  pets, roof tiles, building materials, kitchen/bathroom.

Could be tabs in one shop, or two walk-in buildings in the world. Decorating is
clearly the engine (Fiona), so the furniture store deserves to feel special.

**Quality bar for decor:** expensive, very pretty, **very detailed** — kids love
seeing knobs, handles, seams, and little decorations up close. Items should read
as the real thing (a couch that looks like a couch, not a square).

## ❓ Open decisions

- Confirm the rename **Reading City → Reading Town** (and tweak the city decor
  toward suburban?).
- Add decorative **rolling hills** to Math Meadow now, or wait?
- What reward does finishing a **library book** give (blocks? a special item? a
  badge?)?
- Pricing when worlds go live: keep **$4.99 one-time** with a founder/early-bird
  promise, or revisit.
