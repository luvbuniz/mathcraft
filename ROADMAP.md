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

## 💎 Premium content plan (the $5 "Founding Family" value)

At $5 one-time + *lifetime updates*, the value is **a deep second world + a steady
drip of updates**, not a mountain on day one. Depth > breadth — a few rich shops beat
many empty ones. Most of this is **cheap (data: items/shops/vehicles)**; spend the real
build budget on one or two "wow" features.

### ✅ Shipped toward premium
- Coin rebalance (Library pays most; spelling bee no longer farmable).
- 4 Reading Town **city vehicles**: fire truck 🚒, ambulance 🚑 (both siren+lights), taxi 🚕, bus 🚌.
- Whole-item **pools** (3 sizes) + **Mega Pool water slide** (first-person ride).
- 🕹️ **Stack Arcade** (Reading Town, next door to the Cinema): **Word Hunt**
  (7×7 tap-start/tap-end word search) + **Snowman Spell** (friendly hangman — no
  gallows — with sentence clues from the graded spelling lists), 2-coin entry,
  🎟️ ticket payouts scaled by level, a **Gloomy Bop** no-reading bonus round
  after wins (cleaner spelling = longer bonus), and a ticket-only **prize
  counter** (arcade trophy, claw-machine bear, neon OPEN sign, mini arcade
  cabinet — all placeable furniture). Economy: coins are the entry fee and
  tickets never convert back, so the arcade is a coin *sink*, not a farm; wins
  record spelling practice on the parent dashboard but grant **no stars/levels**.
- ✨ **Graphics pass**: real-time soft shadows across every world, hemisphere
  sky/ground lighting (themed per world), round leafy trees, and natural
  noise-blended grass replacing the checkerboard.
- 🦅 **Bird's eye build view + 🌉 row fill** (the "Leo can't reach the roof"
  fixes): the camera button/C key now cycles a third **top-down view** — tap
  any column from above to stack on it or remove its top brick (high walls
  and roofs without aiming struggles). And when a placed brick lines up
  straight with another at the same height, a one-tap **🌉 Fill across**
  button lays the whole row — flat "old-fashioned" roofs in three taps per
  row instead of balancing along the wall placing bricks one by one.

### 🎬 Grammar Cinema (Reading Town) — HIGH value, build next-ish
Grammar is an underserved gap and rounds Reading Town into three pillars:
**Library = comprehension, Post Office = spelling, Cinema = grammar.**
- Walk-in **🎬 Cinema**; pick a "movie" (story); each scene = a sentence with one
  grammar problem, **4 choices to fix** (capitalization / missing comma / past-future
  tense / subject-verb). Single-attempt → reveal flow (consistent with other games).
