# 🎨 Real 3D character models (the Meshy weekend guide)

Drop a model file in this folder named after the hero's avatar id and the game
**upgrades that hero automatically** — no code changes. The procedural avatar
appears instantly, then swaps to your model the moment it loads. No file (or a
broken file, or offline on first visit) → the hero quietly stays procedural.
Ship one character at a time, in any order.

## File names (avatar ids)

| File | Hero | | File | Hero |
| --- | --- | --- | --- | --- |
| `leo.glb` ✅ shipped | Leo 👦 | | `fiona.glb` ✅ shipped | Fiona 👧 |
| `queenfox.glb` ✅ shipped | Queen Fox 🦊 | | `princess.glb` ✅ shipped | Princess 👑 |
| `peacock.glb` | Peacock | | `unicorn.glb` ✅ shipped | Unicorn Dancer 🦄 |
| `tiger.glb` | Tiger | | `dragon.glb` ✅ shipped | Dragon 🐉 |
| `deer.glb` | Deer | | `kinglion.glb` | King Lion |
| `piratecat.glb` | Pirate Cat | | `ninjadog.glb` | Ninja Dog |
| `robot.glb` ✅ shipped | Robot 🤖 | | `astronaut.glb` | Astronaut |
| `wizard.glb` | Wizard | | `panda.glb` ✅ shipped | Panda 🐼 |
| `penguin.glb` | Penguin | | `bunny.glb` | Bunny |
| `superhero.glb` | Superhero | | `spark.glb` ✅ shipped | Spark the Fairy 🧚 |
| `knight.glb` | Knight | | `trex.glb` | T-Rex |

## Fully-automated option: the Meshy MCP

