# 🎬 Grammar Cinema — movie uploads

Drop your generated Grammar Cinema clips **here**, in this `shots/cinema/` folder.
The game plays whatever it finds; if a file is missing it just shows the movie
title card instead, so nothing breaks while you fill these in.

## File names (this is the important part)

Each movie looks for **one exact file name**. Name it exactly like the table —
all lowercase, `.mp4` — or the game won't find it.

| Movie                      | Upload this file        |
| -------------------------- | ----------------------- |
| 🦖 Dino Day Out            | `dino.mp4`              |
| 🚀 Rocket to the Moon      | `rocket.mp4`            |
| 🐶 The Puppy Detective     | `puppy.mp4`             |
| 🏰 The Brave Knight        | `knight.mp4`            |
| 🦄 Fiona and the Unicorns  | `unicorn.mp4`           |
| 🐴 Clumsy Cassie the Pony  | `pony.mp4`              |

So the unicorn clip goes here as `shots/cinema/unicorn.mp4`.

## ⚠️ Keep each file UNDER 25 MB

Cloudflare (where stackadoo.com is hosted) **rejects any single file over 25 MB**,
so a deploy with a 30 MB movie will fail. Aim for **under 10 MB** so the clip
also loads fast on a phone.

The rainbow unicorn film you generated is **32.7 MB — too big as-is.** Compress it
first. Easy options:

- **HandBrake** (free, Mac/Windows): open the clip → preset **"Web → Gmail Small
  720p30"** (or **Fast 720p30**) → Export. That alone usually lands it well under 10 MB.
- **Online**: freeconvert.com or cloudconvert.com → "Compress Video" → target ~8 MB.
- **ffmpeg** (if you have it):
  ```
  ffmpeg -i unicorn-original.mp4 -vf scale=-2:720 -c:v libx264 -crf 28 -preset slow -c:a aac -b:a 96k unicorn.mp4
  ```

These clips are short (10–30s) and kids watch on phones, so 720p is plenty — the
voxel art still looks crisp.

## Uploading on GitHub (no command line needed)

1. Open this folder on github.com (`shots/cinema/`).
2. Click **Add file → Upload files**.
3. Drag in your compressed `.mp4` (named per the table above).
4. **Commit** — that triggers a deploy and the movie goes live.

That's it. Tap a movie in Grammar Cinema and it plays with sound.
