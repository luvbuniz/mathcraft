# 🎨 Real 3D character models (the Meshy weekend guide)

Drop a model file in this folder named after the hero's avatar id and the game
**upgrades that hero automatically** — no code changes. The procedural avatar
appears instantly, then swaps to your model the moment it loads. No file (or a
broken file, or offline on first visit) → the hero quietly stays procedural.
Ship one character at a time, in any order.

## File names (avatar ids)

| File | Hero | | File | Hero |
| --- | --- | --- | --- | --- |
| `leo.glb` | Leo 👦 | | `fiona.glb` | Fiona 👧 |
| `queenfox.glb` | Queen Fox | | `princess.glb` | Princess |
| `peacock.glb` | Peacock | | `unicorn.glb` | Unicorn Dancer |
| `tiger.glb` | Tiger | | `dragon.glb` | Dragon |
| `deer.glb` | Deer | | `kinglion.glb` | King Lion |
| `piratecat.glb` | Pirate Cat | | `ninjadog.glb` | Ninja Dog |
| `robot.glb` | Robot | | `astronaut.glb` | Astronaut |
| `wizard.glb` | Wizard | | `panda.glb` | Panda |
| `penguin.glb` | Penguin | | `bunny.glb` | Bunny |
| `superhero.glb` | Superhero | | `spark.glb` | Spark the Fairy |
| `knight.glb` | Knight | | `trex.glb` | T-Rex |

## Meshy checklist (per character)

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

- **Faces are static** on models for now (the procedural kids' animated
  smiles/frowns don't carry over). The plan for expressive models: paint 3–4
  face-texture variants (happy/grin/sad/blink) or add Blender morph targets —
  ask Claude to wire either once you have a model you love.
- Models don't sit in cars or on chairs yet — they stand/idle instead. Cosmetic;
  we can add poses later.
- Keep the source renders you fed Meshy! When you generate more of the cast
  later, feeding the same style keeps everyone looking like one family.