- Fix all scenes → the movie **"premieres"**: marquee *"NOW SHOWING: [title] 🎬"*,
  confetti, applause, coins. (A *celebration*, not a produced animation — 90% of the
  delight, 10% of the work. Real animation = later, don't block on it.)
- **⚠️ Grammar QA is critical** — easy to write *ambiguous* items, and parents pounce
  on a wrong "correction" faster than a math error. Rule: **exactly one unambiguously
  correct fix** per item, 3 clearly-wrong options; tight, well-defined grammar types;
  QA like the 35k math questions (zero ambiguous items).

### 🏦 Bank (Math Meadow) — money math
A walk-in **🏦 Bank**: **coin-counting** (make a target amount), **making change**
(pay, count the change), and **interest** for older kids only (higher levels: "deposit
100 at 5% — how much now?" so it stays hidden from little ones, surfaces as they level).

### 🔤 Level-up bonus mini-games (earned by leveling up — strong retention hook)
Leveling up grants a bonus quest that **rotates through mini-games**, length/difficulty
**auto-scaled by level** (younger kids get easier ones — no manual age setting). Pool so far:
- ✅ **Treasure Map** (read X,Y coordinates), **Describing Words** (adjectives),
  **Unscramble** (anagram, picture hint, 3–6 letters by level). *Shipped.*
- ✅ **Word Search** — shipped as **Word Hunt in the 🕹️ Stack Arcade** instead (7×7,
  tap start+end cell — easier than drag on touch; diagonals join at spelling level 3+).
- 🤔 **Mini Crossword** — *older kids only* (younger won't get it, per parent). A 5×5 with
  picture/short clues is doable but a **bigger build**; do it after word search.
- ⏭️ **Sudoku** — honest take: the "too hard for little kids" worry is right, and even a
  4×4 picture-sudoku is a **logic** puzzle, not math-fact *learning* — weaker educational
  ROI than the word games. **Skip unless** demand shows up; word search + crossword are the
  better use of the slot.

Keep them **level-up-only** (a celebration of real progress) so they're never farmable.

### 🛋️ Room kits
One-tap furnished rooms in two styles: **Post-Modern** and **Ultra-Trendy**.

### 🔁 Drip as "lifetime updates" (marketing beats after launch)
Seasonal/holiday packs, more books/quests/pets/vehicles, a Tier-2 headliner
(racetrack / science corner / trophy room). Don't ship it all at once — each release =
its own announcement and proof the "updates for life" promise is real.

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

## 🔬 Next world (decided): STEM Lab — over Spanish

**Decision (Jun 2026):** the **3rd world is STEM/Science, not Spanish.** Why: Math + ELA
are done, and **Science is the next real school subject** (Spanish is enrichment, not a
core requirement, and needs costly native audio). A STEM world also leans into the game's
superpower — it's already a build/physics sandbox, so the **Engineering** strand is free.
This is the **next big build after Reading Town is solid.**

**Elementary science is general/integrated** (US framework = **NGSS**): the same big ideas
spiral K-5, in **four pillars** — build to touch all four:
- **🌱 Life Science** — plants' & animals' needs/parts, habitats, life cycles, traits,
  ecosystems & **food webs / energy from the sun** (Gr5).
- **🔬 Physical Science** — properties of **matter** (states: ice→water→steam, mixtures),
  light & sound, **forces & motion, magnets**, energy.
- **🌍 Earth & Space** — weather & seasons, **day/night & sky patterns**, water cycle,
  rocks/landforms/erosion, and **the Sun, stars, planets, gravity** (Gr5). *(The kids
  already gravitated to space + plants — these are two of the pillars.)*
- **🛠️ Engineering** — woven through every grade: **define a problem → design → build →
  test → improve.** Perfect fit for a voxel builder.

**Buildable destinations (one per pillar):**
- **🌱 Greenhouse/Garden Lab** — grow a plant with the right sun+water+soil, life cycle
  seed→sprout→flower, build a food chain. (Extends the existing plants/berries/trees.)
- **🚀 Space Center/Observatory** — day/night & moon phases, planets in order, weather
  station, **build-and-launch a rocket** (headline wow).
- **🔬 Matter Lab** — melt/freeze states, sink-or-float, magnets, ramps & forces.
- **🌋 Build-It Challenges** (Engineering) — bridge/tower that holds, boat that floats,
  **erupt a volcano** (earth science + everyone's favorite).

### 🎢 Design: a SCIENCE THEME PARK with themed lands (Jun 2026)

Instead of one generic "lab," **Science World = a theme park** the kid explores — themed
**lands**, each wrapping a science domain in an immersive setting, each with a signature
**ride** as the reward. Stronger hook, better marketing, and the rides mostly **reskin
mechanics we already have**.

- **🌴 Rainforest / Costa Rica** *(Life Science + Earth Science)* — greenhouse + jungle:
  grow plants and learn **cause-and-effect** (overwater → droops, too little sun → wilts,
  just right → flowers). The **volcano lives here** (erupt it; lava/rock). Animals,
  habitats, food chains. **Ride:** zipline / river-raft through the canopy.
- **🚀 Future World** *(Space + Physical: magnets/energy)* — space center: **build & launch
  a rocket**, day/night, planets, moon phases. **Maglev train** = the magnet lesson
  (attract/repel → levitation). **Ride:** Leo's **spaceship flight** (first-person launch —
  reuses the water-slide POV).
- **🤠 Frontier / Cowboy West** *(Engineering + Physical: steam/forces)* — **Build-It
  challenges** (bridge across a canyon, a tower that stands), **steam trains** (water→steam
  →power; states of matter + simple machines). **Ride:** a **steam train** loop.

Pillars covered: **Life 🌴 · Earth 🌴/🤠 · Physical 🚀🤠 · Engineering 🤠🚀**.

**Two things that make it buildable (not scary):**
1. **Rides are reskins of existing mechanics** — spaceship launch = the slide's
   first-person ride; maglev & steam train = drivable vehicles on a path. Reuse, not invent.
2. **Build challenges need NO real physics** — a bridge "passes" when the kid fills the
   span so a little **test-cart rolls across** (a connect-A→B check); a tower passes at a
   target height. Forgiving, kid-friendly, no engine.

**Guardrail:** learning is the point, theme is the wrapper — each land stays mapped to real
NGSS content (still "touches what schools teach").

**Sequencing:** big build → **one land first as a vertical slice.** Start with **🌴
Rainforest** (extends existing plants + includes the crowd-pleaser volcano), prove the
theme-park model, then drip **Future World** and **West** as Founding-Family updates (each
its own launch moment).

**Marketing line:** *"a science theme park your kid explores — launch a rocket, ride a
maglev, erupt a volcano."* Rides = Reels/TikTok gold.

**Headline "wow" shots:** the **rocket launch** and the **volcano** — both scream STEM,
both very kid-appealing, both great Reels/TikTok.

**Caveat:** exact topics shift slightly by state, but the four pillars are consistent
nationwide — building around them safely "touches what schools teach."

---

## 🏖️ Later (deprioritized): Spanish Beach

**Now behind STEM** (see decision above) — Spanish is enrichment, not a core subject, and
needs production-quality native audio. If revived later, it needs to be **done right**:
- **Realistic voice + pronunciation** (recorded voice actor, or high-quality TTS) — tap a
  word → hear it spoken. A fluent reviewer to validate vocabulary/accents.
- **Redesign pictorial & young-kid-first**: picture + native audio + tap-to-match, almost
  no text, greetings (Hola, ¿Cómo estás?), lots of repetition/praise (Duolingo ABC / Gus
  on the Go model). Start tiny, not a "language school" — the old version was too
  text/translate-heavy and overwhelmed Leo (he just mashed the speak button).
- Beach-appropriate build: a **beach hut** to start, a **beach mansion** later.

Park it until STEM ships and parent demand asks for a language world.


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

### 📧 Free-tier sign-up = email capture (soft-launch growth lever)

The free game stays **playable with no login** (local auto-save covers one device). Login
is the *upgrade*: **"Sign in (Google or password) to save your worlds & keep them on any
device."** That's the natural, willing email-capture moment — build a list of interested
parents now, pitch Reading Town to them later.

- **User count ≠ marketing consent.** *Every* sign-up is a counted user, with or without
  marketing opt-in — so you get the "how many are playing free" headcount from
  registrations alone. The marketing checkbox only governs whether you may *email* them.
- **Use an UNchecked opt-in box** ("✉️ Send me updates & tips"), not a pre-checked opt-out:
  pre-checked is banned under GDPR/CASL, and an actively-ticked list has far better open
  rates & deliverability. You still count everyone who signs up either way.
- **COPPA guardrails (firm):** collect a **parent email only — never a kid's**; kids stay
  nicknames under the parent account (no child PII). Keeps the "kid-safe, no kid data"
  promise true even with email capture.
- **Before flipping it on:** update `support.html` privacy policy to disclose parent-email
  collection (for saving + optional updates), the unsubscribe, and "no child data."
  Marketing emails need a working **unsubscribe link + mailing address** (CAN-SPAM) —
  any provider (Mailchimp / Resend / ConvertKit) handles this.

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

## 🎵 Far-future polish (parked — not for launch)

- **Working car radio** — click the dashboard radio to flip between stations.
  Music: commission a Suno track (e.g. a country song about solving math in a
  pickup truck 🤠), or — cheaper — use **royalty-free / commercial-free** music so
  there are no licensing issues. *Don't spend on this pre-revenue.*
- **Animate every avatar** (not just the Fairy's wings) — give each a little idle
  "life": fox/tiger tail sway, ear twitches, the dragon's wings, etc. Makes the
  whole avatar picker feel premium. Some avatars may need a visual pass — flag any
  that look "rough."
