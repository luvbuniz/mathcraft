# ⛏️ MathCraft — Build with Math!

MathCraft is a **3D voxel-style math game** for kids in **grades 2–5**. It's
Minecraft-inspired but completely original: a bright, blocky world where the
core loop is **solve math → earn blocks → build structures**.

Everything lives in a single `index.html` file — all the 3D graphics, sounds,
and game logic are generated in code (Three.js r128 + the Web Audio API).
No images, models, or audio files to download.

## 🎮 How to play

1. **Pick your grade** (2–5) — this sets how hard the math is.
2. **Pick a game mode** (see below).
3. **Pick your hero** from seven cute voxel avatars.
4. Walk up to a glowing **❓ math station** and solve the equation by
   **finding the right block** — tap the answer block from a few choices.
   When you pick the correct one, **5 blocks pop onto the ground** around
   you!
5. Walk over and press **P** to pick them up, then press **D** to put a
   block down on the square in front of you. Blocks snap to a grid and
   stack automatically, so building walls is easy.

Equations are **freshly generated every time** — you'll never see the same
problem twice in a session. Wrong answers are no big deal — you just get a
friendly "try again!" (In Store Mode, harder equations earn more coins.)

## 🗺️ Game modes

| Mode | What happens |
| --- | --- |
| 🌼 **Relaxed Mode** | No timer, no enemies. Solve math, earn blocks, build anything you like. |
| ⏰ **Creeper Mode** | You have **15 minutes** to earn enough blocks and build a shelter — walls all the way around you, plus a **🚪 door**. If the timer runs out first… creepers spawn and chase you! Fully enclosed shelter with a door = **SAFE** (and you win!). |
| 🏪 **Level 2: Store Mode** | Correct answers earn **🪙 coins** instead of blocks. Spend them at the Block Shop on a **🪜 ladder** (climb trees and pick berries!), speedy shoes, bouncy boots, and a party hat. Sell your berries back for more coins! |

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
| `P` | **Pick up** the nearest block (loot from math, or your own builds) |
| `D` | **Put down** a block on the square in front of you (stacks into walls) |
| `1` / `2` | Select block 🧱 or door 🚪 (a door costs 4 blocks) |
| `E` | Use a math station / open the shop |
| `B` | Open the shop (Store Mode) |
| `C` | Toggle first-person / third-person camera |
| Mouse (optional) | Click the game to look around; left-click places, right-click removes |

**Touch (tablet):** on-screen joystick to move, drag the screen to look,
**tap** to place/break (toggle with the 🧱/⛏️ button), plus JUMP and ⭐ USE
buttons.

A **🔊 sound toggle** lives in the top-right corner — handy for classrooms.
All sound effects (footsteps, block thunks, berry pops, happy chimes, coin
sounds, creeper hisses…) are synthesized live with the Web Audio API.

## 📚 Grade levels

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
