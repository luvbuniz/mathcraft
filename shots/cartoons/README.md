# 🎞️ Library Movie Collection — cartoon uploads

Kids **unlock** these cartoons by finishing Library books, then rewatch them in
the in-game "🎞️ My Movie Collection" (inside the Library).

Drop each finished cartoon here with the EXACT filename below. A cartoon only
appears in the collection (and can only be unlocked) once its file exists: the
game checks for the file when the Library opens, and reels flagged `ready: true`
in the `CARTOONS` list are always on. Until then kids just see "More cartoons are
on the way!" — never a dead-end "Coming soon" screen. After uploading, set
`ready: true` on that entry so it doesn't depend on the check.

| Cartoon                       | Upload this file     |
| ----------------------------- | -------------------- |
| 🍦 Leo and the Ice Cream Man  | `icecream.mp4`       |
| 🛝 The Great Water Slide      | `waterslide.mp4`     |
| 🚒 Leo and the Fire Truck     | `firetruck.mp4`      |
| 🦄 Fiona and the Unicorns     | `unicorn.mp4`        |
| 🎡 A Day at the Carnival      | `carnival.mp4`       |
| 🪙 The Magic Stackadoo Coin   | `coin.mp4`           |

## ⚠️ Keep each file UNDER 25 MB
Cloudflare rejects any single file over 25 MB. Compress with HandBrake (the
"Fast 720p30" preset) — aim for under 10 MB so it loads fast on phones.

To add more cartoons to the collection, add them to the `CARTOONS` list in
play.html (id + title + emoji) and drop the matching `<id>.mp4` here.

**Encoding (PR #497 retest):** export clips "fast start" so they begin playing before the whole
file downloads — `ffmpeg -i in.mp4 -c copy -movflags +faststart <id>.mp4` (lossless). Add a
poster frame as `<id>.jpg` (e.g. `ffmpeg -ss 0.6 -i <id>.mp4 -frames:v 1 -vf scale=360:-2 <id>.jpg`)
and set `poster: true` on the reel in `CARTOONS`.