The repo ships a `.mcp.json` that loads the
[Meshy AI MCP server](https://github.com/pasie15/meshy-ai-mcp-server) — it
lets Claude drive Meshy directly (image-to-3D, auto-rig, animate, optimize,
download). Setup:

1. Get a Meshy **API key** (make sure your plan includes API credits — the
   API bills from its own credit pool, not web-app credits).
2. Set the `MESHY_API_KEY` environment variable — **never commit the key**:
   - *Desktop Claude Code*: `export MESHY_API_KEY=...` before launching, or
     `claude mcp add meshy-ai --env MESHY_API_KEY=... -- npx -y meshy-ai-mcp-server`
   - *Claude Code on the web*: add `MESHY_API_KEY` in the environment's
     settings, and allow the domains `api.meshy.ai` + `assets.meshy.ai` in
     the environment's network policy (the default policy blocks them).
3. Then just ask Claude: *"make the tiger avatar from this render"* — it can
   generate → rig → animate → download → drop the GLB here → screenshot it
   in-game → commit, while you review.

## Meshy checklist (per character, by hand)

1. **Generate** with *Image to 3D* from your character render. Use the same
   art-style renders + same settings for every character so the cast matches.
   Pick a variation with a clean, pleasant **neutral/smiling face** — that's
   the face they'll wear (expressions come later, see below).
2. **Rig it**: run Meshy's auto-rigging, and include the **Walking** and
   **Idle** animations if offered. (No rig is fine too — the game gives
   unrigged models a gentle bob instead.)
3. **Export** as **GLB** (binary glTF, one file with textures inside).
   Target roughly **≤ 30k triangles** and **1024px textures** — plenty for
   tablets and keeps files ~1–3 MB.
4. **Rename** to the id above (e.g. `leo.glb`) and drop it in this folder.
   Commit + deploy like any other change.

Don't worry about size, position, or ground level — the game auto-scales every
model to hero height and puts its feet on the floor. Facing: models should
face **+Z / toward the camera**; if one comes out backwards, add a one-line
fix in `AVATAR_MODEL_TWEAKS` in `play.html`:

```js
const AVATAR_MODEL_TWEAKS = {
  leo: { rotY: Math.PI },        // flip a backwards model
  fiona: { scale: 0.95 },        // fine-tune size
  tiger: { hatY: 1.6 },          // where badge hats sit (blocks above the feet)
};
```

## What works automatically

- **Walk/idle animations** — clips named like "Walk"/"Walking"/"Run" and
  "Idle" crossfade as the hero moves. One unnamed clip? It's used for both.
- **Shadows & lighting** — models get the game's sunlight shadows, and their
  textures are converted to the game's bright hand-tuned look (no dull PBR).
- **Picker cards** — the hero-select thumbnails repaint with the real model.
- **Offline** — the service worker caches each model after its first load.
- **Hats** — badge caps/crowns sit at an estimated head height (tune with
  `hatY` if a hat floats or sinks).

## What to know

- **Four-legged friends only walk** — Meshy's animation library for quadrupeds
  has Walking and little else. That's fine: the game gives a walk-only model a
  gentle breathing stand when still (it never marches in place), and it simply
  skips celebrate/sit/sleep moves the file doesn't have.
- **Faces are static** on models for now (the procedural kids' animated
  smiles/frowns don't carry over). The plan for expressive models: paint 3–4
  face-texture variants (happy/grin/sad/blink) or add Blender morph targets —
  ask Claude to wire either once you have a model you love.
- Models don't sit in cars or on chairs yet — they stand/idle instead. Cosmetic;
  we can add poses later.
- Keep the source renders you fed Meshy! When you generate more of the cast
  later, feeding the same style keeps everyone looking like one family.


## 🎬 Animations — what to pick in Meshy (the game auto-wires them)

Rig the model (Auto-Rig), then add animations from Meshy's library before exporting:

1. **Walking** and **Idle** — the two the game *drives*: it crossfades them as the
   hero starts/stops moving. Clips named like `walk/run/jog/trot` and
   `idle/breath/stand` are detected automatically.
2. **Up to 2–4 fun extras** — ANY other clip in the file becomes a **special move**:
   - 🎉 On a **right answer**, the hero plays their celebrate move (the first clip
     whose name matches `dance / cheer / jump / spin / victory / celebrate /
     excited / happy / agree / clap / wave` — otherwise the first extra).
   - 🕺 Standing around, they occasionally **fidget** with a random extra.
   - Specials play once, then the hero settles back to idle. Walking cancels them.
3. **Named roles get extra behaviors** — clips with these names are pulled OUT of
   the random-fidget pool and wired to real game moments instead:
   - `Running` (run/sprint/jog) → the stride during **apple-snack zoomies** and the
     secret RUN sprint. Never a fidget (jogging in place looks broken).
   - a **sit** clip (e.g. "Sitting Answering Questions") → left alone ~12 quiet
     seconds, the hero **sits down**; any tap/key/step hops them back up.
   - a **sleep** clip → stay away ~1 minute more and they **nod off** where they sat.
   - a **spin/flip** clip → the 🗺️ **quest-complete fanfare**: plays only with open
     space around the hero (no walls/friends nearby — otherwise a victory cheer).
4. Per-avatar personality is exactly this: give the dragon a roar-ish move, Leo a
   360 spin-jump, Fiona a dance — the game does the rest, no code changes needed.

### 🤫 Secret move codes (for testing — and for kids who find them)

- **Keyboard:** while playing, **press SHIFT, then type** `SPIN`, `CHEER`, `SIT`,
  `SLEEP` or `RUN` (holding Shift while typing works too). A little 🤫 chip echoes
  the letters; plain WASD still steers — only real code letters are captured.
- **Touch:** tap the 🧱 block counter (or 🪙 coins) **5 times fast** → the
  **🎬 Secret Move Lab** opens with a button for every move the hero knows.
- `RUN` grants an 8-second super-speed sprint with the Running clip. The codes
  work on any model avatar that has the matching clip — Leo knows all five.

Skeletal animation data is small — extras barely grow the file. Export ONE GLB with
all clips included ("bake/include animations" in the export dialog).

## ✏️ Redo checklist for the reference image (learned from Leo v1)

Ask ChatGPT for: *front view + side view + BACK view, full body, standing in a
neutral A-pose, arms relaxed slightly away from the body, open relaxed hands (NOT
on hips, NOT in pockets), gentle soft smile with the mouth closed, cute 3D cartoon
style for kids, plain white background.* The pose and expression are baked in from
this image — fix them here, not in Meshy.

💡 Field-tested: feeding Meshy the **side and back profiles too** cures the
"squishy head" — the extra angles give it solid geometry to work from, and the
auto-rig weights come out much cleaner.
