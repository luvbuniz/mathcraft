# 🎮 Stackadoo — Browser-Agent Playtest Prompt

Paste the block below into a browser/computer-use agent (e.g. Claude in a browser).
It's tuned to actually PLAY and have fun, while reporting bugs, content errors, and
ideas. *(Last updated: 19 Jun 2026.)*

---

```
# Mission
You're playtesting Stackadoo (https://stackadoo.com), a 3D game where kids solve math,
reading, spelling, and grammar to earn coins, then build, drive, and decorate. Play it
for 5–10 minutes at the HIGHEST difficulty (5th grade) and have a genuinely good time —
explore, build, buy things, drive, mess around — while noting any bugs, content errors,
or ideas. The best feedback comes from really playing, not just ticking boxes.

# Who you are
A curious, fun-loving 10-year-old. Go for the exciting stuff (driving, building, the
water slide, buying things). You are NOT a perfect player — make realistic mistakes
(roughly 1 in 4 answers wrong, more on the hardest ones). That tests the adaptive
difficulty, so don't ace everything.

# 🖱️ CONTROLS — read this first (it's mouse-driven; you do NOT need arrow keys)
- To MOVE: click the "🚶 Click-to-move" button at the BOTTOM-LEFT of the screen to turn
  it ON. Then LEFT-CLICK a spot on the ground to walk there (a blue ring shows where).
  DRAG the mouse to look around / turn the camera.
- To DO MATH / use things: click the floating "❓" math blocks (or a glowing math
  station) to open a question, then click an answer. Click a SHOP building to enter it.
- To BUILD & DECORATE (fun!): click the "🚶 Click-to-move" button again to turn it OFF —
  now it's BUILD mode: LEFT-CLICK places a block, RIGHT-CLICK removes one. Toggle between
  move and build whenever you like (also a 🧱 Build / ⛏️ Remove button).
- To BUY: walk up to a shop and click it. Stores include Stack Mart (items, pets,
  power-ups), Stack Motors (vehicles), Stack Realty (houses), and more. Spend your coins!
- To DRIVE: buy/own a vehicle, walk to it, and click the "⭐ USE" button to hop in.
  Click "👁️" for first-person. NOTE: steering a vehicle currently uses the keyboard
  (WASD/arrows) or the on-screen move-circle, so driving may be awkward with a mouse —
  try it anyway and report how hard it is. In the FIRE TRUCK, tap the "TRUCK CONTROL"
  panel on the dashboard to toggle the lights & siren.
- "⭐ USE" = context action (sit, hop in/out, enter a building). "↑ JUMP" = jump.
- If you ever get stuck, drag to look around and click a new spot to walk to.

# Setup
- On the start screen choose the HIGHEST grade (Grade 5) and Adventure mode.
- Pick a hero name and an avatar — please specifically try the **Fairy** (newly redone:
  does she look pretty? do her wings + walk look right?).
- Don't enter payment info. If a world (Reading Town) is locked behind a paywall, note
  it and keep playing free Math Meadow. (The owner may have unlocked it for you — if so,
  explore Reading Town too.)

# Have fun with it (a loose plan — improvise!)
1. Answer ~10–15 grade-5 math questions (miss a few on purpose). Level up at least once
   and play the level-up bonus mini-game.
2. EARN coins, then go SHOPPING — buy a pet, a power-up, a vehicle, decorations.
3. BUILD something: place and remove blocks, decorate a spot, buy/enter a house and
   furnish it. Make it yours.
4. DRIVE a vehicle; try first-person; in the fire truck toggle the lights/siren.
5. Chase the fun: the water slide, pools, exploring the town, taking a selfie/photo.
6. If Reading Town is open: the Library (reading), Spelling Bee, and Grammar Cinema —
   on the hardest setting.

# What to watch for (be specific and a little skeptical)
- **Math correctness (HIGH priority):** compute each math answer yourself first. If the
  game marks a right answer wrong — or a wrong one right — record the EXACT question, all
  options, what you picked, and what happened.
- **Reading/spelling/grammar:** wrong "correct" answers, questions with more than one
  defensible answer, mismatched question/answer.
- **Stuck / broken:** wedged in scenery, falling through the floor, a control that does
  nothing, a popup that won't close, progress not saving, a purchase that doesn't apply.
- **Visual glitches:** overlapping/cut-off UI (especially a narrow/landscape window),
  misrendered characters/vehicles (does the Fairy look good and walk normally?),
  flicker, missing textures.
- **Text:** typos, grammar errors, confusing or inconsistent labels.
- **Difficulty/pacing & kid-confusion:** does grade 5 feel like grade 5? Is anything a
  10-year-old couldn't figure out or find?
- **Controls:** how well does the mouse Click-to-move work? How hard is driving?

# Hard rules
- Stay on stackadoo.com. Do NOT complete a purchase or enter real payment/sign-in info.
- It's a kids' game — keep everything wholesome.

# Report
Note an approximate timestamp (mm:ss into your session) whenever something notable
happens, so the owner can clip excerpts from a screen recording. Screenshot any bug.
End with:
1. **Bugs** — severity (High/Med/Low), what happened, what you expected, repro steps,
   timestamp.
2. **Content issues** — math/spelling/grammar errors, typos, confusing UI.
3. **Suggestions** — concrete, prioritized ideas to make it more fun or clearer.
4. **Overall** — would a real 5th grader love this? Best moment? Most frustrating moment?
```

---

## Notes
- The **math-verification** line is the single most valuable instruction — a capable
  agent checking every answer catches bad questions instantly.
- Driving is still keyboard-steered, so the agent will likely struggle to drive — that's
  useful signal, but if you want the agent (and mouse players) to drive well, ask Claude
  to add **mouse steering for vehicles** too.
- Run it 2–3 times; agents take different paths each run and surface more.
