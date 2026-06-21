# 🎞️ Library Movie Collection — cartoon uploads

Kids **unlock** these cartoons by finishing Library books, then rewatch them in
the in-game "🎞️ My Movie Collection" (inside the Library).

Drop each finished cartoon here with the EXACT filename below. Until a file
exists, the game shows a "🎬 Coming soon" card for that slot — so nothing breaks
while you fill them in.

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
