# ⛏️ Stackadoo — Build with Math!

Stackadoo is a **3D voxel-style math game** for kids in **grades 2–5**. A
bright, blocky world, completely original, where the core loop is **solve math
→ earn blocks → build structures**.

Everything lives in a single `index.html` file — all the 3D graphics, sounds,
and game logic are generated in code (Three.js r128 + the Web Audio API).
No images, models, or audio files to download.

## 🎮 How to play

1. **Pick your grade** (2–5) — this sets how hard the math is.
2. **Pick a game mode** (see below).
3. **Pick your hero** from seven cute voxel avatars.
4. Walk up to a glowing **❓ math station** and solve the equation by
   **finding the right block** — tap the answer block from a few choices.
   Then **pick your reward** (wood blocks, stone blocks, coins, or
   softballs) — it's added straight to your counter, no pickup needed.
5. Press **D** to put a block down on the square in front of you. Blocks
   snap to a grid and stack automatically, so building walls is easy.
6. Spend your coins at **🛒 Stack Mart** (follow the signpost, or press
   **B**): doors, windows, **roof tiles**, furniture (chairs, tables, beds,
   lamps, a **stove & oven** + sink, a bathtub & shower, garden planters,
   bushes, flowers), **cooking items** (pots, frying pans, bacon, pies), a
   tree ladder, and more.

   **Roofs:** stack roof tiles on top of your walls for a peaked roof.
   **Cooking:** aim at your stove (tap its top) and place a pot, pan, or
   bacon on a burner to make it steam and sizzle — or put a pie in to bake
   in the glowing oven.

**Learning, not guessing:** equations are freshly generated every time —
never the same problem twice in a session. A wrong answer brings up a
**brand-new question** so answers can't be found by elimination, and after
three misses the game takes a friendly 8-second breather and shows the
hint. Stuck? The **🤔 hint button** teaches the place-value way to solve it
("Tens first: 40 + 20 = 60, then the ones…") without giving the answer
away.

## 🗺️ Game modes

There are two modes, and both let you build, shop, climb trees, and pick
berries:

| Mode | What happens |
| --- | --- |
| 🌳 **Build Mode** | Relaxed, open-ended building — no timer, no monsters. Solve math at the ❓ stations and **pick your reward** each time (see below), shop for furniture and gear, climb trees for berries, and build whatever you like. |
| ⏰ **Shelter Rush** | Pick a timer (**5, 10, or 15 minutes** — there's a countdown bar in the HUD) and build a shelter before it runs out: walls all the way around you plus a **🚪 door**. If time runs out the **Gloomies** come — grumpy purple monsters that waddle toward you. They start **slow and few**, then grow **faster and more numerous** as the night goes on, and they can **climb a step at a time** (so a single staircase won't escape them — build real walls!). Get caught outside a shelter and it's game over. A fully enclosed shelter with a door = **SAFE** (you win!). Doing math **freezes the Gloomies**, and every **3 correct answers earns a 🛡️ shield**. You also get a math-earned **ball shooter**: choose **⚽ softballs** as your reward, then press **F** (or tap **🎯**) to bonk a Gloomy back to the edge. **⚡ Power Blocks** are a rare drop (about one per 10 problems solved) that zap nearby Gloomies — they only appear in this mode. |

**Pick your reward:** every correct answer lets you choose what you earn —
**🟫 wood blocks**, **🩶 stone blocks** (a different color), **🪙 coins** to
spend at Stack Mart, or (in Shelter Rush) **⚽ softballs**. Choosing a block
color also sets the color of the blocks you place next.

Stack Mart is open in **both** modes (press **B**); **doors are bought there**
for coins. To place a door, chair, table, or other item, open your **🎒
backpack (I)**, tap **Place**, then press **D** where you want it.

## 🦊 The heroes

Seven blocky, procedurally built avatars to choose from — and the
four-legged animals really walk on four legs:

- **Queen Fox** 👑 — orange & white on four paws, bushy white-tipped tail, tiny crown
- **Princess** 👸 — gown, crown, and a gem brooch
- **Peacock** 🦚 — blue & green with a full fan of tail feathers
- **Unicorn Dancer** 🦄 — a real little horse with a horn and pastel mane, prancing and twirling
- **Tiger** 🐯 — orange with black stripes across its back and a black-tipped tail
- **Dragon** 🐉 — green on four legs, red wings, spine spikes, and a long red-tipped tail
- **Deer** 🏅 — the sporty one: antlers, fawn spots, a headband, and a team jersey on its back

## 🕹️ Controls

**Keyboard + mouse (laptop/desktop):**

| Input | Action |
| --- | --- |
| `↑` / `↓` | Walk forward / backward (`W`/`S` work too) |
| `←` / `→` | Turn left / right — no mouse needed! |
| `Space` | Jump (hold near a tree trunk to climb, if you own the ladder) |
| `P` | **Pick up** the nearest thing: loot blocks, berries (Store Mode), apples, or your own builds |
| `D` | **Put down** the selected item on the square in front of you (blocks stack into walls) |
| `R` | **Remove** the nearest thing you placed (it goes back in your backpack) |
| `I` | Open your **🎒 backpack/inventory** — see your stuff and place furniture |
| `1` / `2` | Quick-select block 🧱 or door 🚪 (or choose any item in the 🎒 backpack) |
| `E` | Use a math station / open Stack Mart |
| `B` | Open 🛒 Stack Mart — blocks, doors, roof tiles, furniture, cooking items, gear |
| `C` | Toggle camera: 🧍 see your character / 👁️ look through their eyes |
| `F` | Throw a softball at the Gloomies (Shelter Rush, after the timer ends) |
| Mouse (optional) | Click the game to look around; left-click places, right-click removes |

