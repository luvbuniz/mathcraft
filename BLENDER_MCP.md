# 🧊 Blender MCP — setup (run this on your laptop)

Lets Claude Code drive Blender directly: create/move objects, set materials,
inspect the scene, run Python in Blender.

> **This only works on the machine Blender is installed on.** The MCP server
> talks to a socket the Blender addon opens on `localhost:9876`. A Claude Code
> session running in the cloud has no route to your laptop's localhost, so the
> Blender MCP must be used from Claude Code **running locally in this repo**.

`.mcp.json` at the repo root is already committed, so once the addon is
installed, opening Claude Code in this folder picks the server up automatically.

---

## One-time setup (~5 min)

### 1. Install `uv`
Use the official installer — **not** `pip install uv`.

| Platform | Command |
| --- | --- |
| macOS | `brew install uv` |
| Windows | `powershell -c "irm https://astral.sh/uv/install.ps1 \| iex"` |
| Linux | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |

### 2. Install the Blender addon
```sh
uvx blender-mcp install-addon
```
Then in Blender: **Edit → Preferences → Add-ons**, search **"MCP for Blender"**,
enable it. (Requires Blender 3.0+.)

### 3. Start the server inside Blender
In the 3D viewport press **N** → **MCP for Blender** tab → **Start MCP Server**.

### 4. Open Claude Code in this repo
```sh
cd path/to/mathcraft
claude
```
Approve the `blender` server when prompted, then check with `/mcp`. You should
see it connected at `localhost:9876`.

---

## Gotchas
- **Don't** run `uvx blender-mcp` yourself in a terminal while Claude Code is
  running — the client launches it, and two copies fight over the socket.
- If it won't connect: disable and re-enable the addon in Preferences (or
  restart Blender), then **Start MCP Server** again.
- Override the target with `BLENDER_HOST` / `BLENDER_PORT` env vars. Leave these
  alone unless you know why you're changing them — the addon executes arbitrary
  Python inside Blender, so exposing that port beyond localhost is a remote code
  execution hole on your own machine.

---

## Note on Leo
The in-game Leo is **not** a 3D model file — there are no `.glb`/`.blend` assets
in this repo. He's procedural Three.js box geometry built in `play.html`
(avatar defined around the `id: 'leo'` entry, on the shared `buildBiped()`
helper). Fixing his hunched shoulders and stiff animation is a **code** change
in `play.html`, not a Blender job.

Blender is the right tool if you want to go the other way: sculpt a proper Leo,
rig him, export `.glb`, and load him with a `GLTFLoader` — which would be a new
asset pipeline the game doesn't have yet.

Upstream project: https://github.com/ahujasid/blender-mcp
