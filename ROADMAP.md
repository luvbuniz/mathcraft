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

**Sketch of the build, when ready:** placement → per-subject levels as the source of
truth → visible XP/level bar + level-up celebration → coins scaled by level reached.

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

---

## 🧰 Tech / ops notes

- **Hosting:** GitHub Pages currently deploys the branch
  `claude/serene-maxwell-pvjoce`. When convenient (desktop), switch
  **Settings → Pages → Source** to **`main`** for a clean setup. Until then,
  deploys go out by merging `main` → that branch.
- **Domain:** `stackadoo.com` (Squarespace). Quick path: a "Play Free" button →
  the game URL. Cleaner later: `play.stackadoo.com` → Pages (needs a DNS CNAME +
  a `CNAME` file in the repo).
- **Payments:** Stripe (Buni LLC, Managed Payments) — test link wired, live link
  saved in a comment. Set the redirect to `…/?unlocked=1`. Switch worlds from
  `comingSoon` → paid when ready.
- **Support:** `support@stackadoo.com` + an FAQ page (no phone number).

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