On-screen buttons (top-right corner): **🔊** sound, **🧍/👁️** view, **🏠**
save & go home, **💾** save, **🎒** backpack, and **📸** take a photo of
your build (saves a picture you can keep or share). They work with a tap too.

**🎨 Paint:** open the backpack and pick a paint color, then the blocks you
place come out in that color — great for decorating houses.

**Touch (tablet):** on-screen joystick to move, drag the screen to look,
**tap** to place/break (toggle with the 🧱/⛏️ button), plus JUMP and ⭐ USE
buttons.

A **🔊 sound toggle** lives in the top-right corner — handy for classrooms.
All sound effects (footsteps, block thunks, berry pops, happy chimes, coin
sounds, Gloomy hisses, and a satisfying *bonk* when you hit one with a
softball…) are synthesized live with the Web Audio API.

## 🎒 Backpack & furniture

Press **I** (or tap **🎒**) to open your backpack. It shows everything you
have — blocks, doors, windows, roof tiles, coins, berries, apples,
furniture, cooking items, and gear. Furniture includes a **chair, picnic
table, bed, lamp, fence, flower**, a kitchen **🔥 stove & oven** and **🚰
sink**, a bathroom **🛁 bathtub** and **🚿 shower**, and backyard **🌱 garden
planters** and **🌳 bushes**. Pick any item, press **Place**, then walk
where you want it and press **D** (or tap the ground) to set it down. Put
an apple right on top of a table for a snack scene!  Anything you place can
be picked back up with **P** or **R**.

**🍳 Cooking:** set a **🍲 pot**, **🍳 frying pan**, or **🥓 bacon** on a stove
burner (aim at the stove and tap its top) to watch it steam and sizzle, or
slide a **🥧 pie** into the oven and it bakes with a warm glow. **🔺 Roof
tiles** stack on top of your walls to cap a house with a peaked roof.

## 💾 Saving with your name, and badges

Type your **name** on the start screen and the game keeps a personal save
just for you — it **auto-saves every few seconds**, plus there's a **💾
Save** button and a **🏠 Home** button right in the game (Home saves first,
then returns to the menu). Each saved world shows up as its own row on the
start screen, so several kids can share one device and keep separate
worlds. Tap a name to keep building, or press **Start Adventure** for a
brand-new world.

Each player also has their own **badge collection** that grows across
games. Tap the **🏅 Badges** button any time to open (and close) the badge
panel:

| Solved | Badge |
| --- | --- |
| 5 | ⭐ Math Star |
| 10 | 🎩 Fancy Top Hat — your hero wears it! |
| 20 | 👑 Golden Crown — your hero wears it! |
| 35 | 🏆 Math Champion |

## 🧑‍🏫 For grown-ups — progress tracking

On the start screen, tap **🧑‍🏫 For Grown-Ups** to open a progress
dashboard (for parents & teachers). It shows one card per player, each with:

- problems solved and **accuracy %**
- total **time played** and badges earned
- a breakdown **by grade**
- a **bar chart by skill** (addition, subtraction, multiplication,
  division, fractions, decimals, money, rounding, word problems, etc.)

Everything is stored privately in the browser on that device. Each player
card has a **Reset progress** button.

## 📚 Grade levels & question variety

Every prompt is freshly generated and never repeats in a session. Beyond
the core operations, kids also get missing-number puzzles, word problems,
rounding, multi-step problems, area & perimeter, order of operations,
percents, and money — scaled to the grade band:

| Grade | Math |
| --- | --- |
| 2 | Addition & subtraction within 100 |
| 3 | Add/subtract within 1000, intro multiplication (×1–×10) |
| 4 | Multi-digit multiplication & division |
| 5 | Larger multiplication, simple fractions & decimals |

## 🚀 Setup & running

It's one file — there's nothing to build or install.

**Run locally:** download `index.html` and double-click it (any modern
browser). An internet connection is only needed the first time, to load the
Three.js library from its CDN.

**Host on GitHub Pages:**

1. Push this repository to GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under *Build and deployment*, choose **Deploy from a branch**, pick your
   default branch and the `/ (root)` folder, then **Save**.
4. After a minute, your game is live at
   `https://<your-username>.github.io/<repo-name>/`.

## 🛠️ Tech notes

- [Three.js r128](https://cdnjs.com/libraries/three.js/r128) with custom
  camera & movement controls (no OrbitControls), box/cylinder/sphere
  geometry only.
- Voxel terrain rendered with a single `InstancedMesh`; placed blocks are
  grid-snapped with simple AABB collision.
- Web Audio API for all procedural sound — audio starts after the first
  tap/click to respect browser autoplay rules.
- Designed to run smoothly on a laptop or tablet.

Made for young builders — be kind, build big, and have fun! 🧱✨
